import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { StrongTokenStrategy } from './strategies/strong-token.strategy';

@Module({
  imports: [PassportModule],
  providers: [StrongTokenStrategy],
  controllers: [AuthController],
  exports: [StrongTokenStrategy],
})
export class AuthModule {}
