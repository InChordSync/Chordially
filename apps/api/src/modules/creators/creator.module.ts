import { Module } from '@nestjs/common';
import { CreatorController } from './controllers/creator.controller.js';

@Module({
  controllers: [CreatorController],
})
export class CreatorModule {}
