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
