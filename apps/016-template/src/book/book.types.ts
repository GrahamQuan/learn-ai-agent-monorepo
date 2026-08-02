export type Book = {
  id: number;
  title: string;
};

export type CreateBookDto = Record<string, unknown>;
export type UpdateBookDto = Partial<CreateBookDto>;
