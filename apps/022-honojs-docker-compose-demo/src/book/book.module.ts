import type { BookController } from './book.controller';
import type { BookService } from './book.service';

export class BookModule {
  constructor(
    readonly bookService: BookService,
    readonly bookController: BookController,
  ) {}
}
