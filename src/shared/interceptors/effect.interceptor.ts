import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Cause, Effect, Either, Exit } from 'effect';
import { from, of, switchMap } from 'rxjs';

@Injectable()
export class EffectInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      switchMap((result) =>
        Effect.isEffect(result)
          ? from(
              Effect.runPromiseExit(
                result as Effect.Effect<unknown, never>,
              ).then((exit) => {
                if (Exit.isSuccess(exit)) {
                  return exit.value;
                }

                const either = Cause.failureOrCause(exit.cause);
                if (Either.isLeft(either)) {
                  throw either.left;
                }
                throw new Error('Unhandled fiber failure. Check stack.');
              }),
            )
          : of(Promise.resolve(result)),
      ),
    );
  }
}
