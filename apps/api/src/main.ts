import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { ExpressAdapter } from '@nestjs/platform-express'
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger'
import type { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { createApp } from './app.js'
import { env } from './shared/config/env.js'
import { shouldServeDocs } from './shared/config/docs.js'
import { logger } from './shared/logger/logger.js'
import { AppErrorFilter } from './shared/errors/app-error.filter.js'
import { errorHandler } from './shared/errors/error-handler.middleware.js'
import { healthRouter } from './modules/health/routes/health.routes.js'
import { metricsRouter } from './shared/metrics/metrics.routes.js'
import { openapiRouter } from './modules/openapi/openapi.routes.js'
import { openapiSpec } from './modules/openapi/openapi.js'

function requireDocsBasicAuth(req: Request, res: Response, next: NextFunction): void {
  const user = env.DOCS_BASIC_AUTH_USER
  const password = env.DOCS_BASIC_AUTH_PASSWORD
  if (!user || !password) return next()

  const header = req.header('authorization') ?? ''
  if (!header.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Chordially API docs"')
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Documentation requires credentials' } })
    return
  }

  const [providedUser, providedPassword] = Buffer.from(header.slice(6), 'base64')
    .toString()
    .split(':')
  if (providedUser !== user || providedPassword !== password) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Chordially API docs"')
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } })
    return
  }

  next()
}

async function bootstrap() {
  const expressApp = createApp()
  const adapter = new ExpressAdapter(expressApp)

  expressApp.use(helmet())
  expressApp.use(cors({ origin: true, credentials: true }))

  // Express-level operator endpoints. These are mounted before Nest so the
  // adapters can share a single process without duplicating middleware.
  expressApp.use('/health', healthRouter)
  expressApp.use('/api/metrics', metricsRouter)
  expressApp.use('/api', openapiRouter)

  const docsEnabled = shouldServeDocs(env.NODE_ENV, env.DOCS_ENABLED)
  if (docsEnabled) {
    expressApp.use('/api/docs', requireDocsBasicAuth)
  }

  const app = await NestFactory.create(AppModule, adapter)
  app.setGlobalPrefix('api')
  app.useGlobalFilters(new AppErrorFilter())

  if (docsEnabled) {
    SwaggerModule.setup('api/docs', app, openapiSpec as unknown as OpenAPIObject, {
      customSiteTitle: 'Chordially API reference',
    })
  }

  expressApp.use(errorHandler)

  await app.listen(env.PORT, () => {
    logger.info('NestJS API listening', {
      port: env.PORT,
      docsEnabled,
      metricsScrapeTokenConfigured: Boolean(env.METRICS_SCRAPE_TOKEN),
    })
  })
}

bootstrap().catch((error) => {
  logger.error('Failed to start application', {
    error: error instanceof Error ? error.message : String(error),
  })
  process.exit(1)
})
