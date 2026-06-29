export interface FanEngagement {
  userId: string
  period: string
  totalTips: number
  totalStreams: number
  totalShares: number
  totalComments: number
  engagementScore: number
}

export interface GuardrailEvent {
  id: string
  userId: string
  rule: string
  triggeredAt: string
  metadata: Record<string, unknown>
}

export interface GuardrailRule {
  name: string
  maxDailyTips: number
  maxDailyMessages: number
  cooldownMinutes: number
  enabled: boolean
}
