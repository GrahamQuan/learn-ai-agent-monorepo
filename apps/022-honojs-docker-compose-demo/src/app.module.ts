import { resolve } from 'node:path';
import { serveStatic } from '@hono/node-server/serve-static';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Hono } from 'hono';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookController } from './book/book.controller';
import { BookModule } from './book/book.module';
import { BookService } from './book/book.service';
import { db, pool } from './db';

export class AppModule {
  readonly app = new Hono();
  readonly appController: AppController;
  readonly bookModule: BookModule;

  constructor() {
    const appService = new AppService();
    this.appController = new AppController(appService);

    const bookService = new BookService(db);
    const bookController = new BookController(bookService);
    this.bookModule = new BookModule(bookService, bookController);

    this.app.get('/books', serveStatic({ path: 'public/index.html' }));
    this.app.use(
      '/books/*',
      serveStatic({
        root: 'public',
        rewriteRequestPath: (path) => path.replace(/^\/books/, ''),
      }),
    );
    this.app.route('/', this.appController.routes);
    this.app.route('/book', this.bookModule.bookController.routes);
  }

  async onApplicationBootstrap() {
    await migrate(db, { migrationsFolder: resolve(process.cwd(), 'drizzle') });
  }

  async close() {
    await pool.end();
  }
}
