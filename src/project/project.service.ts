import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Project } from './project.model';
import { tryPromise } from 'effect/Effect';
import { DatabaseQueryFailedError, UserNotFoundError } from 'src/shared/errors';
import { CreateProjectDto } from './dto/create-project.dto';
import { eq } from 'drizzle-orm';
import { Effect, pipe } from 'effect';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.model';

export const makeProjectService = (deps: {
  db: NodePgDatabase;
  userService: UserService;
}) => {
  const findAll = () =>
    tryPromise({
      try: () => deps.db.select().from(Project).execute(),
      catch: (err) =>
        new DatabaseQueryFailedError(
          'Error finding all projects',
          err as Error,
        ),
    });

  const create = (input: CreateProjectDto & { ownerUserId: number }) =>
    tryPromise({
      try: () =>
        deps.db
          .insert(Project)
          .values({ name: input.name, ownerUserId: input.ownerUserId })
          .returning()
          .then((res) => res[0]),
      catch: (err) =>
        new DatabaseQueryFailedError('Error creating project', err as Error),
    });

  const findById = (id: number) =>
    tryPromise({
      try: () =>
        deps.db
          .select()
          .from(Project)
          .where(eq(Project.id, id))
          .limit(1)
          .execute()
          .then((res) => res[0] ?? null),
      catch: (err) =>
        new DatabaseQueryFailedError(
          'Error finding project by id',
          err as Error,
        ),
    });

  const findAllOwnedByUser = (userId: number) =>
    pipe(
      deps.userService.findById(userId),
      Effect.filterOrFail(
        (user): user is User => user !== null,
        () => new UserNotFoundError(userId),
      ),
      Effect.flatMap((user) =>
        tryPromise({
          try: () =>
            deps.db
              .select()
              .from(Project)
              .where(eq(Project.ownerUserId, user.id))
              .execute(),
          catch: (err) =>
            new DatabaseQueryFailedError(
              'Error finding projects owned by user',
              err as Error,
            ),
        }),
      ),
    );

  return {
    findAll,
    create,
    findById,
    findAllOwnedByUser,
  };
};

export type ProjectService = ReturnType<typeof makeProjectService>;
