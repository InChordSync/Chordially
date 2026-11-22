import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller.js';
import { FileService } from '../../shared/storage/file.service.js';
@Module({
  controllers: [UserController],
  providers: [FileService],
})
export class UserModule {}
