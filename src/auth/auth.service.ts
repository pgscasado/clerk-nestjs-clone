import { Effect, pipe } from 'effect';
import { SignUpInputDto } from './dtos/sign-up.input.dto';
import { makeUserService } from '../user/user.service';
import bcrypt from 'bcryptjs';
import { SignInInputDto } from './dtos/sign-in.input.dto';
import { randomUUID } from 'node:crypto';
import {
  HashingError,
  InvalidPasswordError,
  UserAlreadyExistsError,
} from '../shared/errors';

export const makeAuthService = (deps: {
  userService: ReturnType<typeof makeUserService>;
}) => {
  const signUp = (dto: SignUpInputDto) =>
    pipe(
      deps.userService.findByEmail(dto.email),
      Effect.flatMap((existingUser) =>
        existingUser
          ? Effect.fail(new UserAlreadyExistsError(existingUser.email))
          : Effect.succeed(dto),
      ),
      Effect.flatMap((dto) =>
        Effect.tryPromise({
          try: () => bcrypt.hash(dto.password, 10),
          catch: (err) => Effect.fail(new HashingError(err as Error)),
        }),
      ),
      Effect.flatMap((passwordHash) =>
        deps.userService.createUser({ email: dto.email, passwordHash }),
      ),
      Effect.map((user) => ({
        id: user.id,
      })),
    );

  const signIn = (dto: SignInInputDto) =>
    pipe(
      deps.userService.findByEmail(dto.email),
      Effect.flatMap((user) =>
        Effect.tryPromise({
          try: () => bcrypt.compare(dto.password, user.passwordHash),
          catch: (err) => new HashingError(err as Error),
        }).pipe(
          Effect.flatMap((isValid) =>
            isValid
              ? Effect.succeed(user)
              : Effect.fail(new InvalidPasswordError()),
          ),
        ),
      ),
      Effect.flatMap((user) =>
        Effect.sync(() => ({
          tokenId: randomUUID(),
          tokenHash: randomUUID(),
          userId: user.id,
        })),
      ),
    );
  return {
    signUp,
    signIn,
  };
};
