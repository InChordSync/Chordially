export type RefundReason = "payment_failed" | "creator_cancelled" | "duplicate_charge" | "fraud";
export type RefundStatus = "pending" | "approved" | "denied" | "processed";

export interface RefundRequest {
  paymentId: string;
  reason: RefundReason;
  requestedAt: string;
  status: RefundStatus;
  amount: number;
  currency: string;
}

export const refundEligibilityWindowDays = 30;

export function isRefundEligible(paymentDate: string): boolean {
  const diffMs = Date.now() - new Date(paymentDate).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= refundEligibilityWindowDays;
}

export function getRefundPolicy(reason: RefundReason): { autoApprove: boolean; windowDays: number } {
  const policies: Record<RefundReason, { autoApprove: boolean; windowDays: number }> = {
    payment_failed: { autoApprove: true, windowDays: 7 },
    duplicate_charge: { autoApprove: true, windowDays: 30 },
    creator_cancelled: { autoApprove: false, windowDays: 14 },
    fraud: { autoApprove: false, windowDays: 90 },
  };
  return policies[reason];
}
