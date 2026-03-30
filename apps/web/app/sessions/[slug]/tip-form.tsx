"use client";

import { useNetworkState } from "../../../lib/use-network-state";
import { Input } from "../../../components/ui/input";
import { createTipIntent } from "./actions";

interface TipFormProps {
  artistSlug: string;
  defaultAsset: string;
  showConfirmation: boolean;
  confirmedAmount?: string;
  confirmedAsset?: string;
}

export function TipForm({
  artistSlug,
  defaultAsset,
  showConfirmation,
  confirmedAmount,
  confirmedAsset,
}: TipFormProps) {
  const isOnline = useNetworkState();

  return (
    <form action={createTipIntent} className="stack">
      <input name="artistSlug" type="hidden" value={artistSlug} />
      <label className="stack">
        <span>Amount</span>
        <Input defaultValue="5.00" name="amount" required disabled={!isOnline} />
      </label>
      <label className="stack">
        <span>Asset</span>
        <select
          className="select"
          defaultValue={defaultAsset}
          name="asset"
          disabled={!isOnline}
        >
          <option value="XLM">XLM</option>
          <option value="USDC">USDC</option>
        </select>
      </label>
      <label className="stack">
        <span>Message</span>
        <textarea
          className="textarea"
          defaultValue="For the encore."
          name="note"
          disabled={!isOnline}
        />
      </label>
      {!isOnline ? (
        <p className="muted" role="status" aria-live="polite">
          You're offline. Reconnect to submit a tip.
        </p>
      ) : (
        <button className="button" type="submit">
          Create tip intent
        </button>
      )}
      {showConfirmation && confirmedAmount && confirmedAsset ? (
        <p className="muted" role="status">
          Draft intent created for {confirmedAmount} {confirmedAsset}. Payment execution is intentionally deferred.
        </p>
      ) : null}
    </form>
  );
}
