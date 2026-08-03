import { CreateUserDtoSchema } from './create-user.dto';

export const UpdateUserDtoSchema = CreateUserDtoSchema.partial();

export class UpdateUserDto {
  name?: string;
  email?: string;
}
