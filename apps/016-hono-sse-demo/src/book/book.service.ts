import type { BookRepository } from './book.repository';
import type { CreateBookDto, UpdateBookDto } from './book.types';

export class BookService {
  constructor(private readonly bookRepository: BookRepository) {}

  create(createBookDto: CreateBookDto): string {
    void createBookDto;
    return 'This action adds a new book';
  }

  findAll() {
    return this.bookRepository.findAll();
  }

  findOne(id: number): string {
    return `This action returns a #${id} book`;
  }

  update(id: number, updateBookDto: UpdateBookDto): string {
    void updateBookDto;
    return `This action updates a #${id} book`;
  }

  remove(id: number): string {
    return `This action removes a #${id} book`;
  }
}
