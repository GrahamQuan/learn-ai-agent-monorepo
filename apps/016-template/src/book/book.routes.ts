import { Hono } from 'hono';
import { createBookRepository } from './book.repository';
import { BookService } from './book.service';
import type { CreateBookDto, UpdateBookDto } from './book.types';

export function createBookRoutes(service = new BookService(createBookRepository())) {
  const routes = new Hono();

  routes.post('/', async (c) => {
    const body = await c.req.json<CreateBookDto>();
    return c.text(service.create(body));
  });

  routes.get('/', (c) => c.json(service.findAll()));

  routes.get('/:id', (c) => c.text(service.findOne(Number(c.req.param('id')))));

  routes.patch('/:id', async (c) => {
    const body = await c.req.json<UpdateBookDto>();
    return c.text(service.update(Number(c.req.param('id')), body));
  });

  routes.delete('/:id', (c) => c.text(service.remove(Number(c.req.param('id')))));

  return routes;
}
