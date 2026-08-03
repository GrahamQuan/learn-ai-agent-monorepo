import { z } from 'zod';

export const CreateUserDtoSchema = z.object({
  name: z.string().trim().min(1).max(50),
  email: z.email().max(50),
});

export class CreateUserDto implements z.infer<typeof CreateUserDtoSchema> {
  name!: string;
  email!: string;
}
