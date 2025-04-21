import { randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { Effect, pipe } from 'effect';
import { redisDb } from 'src/shared/db/redis';
import {
  ExpiredTokenError,
  InvalidTokenHashError,
  InvalidTokenTypeError,
  JSONParseError,
  RedisError,
  RevokedTokenError,
  TokenNotFoundError,
} from 'src/shared/errors';

type BaseToken = {
  tokenId: string;
  tokenSecret: string;
  validityHash: string;
};

export interface ApiKeyToken extends BaseToken {
  type: 'api-key';
}

export interface StrongToken extends BaseToken {
  type: 'strong-token';
  expiresAt: number;
  userId: number;
  roles: string[];
}

export type Token = ApiKeyToken | StrongToken;

export const makeTokenService = (deps: { redis: redisDb }) => {
  const redis = deps.redis;

  const decodeBase64 = (str: string) =>
    Buffer.from(str, 'base64url').toString();

  const validateRedisToken = (token: string, type: Token['type']) =>
    pipe(
      Effect.succeed(token),
      Effect.flatMap((token) =>
        Effect.tryPromise({
          try: () => redis.get(`api-key:${token}`),
          catch: (cause) => new RedisError(cause as Error),
        }),
      ),
      Effect.filterOrFail(
        (tokenDataStr): tokenDataStr is string => Boolean(tokenDataStr),
        () => new TokenNotFoundError(token),
      ),
      Effect.tryMap({
        try: (tokenDataStr) => JSON.parse(tokenDataStr) as Token,
        catch: (cause) => new JSONParseError(cause as Error),
      }),
      Effect.filterOrFail(
        (tokenData) => {
          const decoded = decodeBase64(token);
          const [, secret] = decoded.split('.');
          return (
            tokenData.tokenId === token.split('.')[0] &&
            tokenData.tokenSecret === secret
          );
        },
        () => new InvalidTokenHashError(),
      ),
      Effect.filterOrFail(
        (tokenData) => tokenData.type === type,
        () => new InvalidTokenTypeError(),
      ),
      Effect.filterOrFail((tokenData) => {
        const inputHash = Buffer.from(token.split('.')[1], 'base64url');
        const validityHash = Buffer.from(tokenData.validityHash, 'base64url');
        return (
          inputHash.length === validityHash.length &&
          timingSafeEqual(inputHash, validityHash)
        );
      }),
      Effect.map((tokenData) => {
        if (tokenData.type === 'strong-token') {
          const now = Date.now();
          return tokenData.expiresAt > now
            ? Effect.succeed(tokenData)
            : Effect.fail(new ExpiredTokenError());
        }
        if (tokenData.type === 'api-key') {
          return Effect.tryPromise({
            try: () => redis.get(`revoked-api-key:${tokenData.tokenId}`),
            catch: (err) => new RedisError(err as Error),
          }).pipe(
            Effect.filterOrFail(
              (revoked): revoked is null => revoked === null,
              () => new RevokedTokenError(tokenData.tokenId),
            ),
            Effect.map(() => tokenData),
          );
        }
      }),
    );

  const saveRedisToken = <T extends Token['type']>(
    type: T,
    input?: T extends 'strong-token'
      ? { userId: number; roles: string[] }
      : undefined,
  ) =>
    pipe(
      Effect.succeed({
        type,
        tokenId: randomUUID(),
        tokenSecret: randomBytes(32).toString('base64url'),
        userId: input?.userId,
        roles: input?.roles,
        expiresAt: input ? Date.now() + 1000 * 60 * 60 * 24 * 7 : null,
        validityHash: randomBytes(32).toString('base64'),
      } satisfies Token),
      Effect.tap((token) =>
        Effect.tryPromise({
          try: () =>
            redis.set(
              `api-key:${token.tokenId}.${token.tokenSecret}`,
              JSON.stringify(token),
            ),
          catch: (err) => new RedisError(err as Error),
        }),
      ),
      Effect.map((token) => ({
        tokenId: token.tokenId,
        token: `${token.tokenId}.${token.tokenSecret}`,
      })),
    );

  return {
    apiKey: {
      validate: (token: string) => validateRedisToken(token, 'api-key'),
      save: (input: Parameters<typeof saveRedisToken>[0]) =>
        saveRedisToken(input),
    },
    strongToken: {
      validate: (token: string) => validateRedisToken(token, 'strong-token'),
      save: (input: Parameters<typeof saveRedisToken>[1]) =>
        saveRedisToken('strong-token', input),
    },
  };
};

export type TokenService = ReturnType<typeof makeTokenService>;
