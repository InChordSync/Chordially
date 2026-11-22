import { Module } from '@nestjs/common';
import { FanController } from './controllers/fan.controller.js';
@Module({ controllers: [FanController] })
export class FanModule {}
