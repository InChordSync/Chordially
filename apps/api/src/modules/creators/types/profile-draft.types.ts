import type { UpdateCreatorInput } from "./creator.types.js"

/** A partially-filled profile saved mid-onboarding, keyed by creator. */
export interface CreatorProfileDraft {
  creatorId: string
  fields: Partial<UpdateCreatorInput>
  updatedAt: string
}

export function saveDraft(
  creatorId: string,
  fields: Partial<UpdateCreatorInput>
): CreatorProfileDraft {
  return { creatorId, fields, updatedAt: new Date().toISOString() }
}

/**
 * Merges a saved draft's fields into the current input, letting the
 * caller resume an interrupted setup without losing already-entered data.
 */
export function mergeDraftIntoInput(
  draft: CreatorProfileDraft,
  input: UpdateCreatorInput
): UpdateCreatorInput {
  return { ...draft.fields, ...input }
}
