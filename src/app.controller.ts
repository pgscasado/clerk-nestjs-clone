import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from './shared/decorators/current-user.decorator';
import { User } from './user/user.model';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(AuthGuard('strong-token'))
  @ApiBearerAuth('access-token')
  getHello(@CurrentUser() user: User): string {
    return this.appService.getHello(user.email);
  }
}
