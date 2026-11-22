import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller.js';
@Module({ controllers: [AdminController] })
export class AdminModule {}
