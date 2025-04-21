import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as ExpectedErrors from '../errors';

type ErrorMap = Record<
  keyof typeof ExpectedErrors,
  {
    status: number;
    payload: () => {
      message: string;
      code?: string;
      entry?: string;
    };
  }
>;

const errorMap = {
  UserNotFoundError: {
    status: 404,
    payload: () => ({
      message: 'User not found',
    }),
  },
  DatabaseQueryFailedError: {
    status: 500,
    payload: () => ({
      message: 'Database query failed. Check internal logs.',
    }),
  },
  UserAlreadyExistsError: {
    status: 409,
    payload: () => ({
      message: 'User already exists',
    }),
  },
  HashingError: {
    status: 500,
    payload: () => ({
      message: 'Error while hashing password. Check internal logs.',
    }),
  },
  InvalidPasswordError: {
    status: 401,
    payload: () => ({
      message: 'Invalid password',
    }),
  },
  ApiKeyMissingError: {
    status: 401,
    payload: () => ({
      message: `Missing API key in ${process.env.API_KEY_HEADER} header`,
    }),
  },
  RevokedTokenError: {
    status: 401,
    payload: () => ({
      message: 'Token has been revoked',
    }),
  },
  TokenNotFoundError: {
    status: 401,
    payload: () => ({
      message: 'Token not found',
    }),
  },
  UnauthorizedError: {
    status: 401,
    payload: () => ({
      message: 'Unauthorized',
    }),
  },
} as const satisfies ErrorMap;

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  private logger = new Logger(GlobalErrorFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      return res
        .status(status)
        .json(typeof response === 'object' ? response : { message: response });
    }

    if (this.isTaggedError(exception)) {
      const mapped = errorMap[exception._tag as keyof ErrorMap];
      if (mapped) {
        return res.status(mapped.status).json(mapped.payload());
      }
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: exception instanceof Error ? exception.message : 'Unknown error',
    });
  }

  private isTaggedError(error: unknown): error is { _tag: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      '_tag' in error &&
      typeof error._tag === 'string'
    );
  }
}
