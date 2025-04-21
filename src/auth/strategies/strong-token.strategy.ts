import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Effect } from 'effect';
import { Request } from 'express';
import { Strategy as CustomStrategy } from 'passport-custom';
import { redisDb } from 'src/shared/db/redis';
import { makeTokenService } from 'src/token/token.service';

@Injectable()
export class StrongTokenStrategy extends PassportStrategy(
  CustomStrategy,
  'strong-token',
) {
  tokenService = makeTokenService({ redis: redisDb });
  async validate(req: Request): Promise<any> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];

    const result = await Effect.runPromiseExit(
      this.tokenService.strongToken.validate(token),
    );

    if (result._tag === 'Failure') {
      throw new UnauthorizedException('Invalid token');
    }

    return result.value;
  }
}
