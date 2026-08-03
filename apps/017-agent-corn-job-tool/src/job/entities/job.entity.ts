import {
  jobs,
  type Job as JobRow,
  type JobType as JobTypeValue,
  type NewJob as NewJobRow,
} from '../../database/schema/job.schema';

export const Job = jobs;
export type Job = JobRow;
export type JobType = JobTypeValue;
export type NewJob = NewJobRow;
