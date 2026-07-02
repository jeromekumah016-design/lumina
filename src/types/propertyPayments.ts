/**
 * Pipeline B — Property payments (Airbnb/VRBO direct pay).
 *
 * The property itself is paid DIRECTLY on Airbnb/VRBO, entirely outside
 * Lumina's charge flow: Lumina never processes, holds, or refunds these
 * funds. What Lumina records is PROOF that the member completed the direct
 * payment. This domain is intentionally, strictly separate from Pipeline A
 * (Lumina/Stripe payments — see types/luminaPayments.ts). The two pipelines
 * must never share state machines, records, or storage keys.
 *
 * Completion rule (hard product rule): a proof is complete ONLY when all
 * three of these are captured and valid —
 *   1. reservation confirmation code
 *   2. paid amount
 *   3. screenshot reference/upload metadata
 * An incomplete proof must never unlock downstream gates.
 */

export type PropertyProofStatus =
  | 'not_submitted'
  | 'draft_incomplete' // some fields captured, not all three valid
  | 'pending_verification' // all three fields valid, awaiting review
  | 'verified' // terminal — unlocks downstream gates
  | 'rejected'; // reviewer rejected — member may edit and resubmit

/** Upload metadata for the payment screenshot. */
export interface ScreenshotRef {
  uri: string;
  fileName: string | null;
  uploadedAt: string; // ISO
}

export interface PropertyPaymentProof {
  tripId: string;
  status: PropertyProofStatus;
  confirmationCode: string | null;
  paidAmountCents: number | null;
  screenshot: ScreenshotRef | null;
  submittedAt: string | null; // ISO
  verifiedAt: string | null; // ISO
  rejectionReason: string | null;
}

export type ProofField = 'confirmationCode' | 'paidAmountCents' | 'screenshot';

export interface ProofValidationIssue {
  field: ProofField;
  reason: string;
}

export type PropertyProofErrorCode =
  | 'proof_incomplete' // submit attempted without all three valid fields
  | 'proof_not_pending' // verify/reject on a proof not awaiting review
  | 'proof_already_verified' // verified is terminal
  | 'proof_locked_pending'; // edits blocked while under review

export class PropertyProofError extends Error {
  readonly code: PropertyProofErrorCode;
  readonly issues: ProofValidationIssue[];
  constructor(code: PropertyProofErrorCode, message: string, issues: ProofValidationIssue[] = []) {
    super(message);
    this.name = 'PropertyProofError';
    this.code = code;
    this.issues = issues;
  }
}

export interface ProofDraft {
  confirmationCode?: string;
  paidAmountCents?: number;
  screenshot?: ScreenshotRef;
}

/**
 * API-ready contract for Pipeline B. The current implementation persists to
 * AsyncStorage with a mocked reviewer; a real backend adapter must satisfy
 * this exact interface.
 */
export interface PropertyPaymentApi {
  getProof(tripId: string): Promise<PropertyPaymentProof>;
  /** Merge partial fields into the draft. Allowed before submission and after rejection. */
  saveDraft(tripId: string, draft: ProofDraft): Promise<PropertyPaymentProof>;
  /** Validate the current draft without mutating it. Empty array = complete. */
  validateProof(tripId: string): Promise<ProofValidationIssue[]>;
  /** Submit for verification. Throws PropertyProofError('proof_incomplete') unless all three fields are valid. */
  submitProof(tripId: string): Promise<PropertyPaymentProof>;
  /** Reviewer decision (mocked for now). */
  reviewProof(
    tripId: string,
    verdict: 'verified' | 'rejected',
    rejectionReason?: string
  ): Promise<PropertyPaymentProof>;
  /** The ONLY downstream-gate signal: true iff status === 'verified'. */
  unlocksDownstream(tripId: string): Promise<boolean>;

  resetAll(): Promise<void>;
}
