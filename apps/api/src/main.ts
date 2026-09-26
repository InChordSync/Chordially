import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { env } from './shared/config/env.js';
import { logger } from './shared/logger/logger.js';
import { reconciliationService } from './modules/reconciliation/services/reconciliation.service.js';
import helmet from 'helmet';
import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  
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
