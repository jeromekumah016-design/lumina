import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PropertyPaymentApi,
  PropertyPaymentProof,
  PropertyProofError,
  ProofDraft,
  ProofValidationIssue,
  ScreenshotRef,
} from '../types/propertyPayments';

/**
 * Pipeline B — property payments made DIRECTLY on Airbnb/VRBO, outside
 * Lumina's charge flow. Lumina only records proof of the direct payment.
 * Strictly separate from Pipeline A (luminaPaymentService) — no shared
 * state, records, or storage keys.
 *
 * Proof completion requires ALL THREE fields (confirmation code, paid
 * amount, screenshot ref). validateProofFields is the single source of
 * truth for that rule; submit and the downstream-gate signal both flow
 * through it.
 */

const STORAGE_KEY = 'lumina:payments:pipelineB';

interface PipelineBStore {
  proofs: Record<string, PropertyPaymentProof>;
}

export function initialProof(tripId: string): PropertyPaymentProof {
  return {
    tripId,
    status: 'not_submitted',
    confirmationCode: null,
    paidAmountCents: null,
    screenshot: null,
    submittedAt: null,
    verifiedAt: null,
    rejectionReason: null,
  };
}

// ── Pure validation (single source of truth for the 3-field rule) ───────────

const CONFIRMATION_CODE_PATTERN = /^[A-Za-z0-9-]{4,32}$/;

function isValidScreenshot(ref: ScreenshotRef | null): ref is ScreenshotRef {
  return (
    ref !== null &&
    typeof ref.uri === 'string' &&
    ref.uri.trim().length > 0 &&
    typeof ref.uploadedAt === 'string' &&
    !Number.isNaN(new Date(ref.uploadedAt).getTime())
  );
}

export function validateProofFields(proof: PropertyPaymentProof): ProofValidationIssue[] {
  const issues: ProofValidationIssue[] = [];
  const code = proof.confirmationCode?.trim() || '';
  if (!code) {
    issues.push({ field: 'confirmationCode', reason: 'Reservation confirmation code is required.' });
  } else if (!CONFIRMATION_CODE_PATTERN.test(code)) {
    issues.push({
      field: 'confirmationCode',
      reason: 'Confirmation code must be 4–32 letters, numbers, or dashes.',
    });
  }
  if (proof.paidAmountCents === null) {
    issues.push({ field: 'paidAmountCents', reason: 'Paid amount is required.' });
  } else if (!Number.isInteger(proof.paidAmountCents) || proof.paidAmountCents <= 0) {
    issues.push({ field: 'paidAmountCents', reason: 'Paid amount must be a positive integer of cents.' });
  }
  if (!isValidScreenshot(proof.screenshot)) {
    issues.push({ field: 'screenshot', reason: 'A payment screenshot upload is required.' });
  }
  return issues;
}

// ── Pure transitions ─────────────────────────────────────────────────────────

export function applyDraft(proof: PropertyPaymentProof, draft: ProofDraft): PropertyPaymentProof {
  if (proof.status === 'pending_verification') {
    throw new PropertyProofError(
      'proof_locked_pending',
      'Proof is under review and cannot be edited. Wait for the review result.'
    );
  }
  if (proof.status === 'verified') {
    throw new PropertyProofError('proof_already_verified', 'Proof is already verified.');
  }
  const merged: PropertyPaymentProof = {
    ...proof,
    confirmationCode: draft.confirmationCode !== undefined ? draft.confirmationCode : proof.confirmationCode,
    paidAmountCents: draft.paidAmountCents !== undefined ? draft.paidAmountCents : proof.paidAmountCents,
    screenshot: draft.screenshot !== undefined ? draft.screenshot : proof.screenshot,
    status: 'draft_incomplete',
    // Editing after rejection clears the stale review outcome.
    rejectionReason: null,
  };
  return merged;
}

export function submitTransition(proof: PropertyPaymentProof, now: Date): PropertyPaymentProof {
  if (proof.status === 'verified') {
    throw new PropertyProofError('proof_already_verified', 'Proof is already verified.');
  }
  if (proof.status === 'pending_verification') {
    throw new PropertyProofError('proof_locked_pending', 'Proof is already awaiting review.');
  }
  const issues = validateProofFields(proof);
  if (issues.length > 0) {
    throw new PropertyProofError(
      'proof_incomplete',
      `Proof is incomplete: ${issues.map((issue) => issue.reason).join(' ')}`,
      issues
    );
  }
  return {
    ...proof,
    confirmationCode: proof.confirmationCode!.trim(),
    status: 'pending_verification',
    submittedAt: now.toISOString(),
    rejectionReason: null,
  };
}

export function reviewTransition(
  proof: PropertyPaymentProof,
  verdict: 'verified' | 'rejected',
  now: Date,
  rejectionReason?: string
): PropertyPaymentProof {
  if (proof.status !== 'pending_verification') {
    throw new PropertyProofError(
      proof.status === 'verified' ? 'proof_already_verified' : 'proof_not_pending',
      `Cannot review a proof in state '${proof.status}'.`
    );
  }
  if (verdict === 'verified') {
    return { ...proof, status: 'verified', verifiedAt: now.toISOString(), rejectionReason: null };
  }
  return {
    ...proof,
    status: 'rejected',
    rejectionReason: rejectionReason || 'Proof could not be verified.',
  };
}

// ── Persistence-backed service ───────────────────────────────────────────────

let cachedStore: PipelineBStore | null = null;

async function loadStore(): Promise<PipelineBStore> {
  if (cachedStore) return cachedStore;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cachedStore = raw ? (JSON.parse(raw) as PipelineBStore) : { proofs: {} };
  } catch {
    // Corrupt/unreadable store: start clean but do NOT cache, so a transient
    // read failure can recover on the next call.
    return { proofs: {} };
  }
  return cachedStore;
}

async function saveStore(store: PipelineBStore): Promise<void> {
  // Persistence failures must surface — a swallowed write would let the UI
  // claim a proof was captured when it was not.
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  cachedStore = store;
}

async function saveProof(proof: PropertyPaymentProof): Promise<PropertyPaymentProof> {
  const store = await loadStore();
  await saveStore({ proofs: { ...store.proofs, [proof.tripId]: proof } });
  return { ...proof };
}

export const propertyPaymentService: PropertyPaymentApi = {
  async getProof(tripId: string): Promise<PropertyPaymentProof> {
    const store = await loadStore();
    return { ...(store.proofs[tripId] || initialProof(tripId)) };
  },

  async saveDraft(tripId: string, draft: ProofDraft): Promise<PropertyPaymentProof> {
    const current = await this.getProof(tripId);
    return saveProof(applyDraft(current, draft));
  },

  async validateProof(tripId: string): Promise<ProofValidationIssue[]> {
    return validateProofFields(await this.getProof(tripId));
  },

  async submitProof(tripId: string): Promise<PropertyPaymentProof> {
    const current = await this.getProof(tripId);
    return saveProof(submitTransition(current, new Date()));
  },

  async reviewProof(
    tripId: string,
    verdict: 'verified' | 'rejected',
    rejectionReason?: string
  ): Promise<PropertyPaymentProof> {
    const current = await this.getProof(tripId);
    return saveProof(reviewTransition(current, verdict, new Date(), rejectionReason));
  },

  async unlocksDownstream(tripId: string): Promise<boolean> {
    const proof = await this.getProof(tripId);
    // Only a verified proof — which by construction passed the 3-field rule —
    // may unlock downstream gates. Never partial, pending, or rejected proofs.
    return proof.status === 'verified';
  },

  async resetAll(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    cachedStore = null;
  },
};
