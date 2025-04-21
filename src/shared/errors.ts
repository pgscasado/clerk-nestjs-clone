import { Logger } from '@nestjs/common';

export class UserNotFoundError {
  readonly _tag = 'UserNotFoundError';
  constructor(readonly id: number) {}
}

export class UserAlreadyExistsError {
  readonly _tag = 'UserAlreadyExistsError';
  constructor(readonly email: string) {}
}

export class InvalidPasswordError {
  readonly _tag = 'InvalidPasswordError';
}

export class DatabaseQueryFailedError {
  readonly _tag = 'DatabaseQueryFailedError';
  private logger = new Logger(DatabaseQueryFailedError.name);
  constructor(
    readonly message: string,
    readonly error: Error,
  ) {
    this.logger.error(error);
  }
}

export class HashingError {
  readonly _tag = 'HashingError';
  private logger = new Logger(HashingError.name);
  constructor(readonly error: Error) {
    this.logger.error(error);
  }
}

export class UnauthorizedError {
  readonly _tag = 'UnauthorizedError';
}

export class ApiKeyMissingError {
  readonly _tag = 'ApiKeyMissingError';
}

export class TokenNotFoundError {
  readonly _tag = 'TokenNotFoundError';
  constructor(readonly token: string) {}
}

export class RevokedTokenError {
  readonly _tag = 'RevokedTokenError';
  constructor(readonly token: string) {}
}

export class RedisError {
  readonly _tag = 'RedisError';
  private logger = new Logger(RedisError.name);
  constructor(readonly error: Error) {
    this.logger.error(error);
  }
}

export class InvalidTokenHashError {
  readonly _tag = 'InvalidTokenError';
}

export class InvalidTokenTypeError {
  readonly _tag = 'InvalidTokenTypeError';
}

export class ExpiredTokenError {
  readonly _tag = 'ExpiredTokenError';
}

export class JSONParseError {
  readonly _tag = 'JSONParseError';
  private logger = new Logger(JSONParseError.name);
  constructor(readonly error: Error) {
    this.logger.error(error);
  }
}
