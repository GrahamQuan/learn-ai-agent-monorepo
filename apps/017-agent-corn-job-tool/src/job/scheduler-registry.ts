import type { CronJob } from 'cron';

export class SchedulerRegistry {
  private readonly cronJobs = new Map<string, CronJob>();
  private readonly intervals = new Map<string, ReturnType<typeof setInterval>>();
  private readonly timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  getCronJobs() {
    return this.cronJobs;
  }

  addCronJob(name: string, job: CronJob) {
    this.cronJobs.set(name, job);
  }

  deleteCronJob(name: string) {
    const job = this.cronJobs.get(name);
    if (!job) throw new Error(`Cron job not found: ${name}`);
    job.stop();
    this.cronJobs.delete(name);
  }

  getIntervals() {
    return [...this.intervals.keys()];
  }

  addInterval(name: string, interval: ReturnType<typeof setInterval>) {
    this.intervals.set(name, interval);
  }

  deleteInterval(name: string) {
    const interval = this.intervals.get(name);
    if (!interval) throw new Error(`Interval not found: ${name}`);
    clearInterval(interval);
    this.intervals.delete(name);
  }

  getTimeouts() {
    return [...this.timeouts.keys()];
  }

  addTimeout(name: string, timeout: ReturnType<typeof setTimeout>) {
    this.timeouts.set(name, timeout);
  }

  deleteTimeout(name: string) {
    const timeout = this.timeouts.get(name);
    if (!timeout) throw new Error(`Timeout not found: ${name}`);
    clearTimeout(timeout);
    this.timeouts.delete(name);
  }

  close() {
    for (const name of [...this.cronJobs.keys()]) this.deleteCronJob(name);
    for (const name of [...this.intervals.keys()]) this.deleteInterval(name);
    for (const name of [...this.timeouts.keys()]) this.deleteTimeout(name);
  }
}
