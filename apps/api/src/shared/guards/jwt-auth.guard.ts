import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { Request, Response } from "express"
import { requireAuth } from "../middleware/auth.middleware.js"
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js"

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

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
