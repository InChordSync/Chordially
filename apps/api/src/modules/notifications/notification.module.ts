import { Module } from '@nestjs/common';
import { NotificationController } from './controllers/notification.controller.js';
@Module({ controllers: [NotificationController] })
export class NotificationModule {}
