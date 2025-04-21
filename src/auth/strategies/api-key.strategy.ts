import { PassportStrategy } from '@nestjs/passport';
import { Effect, pipe } from 'effect';
import { Request } from 'express';
import { Strategy as CustomStrategy } from 'passport-custom';
import { redisDb } from 'src/shared/db/redis';
import {
  ApiKeyMissingError,
  TokenNotFoundError,
  UnauthorizedError,
} from 'src/shared/errors';
import { TokenService } from 'src/token/token.service';

export class ApiKeyStrategy extends PassportStrategy(
  CustomStrategy,
  'api-key',
) {
  constructor(
    private readonly redis: redisDb,
    private readonly tokenService: TokenService,
  ) {
    super();
  }

  async validate(req: Request) {
    return pipe(
      Effect.succeed(req.headers['x-api-key'] as string | undefined),
      Effect.filterOrFail(
        (key): key is string => Boolean(key),
        () => new ApiKeyMissingError(),
      ),
      Effect.flatMap((key) =>
        Effect.tryPromise({
          try: () => this.redis.get(`token:${key}`),
          catch: () => Effect.fail(new UnauthorizedError()),
        }).pipe(Effect.map((result) => ({ tokenData: result, key }))),
      ),
      Effect.flatMap(({ tokenData, key }) =>
        tokenData
          ? Effect.succeed(tokenData)
          : Effect.fail(new TokenNotFoundError(key)),
      ),
    );
  }
}
