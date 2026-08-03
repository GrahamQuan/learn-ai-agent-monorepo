import { JobAgentService } from '../ai/job-agent.service';
import { JobService } from './job.service';

export class JobModule {
  constructor(
    readonly jobService: JobService,
    readonly jobAgentService: JobAgentService,
  ) {}
}
