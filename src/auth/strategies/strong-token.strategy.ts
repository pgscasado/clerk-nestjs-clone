import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Effect } from 'effect';
import { Request } from 'express';
import { Strategy as CustomStrategy } from 'passport-custom';
import { db } from 'src/shared/db';
import { redisDb } from 'src/shared/db/redis';
import { makeTokenService, StrongToken } from 'src/token/token.service';
import { makeUserService } from 'src/user/user.service';

@Injectable()
export class StrongTokenStrategy extends PassportStrategy(
  CustomStrategy,
  'strong-token',
) {
  tokenService = makeTokenService({ redis: redisDb });
  userService = makeUserService({ db });
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
    const tokenData = result.value as StrongToken;
    const userResult = await Effect.runPromiseExit(
      this.userService.findById(tokenData.userId),
    );
    if (userResult._tag === 'Failure' || userResult.value === null) {
      throw new UnauthorizedException('User not found');
    }
    return userResult.value;
  }
}
