import { Module } from '@nestjs/common';
import { StreamController } from './controllers/stream.controller.js';

@Module({
  controllers: [StreamController],
})
export class StreamModule {}
