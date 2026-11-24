import { Test, TestingModule } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AdminController } from '../src/modules/admin/controllers/admin.controller.js'
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard.js'
import { RolesGuard } from '../src/shared/guards/roles.guard.js'
import { AppErrorFilter } from '../src/shared/errors/app-error.filter.js'
import { env } from '../src/shared/config/env.js'
import { prisma } from '../src/shared/database/prisma.js'

function tokenFor(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '1h' })
}

describe('Admin Module (e2e)', () => {
  let app: INestApplication
  let userToken: string
  let adminToken: string
  const emails = [`admin-e2e-user-${Date.now()}@example.com`, `admin-e2e-admin-${Date.now()}@example.com`]

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [JwtAuthGuard, RolesGuard],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalFilters(new AppErrorFilter())
    await app.init()
  })

  beforeEach(async () => {
    const [regular, admin] = await Promise.all([
      prisma.user.create({ data: { email: emails[0]!, passwordHash: 'hash', role: 'user' } }),
      prisma.user.create({ data: { email: emails[1]!, passwordHash: 'hash', role: 'admin' } }),
    ])
    userToken = tokenFor(regular.id)
    adminToken = tokenFor(admin.id)
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: emails } } })
    await app?.close()
  })

  it('rejects anonymous requests with 401', async () => {
    await request(app.getHttpServer())
      .get('/admin/dashboard-summary')
      .expect(401)
  })

  it('rejects authenticated non-admins with 403', async () => {
    await request(app.getHttpServer())
      .get('/admin/dashboard-summary')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403)
  })

  it('returns real dashboard counts to admins with 200', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/dashboard-summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(response.body).toMatchObject({
      users: expect.any(Number),
      creators: expect.any(Number),
      activePayouts: expect.any(Number),
    })
  })

  it('returns 501 instead of fake data for unimplemented admin actions', async () => {
    await request(app.getHttpServer())
      .get('/admin/audit-log')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(501)
  })
})
