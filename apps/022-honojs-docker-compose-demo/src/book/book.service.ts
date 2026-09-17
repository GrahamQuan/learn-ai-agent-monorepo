import { desc, eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import type { Database } from '../db';
import { books, type Book } from '../db/schema/book.entity';
import type { CreateBookDto } from './dto/create-book.dto';
import type { UpdateBookDto } from './dto/update-book.dto';

export class BookService {
  constructor(private readonly entityManager: Database) {}

  async create(createBookDto: CreateBookDto) {
    const [book] = await this.entityManager
      .insert(books)
      .values({
        ...createBookDto,
        publishedAt: new Date(createBookDto.publishedAt),
      })
      .returning();
    return book;
  }

  async findAll() {
    return this.entityManager.select().from(books).orderBy(desc(books.id));
  }

  async findOne(id: number) {
    const [book] = await this.entityManager
      .select()
      .from(books)
      .where(eq(books.id, id))
      .limit(1);
    if (!book) {
      throw new HTTPException(404, {
        res: Response.json(
          {
            message: `Book #${id} not found`,
            error: 'Not Found',
            statusCode: 404,
          },
          { status: 404 },
        ),
      });
    }
    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    const book = await this.findOne(id);
    const { publishedAt, ...restPayload } = updateBookDto;
    const updatePayload: Partial<Book> = { ...restPayload };

    if (publishedAt !== undefined) {
      updatePayload.publishedAt = new Date(publishedAt);
    }

    const mergedBook = { ...book, ...updatePayload, updatedAt: new Date() };
    const [savedBook] = await this.entityManager
      .update(books)
      .set(mergedBook)
      .where(eq(books.id, id))
      .returning();
    return savedBook;
  }

  async remove(id: number) {
    const book = await this.findOne(id);
    await this.entityManager.delete(books).where(eq(books.id, book.id));
    return { deleted: true };
  }
}
