import { Data } from 'effect';

export class UserNotFoundError extends Data.TaggedError('UserNotFoundError') {
  constructor(readonly id: number) {
    super();
  }
}

export class UserAlreadyExistsError extends Data.TaggedError(
  'UserAlreadyExistsError',
) {
  constructor(readonly email: string) {
    super();
  }
}

export class InvalidPasswordError extends Data.TaggedError(
  'InvalidPasswordError',
) {}

export class DatabaseQueryFailedError extends Data.TaggedError(
  'DatabaseQueryFailedError',
) {
  constructor(
    readonly message: string,
    readonly error: Error,
  ) {
    super();
  }
}

export class HashingError extends Data.TaggedError('HashingError') {
  constructor(readonly error: Error) {
    super();
  }
}
