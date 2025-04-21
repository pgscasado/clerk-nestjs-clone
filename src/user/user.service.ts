import { eq } from 'drizzle-orm';
import { tryPromise } from 'effect/Effect';

import { User } from './user.model';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DatabaseQueryFailedError } from '../shared/errors';

export const makeUserService = (deps: { db: NodePgDatabase }) => {
  const findByEmail = (email: string) =>
    tryPromise({
      try: () =>
        deps.db
          .select()
          .from(User)
          .where(eq(User.email, email))
          .limit(1)
          .execute()
          .then((res) => res[0] ?? null),
      catch: (err) =>
        new DatabaseQueryFailedError(
          'Error finding user by email',
          err as Error,
        ),
    });

  const create = (input: { email: string; passwordHash: string }) =>
    tryPromise({
      try: () =>
        deps.db
          .insert(User)
          .values({ email: input.email, passwordHash: input.passwordHash })
          .returning()
          .then((res) => res[0]),
      catch: (err) =>
        new DatabaseQueryFailedError(
          'Error finding user by email',
          err as Error,
        ),
    });

  const findById = (id: number) =>
    tryPromise({
      try: () =>
        deps.db
          .select()
          .from(User)
          .where(eq(User.id, id))
          .limit(1)
          .execute()
          .then((res) => res[0] ?? null),
      catch: (err) =>
        new DatabaseQueryFailedError('Error finding user by id', err as Error),
    });

  return {
    findByEmail,
    create,
    findById,
  };
};

export type UserService = ReturnType<typeof makeUserService>;
