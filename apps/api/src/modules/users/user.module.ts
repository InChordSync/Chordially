import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller.js';

@Module({
  controllers: [UserController],
})
export class UserModule {}
