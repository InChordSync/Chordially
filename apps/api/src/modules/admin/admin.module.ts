import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller.js';
import { RolesGuard } from '../../shared/guards/roles.guard.js';

@Module({
  controllers: [AdminController],
  providers: [RolesGuard],
})
export class AdminModule {}
