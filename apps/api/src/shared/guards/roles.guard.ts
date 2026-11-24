import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  type CustomDecorator,
} from "@nestjs/common"
import type { Request } from "express"
import { prisma } from "../database/prisma.js"
import { AppError } from "../errors/app-error.js"

export const ROLES_KEY = "chordially:roles"

export function Roles(...roles: string[]): CustomDecorator<string> {
  return SetMetadata(ROLES_KEY, roles)
}

@Injectable()
export class RolesGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = context.getHandler() && context.getClass()
      ? (Reflect.getMetadata(ROLES_KEY, context.getHandler()) ??
         Reflect.getMetadata(ROLES_KEY, context.getClass())) as string[] | undefined
      : undefined

    if (!required || required.length === 0) return true

    const req = context.switchToHttp().getRequest<Request>()
    const user = await prisma.user.findUnique({
      where: { id: (req as any).userId ?? "" },
      select: { role: true },
    })

    if (!user || !required.includes(user.role)) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission to perform this action")
    }

    return true
  }
}
