import "reflect-metadata";
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { tipEventBus } from './tip-event-bus.js';

@Injectable()
export class TipEventBusLifecycle implements OnApplicationShutdown {
  onApplicationShutdown(): void {
    tipEventBus.close();
  }
}
