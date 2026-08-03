import { desc, eq } from 'drizzle-orm';
import { CronJob } from 'cron';
import type { Database } from '../database/client';
import { Job } from './entities/job.entity';
import type { JobAgentService } from '../ai/job-agent.service';
import { SchedulerRegistry } from './scheduler-registry';

export class JobService {
  constructor(
    private readonly entityManager: Database,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly jobAgentService: JobAgentService,
  ) {}

  async onApplicationBootstrap() {
    const enabledJobs = await this.entityManager.select().from(Job).where(eq(Job.isEnabled, true));
    const cronJobs = this.schedulerRegistry.getCronJobs();
    const intervals = this.schedulerRegistry.getIntervals();
    const timeouts = this.schedulerRegistry.getTimeouts();

    for (const job of enabledJobs) {
      const alreadyRegistered =
        (job.type === 'cron' && cronJobs.has(job.id)) ||
        (job.type === 'every' && intervals.includes(job.id)) ||
        (job.type === 'at' && timeouts.includes(job.id));
      if (alreadyRegistered) continue;

      await this.startRuntime(job);
    }
  }

  async listJobs() {
    const records = await this.entityManager.select().from(Job).orderBy(desc(Job.createdAt));
    const cronJobs = this.schedulerRegistry.getCronJobs();
    const intervalNames = this.schedulerRegistry.getIntervals();
    const timeoutNames = this.schedulerRegistry.getTimeouts();

    return records.map((job) => {
      const running =
        job.isEnabled &&
        ((job.type === 'cron' && cronJobs.has(job.id)) ||
          (job.type === 'every' && intervalNames.includes(job.id)) ||
          (job.type === 'at' && timeoutNames.includes(job.id)));

      return { ...job, running };
    });
  }

  async addJob(
    input:
      | { type: 'cron'; instruction: string; cron: string; isEnabled?: boolean }
      | { type: 'every'; instruction: string; everyMs: number; isEnabled?: boolean }
      | { type: 'at'; instruction: string; at: Date; isEnabled?: boolean },
  ) {
    const [saved] = await this.entityManager
      .insert(Job)
      .values({
        instruction: input.instruction,
        type: input.type,
        cron: input.type === 'cron' ? input.cron : null,
        everyMs: input.type === 'every' ? input.everyMs : null,
        at: input.type === 'at' ? input.at : null,
        isEnabled: input.isEnabled ?? true,
        lastRun: null,
      })
      .returning();

    if (!saved) throw new Error('Failed to create job');
    if (saved.isEnabled) await this.startRuntime(saved);
    return saved;
  }

  async toggleJob(jobId: string, enabled?: boolean) {
    const [job] = await this.entityManager.select().from(Job).where(eq(Job.id, jobId)).limit(1);
    if (!job) throw new Error(`Job not found: ${jobId}`);

    const nextEnabled = enabled ?? !job.isEnabled;
    if (job.isEnabled !== nextEnabled) {
      job.isEnabled = nextEnabled;
      await this.entityManager
        .update(Job)
        .set({ isEnabled: nextEnabled, updatedAt: new Date() })
        .where(eq(Job.id, job.id));
    }

    if (job.isEnabled) await this.startRuntime(job);
    else this.stopRuntime(job);
    return job;
  }

  private async startRuntime(job: Job) {
    if (job.type === 'cron') {
      const cronJobs = this.schedulerRegistry.getCronJobs();
      const existing = cronJobs.get(job.id);
      if (existing) {
        existing.start();
        return;
      }

      const runtimeJob = this.createCronJob(job);
      this.schedulerRegistry.addCronJob(job.id, runtimeJob);
      runtimeJob.start();
      return;
    }

    if (job.type === 'every') {
      const names = this.schedulerRegistry.getIntervals();
      if (names.includes(job.id)) return;
      if (typeof job.everyMs !== 'number' || job.everyMs <= 0) {
        throw new Error(`Invalid everyMs for job ${job.id}`);
      }

      const ref = setInterval(async () => {
        console.log(`run job ${job.id}, ${job.instruction}`);
        await this.entityManager.update(Job).set({ lastRun: new Date() }).where(eq(Job.id, job.id));
        try {
          const result = await this.jobAgentService.runJob(job.instruction);
          console.log(`[job ${job.id}] ${result}`);
        } catch (error) {
          console.error(`job ${job.id} agent execution error: ${(error as Error).message}`);
        }
      }, job.everyMs);

      this.schedulerRegistry.addInterval(job.id, ref);
      return;
    }

    if (job.type === 'at') {
      const names = this.schedulerRegistry.getTimeouts();
      if (names.includes(job.id)) return;
      if (!job.at) throw new Error(`Invalid at for job ${job.id}`);

      const delay = Math.max(0, job.at.getTime() - Date.now());
      const ref = setTimeout(async () => {
        console.log(`run job ${job.id}, ${job.instruction}`);
        await this.entityManager
          .update(Job)
          .set({
            lastRun: new Date(),
            isEnabled: false, // at 类型只执行一次：执行完自动停用
          })
          .where(eq(Job.id, job.id));

        try {
          const result = await this.jobAgentService.runJob(job.instruction);
          console.log(`[job ${job.id}] ${result}`);
        } catch (error) {
          console.error(`job ${job.id} agent execution error: ${(error as Error).message}`);
        }

        try {
          this.schedulerRegistry.deleteTimeout(job.id);
        } catch {
          // ignore
        }
      }, delay);

      this.schedulerRegistry.addTimeout(job.id, ref);
    }
  }

  private stopRuntime(job: Job) {
    if (job.type === 'cron') {
      const runtimeJob = this.schedulerRegistry.getCronJobs().get(job.id);
      if (runtimeJob) runtimeJob.stop();
      return;
    }

    if (job.type === 'every') {
      try {
        this.schedulerRegistry.deleteInterval(job.id);
      } catch {
        // ignore
      }
      return;
    }

    if (job.type === 'at') {
      try {
        this.schedulerRegistry.deleteTimeout(job.id);
      } catch {
        // ignore
      }
    }
  }

  private createCronJob(job: Job) {
    const cronExpr = job.cron ?? '';
    return new CronJob(cronExpr, async () => {
      console.log(`run job ${job.id}, ${job.instruction}`);
      await this.entityManager.update(Job).set({ lastRun: new Date() }).where(eq(Job.id, job.id));
      try {
        const result = await this.jobAgentService.runJob(job.instruction);
        console.log(`[job ${job.id}] ${result}`);
      } catch (error) {
        console.error(`job ${job.id} agent execution error: ${(error as Error).message}`);
      }
    });
  }
}
