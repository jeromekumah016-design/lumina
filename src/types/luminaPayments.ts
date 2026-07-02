/**
 * Pipeline A — Lumina payments (Stripe path).
 *
 * Covers charges that flow THROUGH Lumina: the membership subscription and
 * the trip deposit. This domain is intentionally, strictly separate from
 * Pipeline B (property payments made directly on Airbnb/VRBO — see
 * types/propertyPayments.ts). The two pipelines must never share state
 * machines, records, or storage keys.
 *
 * Deposit policy (hard product rule):
 *   refundable UNTIL the booking-lock deadline; non-refundable AT/AFTER it.
 *   The deadline is the explicit pivot of the state machine — never an
 *   implicit assumption.
 */

// ── Membership subscription payment ─────────────────────────────────────────

export type MembershipPaymentStatus = 'none' | 'active' | 'canceled';

export interface MembershipPaymentRecord {
  status: MembershipPaymentStatus;
  plan: string | null;
  amountCents: number | null;
  paidAt: string | null; // ISO
  canceledAt: string | null; // ISO
}

export type MembershipPaymentEvent =
  | { type: 'PAY'; plan: string; amountCents: number }
  | { type: 'CANCEL' };

// ── Trip deposit ─────────────────────────────────────────────────────────────

export type DepositStatus =
  | 'not_paid'
  | 'paid_refundable'
  | 'refunded' // terminal — refund granted before the lock deadline
  | 'locked_nonrefundable'; // deadline passed while paid — no refunds

export interface DepositRecord {
  tripId: string;
  status: DepositStatus;
  amountCents: number | null;
  paidAt: string | null; // ISO
  /** The pivot of the refundable → non-refundable transition. Set at payment. */
  bookingLockDeadline: string | null; // ISO
  refundedAt: string | null; // ISO
  lockedAt: string | null; // ISO
}

export type DepositEvent =
  | { type: 'PAY'; amountCents: number; bookingLockDeadline: string }
  | { type: 'REQUEST_REFUND' }
  /** Time-based evaluation: applies the deadline pivot if it has passed. */
  | { type: 'EVALUATE' };

export type LuminaPaymentErrorCode =
  | 'membership_already_active'
  | 'membership_not_active'
  | 'invalid_amount'
  | 'invalid_deadline'
  | 'deposit_already_paid'
  | 'deposit_not_paid'
  | 'deposit_locked' // refund requested at/after the booking-lock deadline
  | 'deposit_already_refunded';

export class LuminaPaymentError extends Error {
  readonly code: LuminaPaymentErrorCode;
  constructor(code: LuminaPaymentErrorCode, message: string) {
    super(message);
    this.name = 'LuminaPaymentError';
    this.code = code;
  }
}

/**
 * API-ready contract for Pipeline A. The current implementation persists to
 * AsyncStorage and simulates the charge; a real Stripe-backed adapter must
 * satisfy this exact interface (roadmap item 4).
 */
export interface LuminaPaymentApi {
  // Membership
  getMembershipPayment(): Promise<MembershipPaymentRecord>;
  payMembership(plan: string, amountCents: number): Promise<MembershipPaymentRecord>;
  cancelMembership(): Promise<MembershipPaymentRecord>;

  // Deposit (per trip)
  getDeposit(tripId: string, now?: Date): Promise<DepositRecord>;
  payDeposit(
    tripId: string,
    amountCents: number,
    bookingLockDeadline: string,
    now?: Date
  ): Promise<DepositRecord>;
  requestDepositRefund(tripId: string, now?: Date): Promise<DepositRecord>;
  /** True while the deposit is paid and the lock deadline has not passed. */
  isDepositRefundable(tripId: string, now?: Date): Promise<boolean>;

  resetAll(): Promise<void>;
}
