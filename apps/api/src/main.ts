import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ExpressAdapter } from '@nestjs/platform-express';
import { createApp } from './app.js';
import { env } from './shared/config/env.js';
import { logger } from './shared/logger/logger.js';
import { reconciliationService } from './modules/reconciliation/services/reconciliation.service.js';

async function bootstrap() {
  const expressApp = createApp();
  const adapter = new ExpressAdapter(expressApp);
  
  const app = await NestFactory.create(AppModule, adapter);
  app.setGlobalPrefix('api');
  
  await app.listen(env.PORT, () => {
    logger.info(`NestJS API listening on port ${env.PORT}`);
  });

  if (env.RECONCILIATION_ENABLED) {
    const interval = setInterval(() => {
      reconciliationService.run().catch((error: unknown) => {
        logger.error("Reconciliation run threw", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, env.RECONCILIATION_INTERVAL_MS);
    interval.unref();
  }
}

bootstrap().catch(err => {
  logger.error("Failed to start application", { error: err.message });
  process.exit(1);
});
