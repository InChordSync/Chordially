import "reflect-metadata"
import type { ExecutionContext } from "@nestjs/common"
import { afterEach, describe, expect, it, vi } from "vitest"
import { prisma } from "../../database/prisma.js"
import { ROLES_KEY, RolesGuard } from "../roles.guard.js"

function context(requiredRoles?: string[], userId = "user-1") {
  const handler = () => undefined
  class TestController {}
  if (requiredRoles) Reflect.defineMetadata(ROLES_KEY, requiredRoles, handler)

  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => ({ userId }) }),
  } as unknown as ExecutionContext
}

describe("RolesGuard", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("allows routes without a role requirement", async () => {
    const findUnique = vi.spyOn(prisma.user, "findUnique")

    await expect(new RolesGuard().canActivate(context())).resolves.toBe(true)
    expect(findUnique).not.toHaveBeenCalled()
  })

  it("allows a caller whose role is in the allowlist", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({ role: "admin" } as never)

    await expect(new RolesGuard().canActivate(context(["admin"], "admin-1"))).resolves.toBe(true)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "admin-1" },
      select: { role: true },
    })
  })

  it("rejects a non-admin with the documented error", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({ role: "user" } as never)

    await expect(new RolesGuard().canActivate(context(["admin"]))).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    })
  })

  it("rejects a caller whose account no longer exists", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null)

    await expect(new RolesGuard().canActivate(context(["admin"]))).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    })
  })
})
