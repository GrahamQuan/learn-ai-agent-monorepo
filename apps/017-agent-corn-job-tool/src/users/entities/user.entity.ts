import { users, type NewUser as NewUserRow, type User as UserRow } from '../../database/schema/user.schema';

export const User = users;
export type User = UserRow;
export type NewUser = NewUserRow;
