import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { BookService } from './book.service';
import type { CreateBookDto } from './dto/create-book.dto';
import type { UpdateBookDto } from './dto/update-book.dto';

const parseIntParam = (value: string) => {
  if (!/^-?\d+$/.test(value)) {
    throw new HTTPException(400, {
      res: Response.json(
        {
          message: 'Validation failed (numeric string is expected)',
          error: 'Bad Request',
          statusCode: 400,
        },
        { status: 400 },
      ),
    });
  }

  return Number.parseInt(value, 10);
};

export class BookController {
  readonly routes = new Hono();

  constructor(private readonly bookService: BookService) {
    this.routes.post('/', async (c) =>
      c.json(await this.create(await c.req.json<CreateBookDto>()), 201),
    );
    this.routes.get('/', async (c) => c.json(await this.findAll()));
    this.routes.get('/:id', async (c) =>
      c.json(await this.findOne(parseIntParam(c.req.param('id')))),
    );
    this.routes.patch('/:id', async (c) =>
      c.json(
        await this.update(
          parseIntParam(c.req.param('id')),
          await c.req.json<UpdateBookDto>(),
        ),
      ),
    );
    this.routes.delete('/:id', async (c) =>
      c.json(await this.remove(parseIntParam(c.req.param('id')))),
    );
  }

  create(createBookDto: CreateBookDto) {
    return this.bookService.create(createBookDto);
  }

  findAll() {
    return this.bookService.findAll();
  }

  findOne(id: number) {
    return this.bookService.findOne(id);
  }

  update(id: number, updateBookDto: UpdateBookDto) {
    return this.bookService.update(id, updateBookDto);
  }

  remove(id: number) {
    return this.bookService.remove(id);
  }
}
