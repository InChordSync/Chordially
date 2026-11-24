import 'reflect-metadata';
import { Module, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertProductionCorsConfigured, parseAllowedOrigins } from './cors.js';

@Module({})
class TestModule {}

describe('CORS allow-list', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await NestFactory.create(TestModule, { logger: false });
    app.enableCors({
      origin: parseAllowedOrigins('https://app.example.com, https://admin.example.com'),
      credentials: true,
    });
    app.use((_req: unknown, res: { status(code: number): { json(body: unknown): void } }) => {
      res.status(200).json({ ok: true });
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows a configured origin with credentials', async () => {
    const response = await request(app.getHttpServer())
      .get('/ping')
      .set('Origin', 'https://app.example.com')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe('https://app.example.com');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not reflect an unconfigured origin', async () => {
    const response = await request(app.getHttpServer())
      .get('/ping')
      .set('Origin', 'https://evil.example.com')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('parseAllowedOrigins', () => {
  it('trims entries, drops blanks, and removes duplicates', () => {
    expect(parseAllowedOrigins(' https://a.example.com , ,https://b.example.com,https://a.example.com ')).toEqual([
      'https://a.example.com',
      'https://b.example.com',
    ]);
  });

  it('returns an empty list when unset', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([]);
    expect(parseAllowedOrigins('')).toEqual([]);
  });
});

describe('assertProductionCorsConfigured', () => {
  it('fails fast in production without an allow-list', () => {
    expect(() => assertProductionCorsConfigured('production', [])).toThrow(
      'CORS_ALLOWED_ORIGINS must contain at least one origin in production'
    );
  });

  it('allows an empty allow-list outside production', () => {
    expect(() => assertProductionCorsConfigured('test', [])).not.toThrow();
    expect(() => assertProductionCorsConfigured('production', ['https://app.example.com'])).not.toThrow();
  });
});
