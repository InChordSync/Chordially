import request from 'supertest'
import jwt from 'jsonwebtoken'
import type { Application } from 'express'

const TEST_JWT_SECRET = 'test-jwt-secret-for-testing-only'

export function signTestToken(userId: string, role = 'fan'): string {
  return jwt.sign({ sub: userId, role }, TEST_JWT_SECRET, { expiresIn: '1h' })
}

export function authenticatedRequest(app: Application, userId: string, role = 'fan') {
  const token = signTestToken(userId, role)
  return {
    get(url: string) {
      return request(app).get(url).set('Authorization', `Bearer ${token}`)
    },
    post(url: string) {
      return request(app).post(url).set('Authorization', `Bearer ${token}`)
    },
    patch(url: string) {
      return request(app).patch(url).set('Authorization', `Bearer ${token}`)
    },
    delete(url: string) {
      return request(app).delete(url).set('Authorization', `Bearer ${token}`)
    },
  }
}
