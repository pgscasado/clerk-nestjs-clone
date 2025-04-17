import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { TokenModule } from './token/token.module';

@Module({
  imports: [AuthModule, UserModule, ProjectModule, TokenModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
