import { eq } from 'drizzle-orm';
import type { Database } from '../database/client';
import { User } from './entities/user.entity';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

export class UsersService {
  constructor(private readonly entityManager: Database) {}

  async create(createUserDto: CreateUserDto) {
    const [created] = await this.entityManager.insert(User).values(createUserDto).returning();
    if (!created) throw new Error('Failed to create user');
    return created;
  }

  findAll() {
    return this.entityManager.select().from(User);
  }

  async findOne(id: number) {
    const [user] = await this.entityManager.select().from(User).where(eq(User.id, id)).limit(1);
    return user ?? null;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.entityManager
      .update(User)
      .set({ ...updateUserDto, updatedAt: new Date() })
      .where(eq(User.id, id))
      .returning();
  }

  remove(id: number) {
    return this.entityManager.delete(User).where(eq(User.id, id)).returning();
  }
}
