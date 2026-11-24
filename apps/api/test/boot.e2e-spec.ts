import { Test } from "@nestjs/testing"
import type { INestApplication } from "@nestjs/common"
import { describe, expect, it } from "vitest"
import { AppModule } from "../src/app.module.js"
import { AdminController } from "../src/modules/admin/controllers/admin.controller.js"
import { AuthController } from "../src/modules/auth/controllers/auth.controller.js"
import { CreatorPayoutController } from "../src/modules/creator-payouts/controllers/creator-payout.controller.js"
import { CreatorController } from "../src/modules/creators/controllers/creator.controller.js"
import { DepositController as DepositsController } from "../src/modules/deposits/controllers/deposit.controller.js"
import { FanController } from "../src/modules/fans/controllers/fan.controller.js"
import { HealthController, MetricsController } from "../src/modules/health/controllers/health.controller.js"
import { NotificationController } from "../src/modules/notifications/controllers/notification.controller.js"
import { SearchController } from "../src/modules/search/controllers/search.controller.js"
import { StreamController } from "../src/modules/streams/controllers/stream.controller.js"
import { TipController } from "../src/modules/tips/controllers/tip.controller.js"
import { UserController } from "../src/modules/users/controllers/user.controller.js"
import { DepositController as WalletDepositController } from "../src/modules/wallet/controllers/deposit.controller.js"
import { WalletController } from "../src/modules/wallet/controllers/wallet.controller.js"

/**
 * Boot smoke test (issue #1353): compiling AppModule and resolving every
 * controller proves that decorator metadata is emitted and every
 * constructor-injected provider can actually be constructed.
 */
const CONTROLLERS = [
  AdminController,
  AuthController,
  CreatorPayoutController,
  CreatorController,
  DepositsController,
  FanController,
  HealthController,
  MetricsController,
  NotificationController,
  SearchController,
  StreamController,
  TipController,
  UserController,
  WalletDepositController,
  WalletController,
]

describe("Nest bootstrap", () => {
  it("resolves every registered controller", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    const app: INestApplication = moduleRef.createNestApplication()
    await app.init()

    for (const controller of CONTROLLERS) {
      expect(app.get(controller, { strict: false })).toBeDefined()
    }

    await app.close()
  })
})
