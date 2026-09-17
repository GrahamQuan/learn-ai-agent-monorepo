import type { CreateBookDto } from './create-book.dto';

export class UpdateBookDto implements Partial<CreateBookDto> {
  title?: string;
  author?: string;
  description?: string;
  price?: number;
  stock?: number;
  publishedAt?: string;
}
