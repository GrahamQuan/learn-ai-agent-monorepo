import { UsersController } from './users.controller';
import { UsersService } from './users.service';

export class UsersModule {
  constructor(
    readonly usersService: UsersService,
    readonly usersController: UsersController,
  ) {}
}
