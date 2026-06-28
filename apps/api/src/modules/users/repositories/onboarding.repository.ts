import { prisma } from "../../../shared/database/prisma.js"
import type { OnboardingStep } from "../types/onboarding.types.js"

export const onboardingRepository = {
  async findByUserId(userId: string): Promise<OnboardingStep[]> {
    return prisma.onboardingStep.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }) as unknown as OnboardingStep[]
  },

  async createSteps(
    userId: string,
    stepKeys: string[]
  ): Promise<OnboardingStep[]> {
    await prisma.onboardingStep.createMany({
      data: stepKeys.map((stepKey) => ({ userId, stepKey })),
    })
    return this.findByUserId(userId)
  },

  async markCompleted(
    userId: string,
    stepKey: string
  ): Promise<OnboardingStep> {
    return prisma.onboardingStep.update({
      where: { userId_stepKey: { userId, stepKey } },
      data: { completed: true },
    }) as unknown as OnboardingStep
  },
}
