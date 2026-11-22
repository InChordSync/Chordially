export interface CreatorSetupStep {
  label: string
  done: boolean
}

export const DEFAULT_CREATOR_SETUP_STEPS: CreatorSetupStep[] = [
  { label: "Connect Stellar Wallet", done: false },
  { label: "Fill Creator Bio & Profile Details", done: false },
  { label: "Upload Avatar & Banner", done: false },
  { label: "Create First Campaign", done: false },
]
