import "reflect-metadata";
import { Injectable, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { env } from '../../../shared/config/env.js';
import { logger } from '../../../shared/logger/logger.js';
import { reconciliationService, type ReconciliationSummary } from './reconciliation.service.js';

@Injectable()
export class ReconciliationSchedulerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: ReturnType<typeof setInterval> | undefined;
  private running = false;
  private stopped = false;

  onApplicationBootstrap(): void {
    if (!env.RECONCILIATION_ENABLED) return;

    this.timer = setInterval(() => {
      void this.run();
    }, env.RECONCILIATION_INTERVAL_MS);
    this.timer.unref?.();
  }

  async run(): Promise<ReconciliationSummary | undefined> {
    if (this.running || this.stopped) return undefined;

    this.running = true;
    try {
      return await reconciliationService.run();
    } catch (error) {
      logger.error("Reconciliation run threw", {
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    } finally {
      this.running = false;
    }
  }

  onApplicationShutdown(): void {
    this.stopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
