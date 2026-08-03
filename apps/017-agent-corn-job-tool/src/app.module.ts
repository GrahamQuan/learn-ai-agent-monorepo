import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import nodemailer from 'nodemailer';
import { ZodError } from 'zod';
import { AiController } from './ai/ai.controller';
import { AiModule, createQueryUserTool } from './ai/ai.module';
import { AiService } from './ai/ai.service';
import { JobAgentService } from './ai/job-agent.service';
import { UserService } from './ai/user.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { db, pool } from './database/client';
import { env } from './env';
import { JobModule } from './job/job.module';
import { JobService } from './job/job.service';
import { SchedulerRegistry } from './job/scheduler-registry';
import { CronJobToolService } from './tool/cron-job-tool.service';
import { DbUsersCrudToolService } from './tool/db-users-crud-tool.service';
import { LlmService } from './tool/llm.service';
import { SendMailToolService } from './tool/send-mail-tool.service';
import { TimeNowToolService } from './tool/time-now-tool.service';
import { ToolModule } from './tool/tool.module';
import { WebSearchToolService } from './tool/web-search-tool.service';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/users.service';

export class AppModule {
  readonly app = new Hono();
  readonly schedulerRegistry = new SchedulerRegistry();
  readonly appController: AppController;
  readonly usersModule: UsersModule;
  readonly toolModule: ToolModule;
  readonly jobModule: JobModule;
  readonly aiModule: AiModule;

  constructor() {
    const appService = new AppService();
    this.appController = new AppController(appService);

    const usersService = new UsersService(db);
    const usersController = new UsersController(usersService);
    this.usersModule = new UsersModule(usersService, usersController);

    const model = new LlmService(env).getModel();
    const mailerService = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
      auth: env.MAIL_USER && env.MAIL_PASS ? { user: env.MAIL_USER, pass: env.MAIL_PASS } : undefined,
    });
    const sendMailToolService = new SendMailToolService(mailerService, env);
    const webSearchToolService = new WebSearchToolService(env);
    const dbUsersCrudToolService = new DbUsersCrudToolService(usersService);
    const timeNowToolService = new TimeNowToolService();

    const jobAgentService = new JobAgentService(
      model,
      sendMailToolService.tool,
      webSearchToolService.tool,
      dbUsersCrudToolService.tool,
      timeNowToolService.tool,
    );
    const jobService = new JobService(db, this.schedulerRegistry, jobAgentService);
    this.jobModule = new JobModule(jobService, jobAgentService);

    const cronJobToolService = new CronJobToolService(jobService);
    this.toolModule = new ToolModule(
      model,
      sendMailToolService.tool,
      webSearchToolService.tool,
      dbUsersCrudToolService.tool,
      timeNowToolService.tool,
      cronJobToolService.tool,
    );

    const userService = new UserService();
    const queryUserTool = createQueryUserTool(userService);
    const aiService = new AiService(
      model,
      queryUserTool,
      sendMailToolService.tool,
      webSearchToolService.tool,
      dbUsersCrudToolService.tool,
      timeNowToolService.tool,
      cronJobToolService.tool,
    );
    const aiController = new AiController(aiService);
    this.aiModule = new AiModule(aiService, aiController, userService, queryUserTool);

    const publicDirectory = relative(process.cwd(), fileURLToPath(new URL('../public', import.meta.url)));
    this.app.use('*', cors());
    this.app.use('/ai-sse-test.html', serveStatic({ root: publicDirectory }));
    this.app.route('/', this.appController.routes);
    this.app.route('/users', usersController.routes);
    this.app.route('/ai', aiController.routes);
    this.app.onError((error, c) => {
      if (error instanceof ZodError) {
        return c.json({ error: 'Validation failed', issues: error.issues }, 400);
      }
      console.error(error);
      return c.json({ error: 'Internal server error' }, 500);
    });
  }

  async onApplicationBootstrap() {
    await pool.query('select 1');
    await this.jobModule.jobService.onApplicationBootstrap();

    // const job = new CronJob(CronExpression.EVERY_SECOND, () => {
    //   console.log('run job');
    // });
    // this.schedulerRegistry.addCronJob('job1', job);
    // job.start();
    // setTimeout(() => {
    //   this.schedulerRegistry.deleteCronJob('job1');
    // }, 5000);

    // const intervalRef = setInterval(() => {
    //   console.log('run interval job');
    // }, 1000);
    // this.schedulerRegistry.addInterval('interval1', intervalRef);
    // setTimeout(() => {
    //   this.schedulerRegistry.deleteInterval('interval1');
    // }, 5000);

    // const timeoutRef = setTimeout(() => {
    //   console.log('run timeout job');
    // }, 3000);
    // this.schedulerRegistry.addTimeout('timeout1', timeoutRef);
    // setTimeout(() => {
    //   this.schedulerRegistry.deleteTimeout('timeout1');
    // }, 5000);
  }

  async close() {
    this.schedulerRegistry.close();
    await pool.end();
  }
}
