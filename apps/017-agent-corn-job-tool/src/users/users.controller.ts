import { Hono } from 'hono';
import { CreateUserDtoSchema, type CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDtoSchema, type UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

export class UsersController {
  readonly routes = new Hono();

  constructor(private readonly usersService: UsersService) {
    this.routes.post('/', async (c) => c.json(await this.create(CreateUserDtoSchema.parse(await c.req.json())), 201));
    this.routes.get('/', async (c) => c.json(await this.findAll()));
    this.routes.get('/:id', async (c) => c.json(await this.findOne(c.req.param('id'))));
    this.routes.patch('/:id', async (c) =>
      c.json(await this.update(c.req.param('id'), UpdateUserDtoSchema.parse(await c.req.json()))),
    );
    this.routes.delete('/:id', async (c) => c.json(await this.remove(c.req.param('id'))));
  }

  create(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  findAll() {
    return this.usersService.findAll();
  }

  findOne(id: string) {
    return this.usersService.findOne(+id);
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  remove(id: string) {
    return this.usersService.remove(+id);
  }
}
