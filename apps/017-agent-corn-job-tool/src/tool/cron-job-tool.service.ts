import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { JobService } from '../job/job.service';

export class CronJobToolService {
  readonly tool;

  constructor(private readonly jobService: JobService) {
    const cronJobArgsSchema = z.object({
      action: z.enum(['list', 'add', 'toggle']).describe('要执行的操作：list、add、toggle'),
      id: z.string().optional().describe('任务 ID（toggle 时需要）'),
      enabled: z.boolean().optional().describe('是否启用（toggle 可选；不传则自动取反）'),
      type: z.enum(['cron', 'every', 'at']).optional(),
      instruction: z.string().optional().describe('去掉定时部分后的自然语言任务内容'),
      cron: z.string().optional().describe('Cron 表达式（type=cron 时需要）'),
      everyMs: z.number().int().positive().optional().describe('固定间隔毫秒'),
      at: z.string().optional().describe('指定触发时间点 ISO 字符串'),
    });

    this.tool = tool(
      async ({ action, id, enabled, type, instruction, cron, everyMs, at }) => {
        switch (action) {
          case 'list': {
            const jobs = await this.jobService.listJobs();
            if (!jobs.length) return '当前没有任何定时任务。';
            const lines = jobs
              .map(
                (job) =>
                  `id=${job.id} type=${job.type} enabled=${job.isEnabled} running=${job.running} cron=${job.cron ?? ''} everyMs=${job.everyMs ?? ''} at=${job.at?.toISOString() ?? ''} instruction=${job.instruction}`,
              )
              .join('\n');
            return `当前定时任务列表（type 说明：cron=按表达式循环；every=按间隔循环；at=到点执行一次后自动停用）：\n${lines}`;
          }
          case 'add': {
            if (!type) return '新增任务需要提供 type（cron/every/at）。';
            if (!instruction) return '新增任务需要提供 instruction。';
            if (type === 'cron') {
              if (!cron) return 'type=cron 时需要提供 cron。';
              const created = await this.jobService.addJob({ type, instruction, cron });
              return `已新增定时任务：id=${created.id} type=cron cron=${created.cron} enabled=${created.isEnabled}`;
            }
            if (type === 'every') {
              if (typeof everyMs !== 'number' || everyMs <= 0) {
                return 'type=every 时需要提供 everyMs（正整数，单位毫秒）。';
              }
              const created = await this.jobService.addJob({ type, instruction, everyMs });
              return `已新增定时任务：id=${created.id} type=every everyMs=${created.everyMs} enabled=${created.isEnabled}`;
            }
            if (!at) return 'type=at 时需要提供 at（ISO 时间字符串）。';
            const date = new Date(at);
            if (Number.isNaN(date.getTime())) return 'type=at 的 at 不是合法的 ISO 时间字符串。';
            const created = await this.jobService.addJob({ type, instruction, at: date });
            return `已新增定时任务：id=${created.id} type=at at=${created.at?.toISOString() ?? ''} enabled=${created.isEnabled}`;
          }
          case 'toggle': {
            if (!id) return 'toggle 任务需要提供 id。';
            const updated = await this.jobService.toggleJob(id, enabled);
            return `已更新任务状态：id=${updated.id} enabled=${updated.isEnabled}`;
          }
          default:
            return `不支持的操作: ${action}`;
        }
      },
      {
        name: 'cron_job',
        description:
          '管理服务端定时任务（支持 list/add/toggle）。type=at 到点执行一次；type=every 按毫秒间隔循环；type=cron 按 Cron 表达式循环。',
        schema: cronJobArgsSchema,
      },
    );
  }
}
