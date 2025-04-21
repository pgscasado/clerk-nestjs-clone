import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
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

const HMAC_SECRET = process.env.HMAC_SECRET;

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

  const generateValidityHash = (secret: string) => {
    return createHmac('sha256', HMAC_SECRET).update(secret).digest('base64url');
  };

  const validateRedisToken = (token: string, type: Token['type']) =>
    pipe(
      Effect.succeed(decodeBase64(token)),
      Effect.flatMap((token) =>
        Effect.tryPromise({
          try: () => redis.get(`token:${token}`),
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
          const [id, secret] = decoded.split('.');
          return tokenData.tokenId === id && tokenData.tokenSecret === secret;
        },
        () => new InvalidTokenHashError(),
      ),
      Effect.filterOrFail(
        (tokenData) => tokenData.type === type,
        () => new InvalidTokenTypeError(),
      ),
      Effect.filterOrFail(
        (tokenData) => {
          try {
            // Decodifica o token base64url
            const rawToken = Buffer.from(token, 'base64url').toString(); // tokenId.tokenSecret
            const [tokenId, tokenSecret] = rawToken.split('.');

            if (!tokenId || !tokenSecret) return false;

            // Gera o hash esperado com HMAC do tokenSecret
            const expectedHash = createHmac('sha256', HMAC_SECRET)
              .update(tokenSecret)
              .digest();

            // Converte o hash armazenado (também base64url) para buffer
            const storedHash = Buffer.from(tokenData.validityHash, 'base64url');

            // Comparação segura
            return (
              expectedHash.length === storedHash.length &&
              timingSafeEqual(expectedHash, storedHash)
            );
          } catch (e) {
            return false;
          }
        },
        () => new InvalidTokenHashError(),
      ),
      Effect.map((tokenData) => {
        if (tokenData.type === 'strong-token') {
          const now = Date.now();
          return tokenData.expiresAt > now
            ? Effect.succeed(tokenData)
            : Effect.fail(new ExpiredTokenError());
        }
        if (tokenData.type === 'api-key') {
          return Effect.tryPromise({
            try: () => redis.get(`revoked-token:${tokenData.tokenId}`),
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
      Effect.succeed(randomBytes(32).toString('base64url')),
      Effect.map(
        (secret) =>
          ({
            type,
            tokenId: randomUUID(),
            tokenSecret: secret,
            userId: input?.userId,
            roles: input?.roles,
            expiresAt: input ? Date.now() + 1000 * 60 * 60 * 24 * 7 : null,
            validityHash: generateValidityHash(secret),
          }) as T extends 'api-key' ? ApiKeyToken : StrongToken,
      ),
      Effect.tap((token) =>
        Effect.tryPromise({
          try: () =>
            redis.set(
              `token:${token.tokenId}.${token.tokenSecret}`,
              JSON.stringify(token),
              'EX',
              'expiresAt' in token
                ? (token.expiresAt - Date.now()) / 1000
                : null,
            ),
          catch: (err) => new RedisError(err as Error),
        }),
      ),
      Effect.map((token) => ({
        tokenId: token.tokenId,
        token: Buffer.from(`${token.tokenId}.${token.tokenSecret}`).toString(
          'base64url',
        ),
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
