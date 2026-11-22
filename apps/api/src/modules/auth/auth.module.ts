import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller.js';
import { PasswordService } from './services/password.service.js';

@Module({
  controllers: [AuthController],
  providers: [PasswordService],
})
export class AuthModule {}
