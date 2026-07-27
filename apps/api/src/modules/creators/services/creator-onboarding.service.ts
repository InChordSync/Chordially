import { creatorService } from "./creator.service.js"
import { CreatorProfile } from "../types/creator.types.js"

export interface OnboardingProgress {
  isComplete: boolean;
  score: number;
  total: number;
  steps: {
    hasAvatar: boolean;
    hasBio: boolean;
    hasGenre: boolean;
    hasLocation: boolean;
    isVerified: boolean;
  };
}

export const creatorOnboardingService = {
  async getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    const profile = await creatorService.findByUserId(userId)
    if (!profile) {
      return {
        isComplete: false,
        score: 0,
        total: 5,
        steps: {
          hasAvatar: false,
          hasBio: false,
          hasGenre: false,
          hasLocation: false,
          isVerified: false,
        },
      }
    }
    
    return this.calculateProgress(profile)
  },

  calculateProgress(profile: CreatorProfile): OnboardingProgress {
    const steps = {
      hasAvatar: !!profile.avatarUrl,
      hasBio: !!profile.bio && profile.bio.length > 10,
      hasGenre: !!profile.genre,
      hasLocation: !!profile.location,
      isVerified: profile.isVerified,
    }

    const score = Object.values(steps).filter(Boolean).length
    const total = Object.keys(steps).length

    return {
      isComplete: score === total,
      score,
      total,
      steps,
    }
  }
}
