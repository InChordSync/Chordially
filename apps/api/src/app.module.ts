import { Module } from '@nestjs/common';
import { UserModule } from './modules/users/user.module.js';

@Module({
  imports: [UserModule],
})
export class AppModule {}
