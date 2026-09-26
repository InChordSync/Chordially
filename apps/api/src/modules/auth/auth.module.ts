import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller.js';

@Module({
  controllers: [AuthController],
})
export class AuthModule {}
