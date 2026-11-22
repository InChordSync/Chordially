import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import type { Request, Response } from "express"
import { requireAuth } from "../middleware/auth.middleware.js"

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp()
    const req = http.getRequest<Request>()
    const res = http.getResponse<Response>()

    let authenticated = false
    requireAuth(req, res, () => {
      authenticated = true
    })

    return authenticated
  }
}
