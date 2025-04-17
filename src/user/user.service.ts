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

  const createUser = (input: { email: string; passwordHash: string }) =>
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

  return {
    findByEmail,
    createUser,
  };
};
