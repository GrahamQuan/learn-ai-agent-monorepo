import type { Book } from './book.types';

export interface BookRepository {
  findAll(): Book[];
}

export function createBookRepository(): BookRepository {
  const books: Book[] = [
    { id: 1, title: 'Book 1' },
    { id: 2, title: 'Book 2' },
    { id: 3, title: 'Book 3' },
  ];

  return {
    findAll: () => [...books],
  };
}
