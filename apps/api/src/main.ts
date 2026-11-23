import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ExpressAdapter } from '@nestjs/platform-express';
import { createApp } from './app.js';
import { env } from './shared/config/env.js';
import { assertProductionCorsConfigured, parseAllowedOrigins } from './shared/config/cors.js';
import { logger } from './shared/logger/logger.js';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const allowedOrigins = parseAllowedOrigins(env.CORS_ALLOWED_ORIGINS);
  assertProductionCorsConfigured(env.NODE_ENV, allowedOrigins);

  const expressApp = createApp();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter);
  app.setGlobalPrefix('api');

  app.use(helmet());
  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.enableShutdownHooks();

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      setTimeout(() => {
        logger.error("Graceful shutdown exceeded drain timeout", {
          signal,
          timeoutMs: env.SHUTDOWN_DRAIN_TIMEOUT_MS,
        });
        process.exit(1);
      }, env.SHUTDOWN_DRAIN_TIMEOUT_MS).unref();
    });
  }

  const config = new DocumentBuilder()
    .setTitle('Chordially API')
    .setDescription('NestJS API')
    .setVersion('1.0')
    .addBearerAuth() // N-117
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // N-116

  await app.listen(env.PORT, () => {
    logger.info(`NestJS API listening on port ${env.PORT}`);
  });
}
bootstrap().catch(err => {
  logger.error("Failed to start application", { error: err.message });
  process.exit(1);
});
