import { Body, Controller, Post } from '@nestjs/common';
import { SignInInputDto } from './dtos/sign-in.input.dto';
import { SignUpInputDto } from './dtos/sign-up.input.dto';
import { makeAuthService } from './auth.service';
import { makeUserService } from '../user/user.service';
import { db } from '../shared/db';
import { Effect } from 'effect';

@Controller('auth')
export class AuthController {
  userService = makeUserService({ db });
  authService = makeAuthService({ userService: this.userService });

  @Post('sign-in')
  async signIn(@Body() body: SignInInputDto) {
    const result = await Effect.runPromise(this.authService.signIn(body));
    return result;
  }

  @Post('sign-up')
  async signUp(@Body() body: SignUpInputDto) {
    const result = await Effect.runPromise(this.authService.signUp(body));
    return result;
  }
}
