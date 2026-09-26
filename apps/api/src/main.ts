import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ExpressAdapter } from '@nestjs/platform-express';
import { createApp } from './app.js';
import { env } from './shared/config/env.js';
import { logger } from './shared/logger/logger.js';
import { reconciliationService } from './modules/reconciliation/services/reconciliation.service.js';
import helmet from 'helmet';
import cors from 'cors';

async function bootstrap() {
  const expressApp = createApp();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter);
  app.setGlobalPrefix('api');
  
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  
  await app.listen(env.PORT, () => {
    logger.info(`NestJS API listening on port ${env.PORT}`);
  });
}
bootstrap().catch(err => {
  logger.error("Failed to start application", { error: err.message });
  process.exit(1);
});
