import { Body, Controller, Post } from '@nestjs/common';
import { SignInInputDto } from './dtos/sign-in.input.dto';
import { SignUpInputDto } from './dtos/sign-up.input.dto';
import { makeAuthService } from './auth.service';
import { makeUserService } from '../user/user.service';
import { db } from '../shared/db';

@Controller('auth')
export class AuthController {
  userService = makeUserService({ db });
  authService = makeAuthService({ userService: this.userService });

  @Post('sign-in')
  async signIn(@Body() body: SignInInputDto) {
    return this.authService.signIn(body);
  }

  @Post('sign-up')
  async signUp(@Body() body: SignUpInputDto) {
    return this.authService.signUp(body);
  }
}
