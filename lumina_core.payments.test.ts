/**
 * lumina_core.payments.test.ts
 *
 * Exhaustive transition coverage for the two payment pipelines:
 *
 *   Pipeline A (src/services/luminaPaymentService.ts) — Lumina/Stripe path:
 *     membership subscription + trip deposit. Deposit pivots on the
 *     booking-lock deadline: refundable strictly BEFORE it, locked
 *     non-refundable AT/AFTER it.
 *
 *   Pipeline B (src/services/propertyPaymentService.ts) — Airbnb/VRBO direct
 *     pay proof: a proof is complete ONLY with all three of confirmation
 *     code, paid amount, and screenshot ref; only 'verified' unlocks
 *     downstream gates.
 *
 *   The pipelines must stay strictly separate (distinct storage, no shared
 *   state) — asserted in the separation suite.
 *
 * File name intentionally matches the `lumina_core` test-path pattern so
 * `npm test` picks it up alongside lumina_core.test.ts.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Fixed clock for deterministic deadline-pivot tests.
const NOW = new Date('2026-07-02T12:00:00.000Z');
const BEFORE_DEADLINE = new Date('2026-07-04T11:59:59.999Z');
const DEADLINE = '2026-07-04T12:00:00.000Z';
const AT_DEADLINE = new Date(DEADLINE);
const AFTER_DEADLINE = new Date('2026-07-05T00:00:00.000Z');

const VALID_SCREENSHOT = {
  uri: 'file:///photos/airbnb-receipt.png',
  fileName: 'airbnb-receipt.png',
  uploadedAt: '2026-07-02T11:00:00.000Z',
};

type PipelineA = typeof import('./src/services/luminaPaymentService');
type PipelineB = typeof import('./src/services/propertyPaymentService');

function freshA(): PipelineA {
  return require('./src/services/luminaPaymentService');
}
function freshB(): PipelineB {
  return require('./src/services/propertyPaymentService');
}
function mockStorage() {
  return require('@react-native-async-storage/async-storage').default;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline A — membership payment state machine
// ─────────────────────────────────────────────────────────────────────────────
describe('Pipeline A — membership payment transitions', () => {
  let A: PipelineA;
  beforeEach(() => {
    jest.resetModules();
    A = freshA();
  });

  const NONE = { status: 'none', plan: null, amountCents: null, paidAt: null, canceledAt: null } as const;

  it('none + PAY → active with plan, amount, paidAt', () => {
    const next = A.transitionMembership(NONE, { type: 'PAY', plan: 'Monthly', amountCents: 2000 }, NOW);
    expect(next.status).toBe('active');
    expect(next.plan).toBe('Monthly');
    expect(next.amountCents).toBe(2000);
    expect(next.paidAt).toBe(NOW.toISOString());
    expect(next.canceledAt).toBeNull();
  });

  it('active + PAY → membership_already_active', () => {
    const active = A.transitionMembership(NONE, { type: 'PAY', plan: 'Monthly', amountCents: 2000 }, NOW);
    expect(() => A.transitionMembership(active, { type: 'PAY', plan: 'Monthly', amountCents: 2000 }, NOW))
      .toThrow(expect.objectContaining({ code: 'membership_already_active' }));
  });

  it.each([[0], [-500], [19.99]])('PAY with invalid amount %p → invalid_amount', (amountCents) => {
    expect(() => A.transitionMembership(NONE, { type: 'PAY', plan: 'Monthly', amountCents }, NOW))
      .toThrow(expect.objectContaining({ code: 'invalid_amount' }));
  });

  it('active + CANCEL → canceled with canceledAt', () => {
    const active = A.transitionMembership(NONE, { type: 'PAY', plan: 'Monthly', amountCents: 2000 }, NOW);
    const canceled = A.transitionMembership(active, { type: 'CANCEL' }, AFTER_DEADLINE);
    expect(canceled.status).toBe('canceled');
    expect(canceled.canceledAt).toBe(AFTER_DEADLINE.toISOString());
  });

  it('none + CANCEL → membership_not_active', () => {
    expect(() => A.transitionMembership(NONE, { type: 'CANCEL' }, NOW))
      .toThrow(expect.objectContaining({ code: 'membership_not_active' }));
  });

  it('canceled + CANCEL → membership_not_active (no double cancel)', () => {
    const active = A.transitionMembership(NONE, { type: 'PAY', plan: 'Monthly', amountCents: 2000 }, NOW);
    const canceled = A.transitionMembership(active, { type: 'CANCEL' }, NOW);
    expect(() => A.transitionMembership(canceled, { type: 'CANCEL' }, NOW))
      .toThrow(expect.objectContaining({ code: 'membership_not_active' }));
  });

  it('canceled + PAY → active again with fresh paidAt and cleared canceledAt', () => {
    const active = A.transitionMembership(NONE, { type: 'PAY', plan: 'Monthly', amountCents: 2000 }, NOW);
    const canceled = A.transitionMembership(active, { type: 'CANCEL' }, NOW);
    const reactivated = A.transitionMembership(canceled, { type: 'PAY', plan: 'Monthly', amountCents: 2000 }, AFTER_DEADLINE);
    expect(reactivated.status).toBe('active');
    expect(reactivated.paidAt).toBe(AFTER_DEADLINE.toISOString());
    expect(reactivated.canceledAt).toBeNull();
  });

  it('service persists membership payment to the pipeline A storage key', async () => {
    await A.luminaPaymentService.payMembership('Monthly', 2000);
    const raw = await mockStorage().getItem('lumina:payments:pipelineA');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw).membership.status).toBe('active');
  });

  it('service surfaces illegal membership transitions (no silent success)', async () => {
    await A.luminaPaymentService.payMembership('Monthly', 2000);
    await expect(A.luminaPaymentService.payMembership('Monthly', 2000))
      .rejects.toMatchObject({ code: 'membership_already_active' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline A — deposit state machine (exhaustive state × event matrix)
// ─────────────────────────────────────────────────────────────────────────────
describe('Pipeline A — deposit transitions (deadline is the pivot)', () => {
  let A: PipelineA;
  beforeEach(() => {
    jest.resetModules();
    A = freshA();
  });

  const paidDeposit = () =>
    A.transitionDeposit(
      A.initialDeposit('trip-1'),
      { type: 'PAY', amountCents: 15000, bookingLockDeadline: DEADLINE },
      NOW
    );

  // ── from not_paid ─────────────────────────────────────────────────────────
  it('not_paid + PAY(valid) → paid_refundable with amount, paidAt, deadline', () => {
    const paid = paidDeposit();
    expect(paid.status).toBe('paid_refundable');
    expect(paid.amountCents).toBe(15000);
    expect(paid.paidAt).toBe(NOW.toISOString());
    expect(paid.bookingLockDeadline).toBe(DEADLINE);
    expect(paid.refundedAt).toBeNull();
    expect(paid.lockedAt).toBeNull();
  });

  it.each([[0], [-100], [150.5]])('not_paid + PAY(amount %p) → invalid_amount', (amountCents) => {
    expect(() =>
      A.transitionDeposit(A.initialDeposit('t'), { type: 'PAY', amountCents, bookingLockDeadline: DEADLINE }, NOW)
    ).toThrow(expect.objectContaining({ code: 'invalid_amount' }));
  });

  it.each([
    ['past deadline', '2026-07-01T00:00:00.000Z'],
    ['deadline equal to now', NOW.toISOString()],
    ['garbage deadline', 'not-a-date'],
  ])('not_paid + PAY(%s) → invalid_deadline', (_label, bookingLockDeadline) => {
    expect(() =>
      A.transitionDeposit(A.initialDeposit('t'), { type: 'PAY', amountCents: 15000, bookingLockDeadline }, NOW)
    ).toThrow(expect.objectContaining({ code: 'invalid_deadline' }));
  });

  it('not_paid + REQUEST_REFUND → deposit_not_paid', () => {
    expect(() => A.transitionDeposit(A.initialDeposit('t'), { type: 'REQUEST_REFUND' }, NOW))
      .toThrow(expect.objectContaining({ code: 'deposit_not_paid' }));
  });

  it('not_paid + EVALUATE → not_paid (no pivot without a payment)', () => {
    const next = A.transitionDeposit(A.initialDeposit('t'), { type: 'EVALUATE' }, AFTER_DEADLINE);
    expect(next.status).toBe('not_paid');
  });

  // ── from paid_refundable, strictly BEFORE the deadline ───────────────────
  it('paid + EVALUATE before deadline → still paid_refundable', () => {
    const next = A.transitionDeposit(paidDeposit(), { type: 'EVALUATE' }, BEFORE_DEADLINE);
    expect(next.status).toBe('paid_refundable');
    expect(next.lockedAt).toBeNull();
  });

  it('paid + REQUEST_REFUND before deadline → refunded with refundedAt', () => {
    const next = A.transitionDeposit(paidDeposit(), { type: 'REQUEST_REFUND' }, BEFORE_DEADLINE);
    expect(next.status).toBe('refunded');
    expect(next.refundedAt).toBe(BEFORE_DEADLINE.toISOString());
  });

  it('paid + PAY → deposit_already_paid', () => {
    expect(() =>
      A.transitionDeposit(paidDeposit(), { type: 'PAY', amountCents: 15000, bookingLockDeadline: DEADLINE }, BEFORE_DEADLINE)
    ).toThrow(expect.objectContaining({ code: 'deposit_already_paid' }));
  });

  // ── the pivot boundary: AT the deadline the deposit is already locked ────
  it('paid + EVALUATE exactly AT the deadline → locked_nonrefundable (boundary)', () => {
    const next = A.transitionDeposit(paidDeposit(), { type: 'EVALUATE' }, AT_DEADLINE);
    expect(next.status).toBe('locked_nonrefundable');
    expect(next.lockedAt).toBe(AT_DEADLINE.toISOString());
  });

  it('paid + REQUEST_REFUND exactly AT the deadline → deposit_locked', () => {
    expect(() => A.transitionDeposit(paidDeposit(), { type: 'REQUEST_REFUND' }, AT_DEADLINE))
      .toThrow(expect.objectContaining({ code: 'deposit_locked' }));
  });

  it('paid + EVALUATE after deadline → locked_nonrefundable', () => {
    const next = A.transitionDeposit(paidDeposit(), { type: 'EVALUATE' }, AFTER_DEADLINE);
    expect(next.status).toBe('locked_nonrefundable');
  });

  it('paid + REQUEST_REFUND after deadline → deposit_locked (never refunds late)', () => {
    expect(() => A.transitionDeposit(paidDeposit(), { type: 'REQUEST_REFUND' }, AFTER_DEADLINE))
      .toThrow(expect.objectContaining({ code: 'deposit_locked' }));
  });

  // ── from refunded (terminal) ──────────────────────────────────────────────
  it('refunded + REQUEST_REFUND → deposit_already_refunded', () => {
    const refunded = A.transitionDeposit(paidDeposit(), { type: 'REQUEST_REFUND' }, BEFORE_DEADLINE);
    expect(() => A.transitionDeposit(refunded, { type: 'REQUEST_REFUND' }, BEFORE_DEADLINE))
      .toThrow(expect.objectContaining({ code: 'deposit_already_refunded' }));
  });

  it('refunded + PAY → deposit_already_refunded (record is terminal)', () => {
    const refunded = A.transitionDeposit(paidDeposit(), { type: 'REQUEST_REFUND' }, BEFORE_DEADLINE);
    expect(() =>
      A.transitionDeposit(refunded, { type: 'PAY', amountCents: 15000, bookingLockDeadline: DEADLINE }, BEFORE_DEADLINE)
    ).toThrow(expect.objectContaining({ code: 'deposit_already_refunded' }));
  });

  it('refunded + EVALUATE after deadline stays refunded (no posthumous lock)', () => {
    const refunded = A.transitionDeposit(paidDeposit(), { type: 'REQUEST_REFUND' }, BEFORE_DEADLINE);
    const next = A.transitionDeposit(refunded, { type: 'EVALUATE' }, AFTER_DEADLINE);
    expect(next.status).toBe('refunded');
    expect(next.lockedAt).toBeNull();
  });

  // ── from locked_nonrefundable (terminal) ─────────────────────────────────
  it('locked + REQUEST_REFUND → deposit_locked', () => {
    const locked = A.transitionDeposit(paidDeposit(), { type: 'EVALUATE' }, AFTER_DEADLINE);
    expect(() => A.transitionDeposit(locked, { type: 'REQUEST_REFUND' }, AFTER_DEADLINE))
      .toThrow(expect.objectContaining({ code: 'deposit_locked' }));
  });

  it('locked + PAY → deposit_already_paid', () => {
    const locked = A.transitionDeposit(paidDeposit(), { type: 'EVALUATE' }, AFTER_DEADLINE);
    expect(() =>
      A.transitionDeposit(locked, { type: 'PAY', amountCents: 15000, bookingLockDeadline: DEADLINE }, AFTER_DEADLINE)
    ).toThrow(expect.objectContaining({ code: 'deposit_already_paid' }));
  });

  it('locked + EVALUATE is idempotent (lockedAt is not rewritten)', () => {
    const locked = A.transitionDeposit(paidDeposit(), { type: 'EVALUATE' }, AT_DEADLINE);
    const later = A.transitionDeposit(locked, { type: 'EVALUATE' }, AFTER_DEADLINE);
    expect(later.status).toBe('locked_nonrefundable');
    expect(later.lockedAt).toBe(AT_DEADLINE.toISOString());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline A — service persistence + time-based evaluation
// ─────────────────────────────────────────────────────────────────────────────
describe('Pipeline A — deposit service persistence', () => {
  let A: PipelineA;
  beforeEach(() => {
    jest.resetModules();
    A = freshA();
  });

  it('payDeposit persists and getDeposit round-trips before the deadline', async () => {
    await A.luminaPaymentService.payDeposit('trip-1', 15000, DEADLINE, NOW);
    const deposit = await A.luminaPaymentService.getDeposit('trip-1', BEFORE_DEADLINE);
    expect(deposit.status).toBe('paid_refundable');
    expect(await A.luminaPaymentService.isDepositRefundable('trip-1', BEFORE_DEADLINE)).toBe(true);
  });

  it('getDeposit applies AND persists the lock once the deadline passes', async () => {
    await A.luminaPaymentService.payDeposit('trip-1', 15000, DEADLINE, NOW);
    const deposit = await A.luminaPaymentService.getDeposit('trip-1', AFTER_DEADLINE);
    expect(deposit.status).toBe('locked_nonrefundable');
    const raw = await mockStorage().getItem('lumina:payments:pipelineA');
    expect(JSON.parse(raw).deposits['trip-1'].status).toBe('locked_nonrefundable');
    expect(await A.luminaPaymentService.isDepositRefundable('trip-1', AFTER_DEADLINE)).toBe(false);
  });

  it('late refund request throws deposit_locked AND persists the locked state', async () => {
    await A.luminaPaymentService.payDeposit('trip-1', 15000, DEADLINE, NOW);
    await expect(A.luminaPaymentService.requestDepositRefund('trip-1', AFTER_DEADLINE))
      .rejects.toMatchObject({ code: 'deposit_locked' });
    const raw = await mockStorage().getItem('lumina:payments:pipelineA');
    expect(JSON.parse(raw).deposits['trip-1'].status).toBe('locked_nonrefundable');
  });

  it('on-time refund persists the refunded state', async () => {
    await A.luminaPaymentService.payDeposit('trip-1', 15000, DEADLINE, NOW);
    const refunded = await A.luminaPaymentService.requestDepositRefund('trip-1', BEFORE_DEADLINE);
    expect(refunded.status).toBe('refunded');
    const raw = await mockStorage().getItem('lumina:payments:pipelineA');
    expect(JSON.parse(raw).deposits['trip-1'].status).toBe('refunded');
  });

  it('deposits are isolated per trip', async () => {
    await A.luminaPaymentService.payDeposit('trip-1', 15000, DEADLINE, NOW);
    const other = await A.luminaPaymentService.getDeposit('trip-2', NOW);
    expect(other.status).toBe('not_paid');
  });

  it('resetAll clears pipeline A storage', async () => {
    await A.luminaPaymentService.payDeposit('trip-1', 15000, DEADLINE, NOW);
    await A.luminaPaymentService.resetAll();
    expect(await mockStorage().getItem('lumina:payments:pipelineA')).toBeNull();
    expect((await A.luminaPaymentService.getDeposit('trip-1', NOW)).status).toBe('not_paid');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline B — property payment proof (3-field completion rule)
// ─────────────────────────────────────────────────────────────────────────────
describe('Pipeline B — property payment proof transitions', () => {
  let B: PipelineB;
  beforeEach(() => {
    jest.resetModules();
    B = freshB();
  });

  const svc = () => B.propertyPaymentService;
  const fullDraft = { confirmationCode: 'HMAB-1234', paidAmountCents: 92000, screenshot: VALID_SCREENSHOT };

  it('starts as not_submitted with all fields empty', async () => {
    const proof = await svc().getProof('trip-1');
    expect(proof.status).toBe('not_submitted');
    expect(proof.confirmationCode).toBeNull();
    expect(proof.paidAmountCents).toBeNull();
    expect(proof.screenshot).toBeNull();
  });

  it('saveDraft with partial fields → draft_incomplete, and drafts merge across calls', async () => {
    await svc().saveDraft('trip-1', { confirmationCode: 'HMAB-1234' });
    const merged = await svc().saveDraft('trip-1', { paidAmountCents: 92000 });
    expect(merged.status).toBe('draft_incomplete');
    expect(merged.confirmationCode).toBe('HMAB-1234');
    expect(merged.paidAmountCents).toBe(92000);
    expect(merged.screenshot).toBeNull();
  });

  it('validateProof on an empty proof reports all three required fields', async () => {
    const issues = await svc().validateProof('trip-1');
    expect(issues.map((issue) => issue.field).sort()).toEqual(
      ['confirmationCode', 'paidAmountCents', 'screenshot']
    );
  });

  // Each of the three fields individually missing must block submission.
  it.each([
    ['confirmationCode', { paidAmountCents: 92000, screenshot: VALID_SCREENSHOT }],
    ['paidAmountCents', { confirmationCode: 'HMAB-1234', screenshot: VALID_SCREENSHOT }],
    ['screenshot', { confirmationCode: 'HMAB-1234', paidAmountCents: 92000 }],
  ] as const)('submit without %s → proof_incomplete naming exactly that field', async (missingField, draft) => {
    await svc().saveDraft('trip-1', draft as any);
    await expect(svc().submitProof('trip-1')).rejects.toMatchObject({
      code: 'proof_incomplete',
      issues: [expect.objectContaining({ field: missingField })],
    });
    // A failed submit must not advance the state.
    expect((await svc().getProof('trip-1')).status).toBe('draft_incomplete');
  });

  it.each([
    ['too short', 'ab'],
    ['invalid characters', 'ABC$1234'],
    ['too long', 'A'.repeat(33)],
    ['blank', '   '],
  ])('invalid confirmation code (%s) blocks submission', async (_label, confirmationCode) => {
    await svc().saveDraft('trip-1', { ...fullDraft, confirmationCode });
    await expect(svc().submitProof('trip-1')).rejects.toMatchObject({ code: 'proof_incomplete' });
  });

  it.each([[0], [-500], [920.5]])('invalid paid amount %p blocks submission', async (paidAmountCents) => {
    await svc().saveDraft('trip-1', { ...fullDraft, paidAmountCents });
    await expect(svc().submitProof('trip-1')).rejects.toMatchObject({ code: 'proof_incomplete' });
  });

  it.each([
    ['empty uri', { ...VALID_SCREENSHOT, uri: '  ' }],
    ['invalid uploadedAt', { ...VALID_SCREENSHOT, uploadedAt: 'yesterday' }],
  ])('invalid screenshot ref (%s) blocks submission', async (_label, screenshot) => {
    await svc().saveDraft('trip-1', { ...fullDraft, screenshot });
    await expect(svc().submitProof('trip-1')).rejects.toMatchObject({ code: 'proof_incomplete' });
  });

  it('submit with all three valid fields → pending_verification with submittedAt, code trimmed', async () => {
    await svc().saveDraft('trip-1', { ...fullDraft, confirmationCode: '  HMAB-1234  ' });
    const pending = await svc().submitProof('trip-1');
    expect(pending.status).toBe('pending_verification');
    expect(pending.submittedAt).toBeTruthy();
    expect(pending.confirmationCode).toBe('HMAB-1234');
  });

  it('editing while pending_verification → proof_locked_pending', async () => {
    await svc().saveDraft('trip-1', fullDraft);
    await svc().submitProof('trip-1');
    await expect(svc().saveDraft('trip-1', { paidAmountCents: 1 }))
      .rejects.toMatchObject({ code: 'proof_locked_pending' });
  });

  it('double submit while pending → proof_locked_pending', async () => {
    await svc().saveDraft('trip-1', fullDraft);
    await svc().submitProof('trip-1');
    await expect(svc().submitProof('trip-1')).rejects.toMatchObject({ code: 'proof_locked_pending' });
  });

  it('review verdict verified → verified with verifiedAt', async () => {
    await svc().saveDraft('trip-1', fullDraft);
    await svc().submitProof('trip-1');
    const verified = await svc().reviewProof('trip-1', 'verified');
    expect(verified.status).toBe('verified');
    expect(verified.verifiedAt).toBeTruthy();
  });

  it('review verdict rejected → rejected with reason; member can edit and resubmit', async () => {
    await svc().saveDraft('trip-1', fullDraft);
    await svc().submitProof('trip-1');
    const rejected = await svc().reviewProof('trip-1', 'rejected', 'Screenshot unreadable.');
    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectionReason).toBe('Screenshot unreadable.');

    const edited = await svc().saveDraft('trip-1', { screenshot: { ...VALID_SCREENSHOT, fileName: 'retake.png' } });
    expect(edited.status).toBe('draft_incomplete');
    expect(edited.rejectionReason).toBeNull(); // stale outcome cleared

    const resubmitted = await svc().submitProof('trip-1');
    expect(resubmitted.status).toBe('pending_verification');
  });

  it('review on a proof that is not pending → proof_not_pending', async () => {
    await expect(svc().reviewProof('trip-1', 'verified')).rejects.toMatchObject({ code: 'proof_not_pending' });
    await svc().saveDraft('trip-1', { confirmationCode: 'HMAB-1234' });
    await expect(svc().reviewProof('trip-1', 'rejected')).rejects.toMatchObject({ code: 'proof_not_pending' });
  });

  it('verified is terminal: no edits, resubmits, or re-reviews', async () => {
    await svc().saveDraft('trip-1', fullDraft);
    await svc().submitProof('trip-1');
    await svc().reviewProof('trip-1', 'verified');
    await expect(svc().saveDraft('trip-1', { paidAmountCents: 1 }))
      .rejects.toMatchObject({ code: 'proof_already_verified' });
    await expect(svc().submitProof('trip-1')).rejects.toMatchObject({ code: 'proof_already_verified' });
    await expect(svc().reviewProof('trip-1', 'rejected')).rejects.toMatchObject({ code: 'proof_already_verified' });
  });

  it('unlocksDownstream is true ONLY for verified — never partial/pending/rejected', async () => {
    expect(await svc().unlocksDownstream('trip-1')).toBe(false); // not_submitted
    await svc().saveDraft('trip-1', { confirmationCode: 'HMAB-1234', paidAmountCents: 92000 });
    expect(await svc().unlocksDownstream('trip-1')).toBe(false); // incomplete (2 of 3 fields)
    await svc().saveDraft('trip-1', { screenshot: VALID_SCREENSHOT });
    expect(await svc().unlocksDownstream('trip-1')).toBe(false); // complete draft, not submitted
    await svc().submitProof('trip-1');
    expect(await svc().unlocksDownstream('trip-1')).toBe(false); // pending review
    await svc().reviewProof('trip-1', 'rejected');
    expect(await svc().unlocksDownstream('trip-1')).toBe(false); // rejected
    await svc().saveDraft('trip-1', {});
    await svc().submitProof('trip-1');
    await svc().reviewProof('trip-1', 'verified');
    expect(await svc().unlocksDownstream('trip-1')).toBe(true); // verified only
  });

  it('proofs persist to the pipeline B storage key and are isolated per trip', async () => {
    await svc().saveDraft('trip-1', fullDraft);
    const raw = await mockStorage().getItem('lumina:payments:pipelineB');
    expect(JSON.parse(raw).proofs['trip-1'].confirmationCode).toBe('HMAB-1234');
    expect((await svc().getProof('trip-2')).status).toBe('not_submitted');
  });

  it('resetAll clears pipeline B storage', async () => {
    await svc().saveDraft('trip-1', fullDraft);
    await svc().resetAll();
    expect(await mockStorage().getItem('lumina:payments:pipelineB')).toBeNull();
    expect((await svc().getProof('trip-1')).status).toBe('not_submitted');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline separation — A and B must never share state or storage
// ─────────────────────────────────────────────────────────────────────────────
describe('Pipeline separation (A: Lumina/Stripe vs B: Airbnb/VRBO direct)', () => {
  let A: PipelineA;
  let B: PipelineB;
  beforeEach(() => {
    jest.resetModules();
    A = freshA();
    B = freshB();
  });

  it('the two pipelines write to distinct storage keys', async () => {
    await A.luminaPaymentService.payDeposit('trip-1', 15000, DEADLINE, NOW);
    await B.propertyPaymentService.saveDraft('trip-1', { confirmationCode: 'HMAB-1234' });
    const keys = await mockStorage().getAllKeys();
    expect(keys).toContain('lumina:payments:pipelineA');
    expect(keys).toContain('lumina:payments:pipelineB');
  });

  it('resetting pipeline A leaves pipeline B untouched (and vice versa)', async () => {
    await A.luminaPaymentService.payDeposit('trip-1', 15000, DEADLINE, NOW);
    await B.propertyPaymentService.saveDraft('trip-1', {
      confirmationCode: 'HMAB-1234', paidAmountCents: 92000, screenshot: VALID_SCREENSHOT,
    });

    await A.luminaPaymentService.resetAll();
    expect((await A.luminaPaymentService.getDeposit('trip-1', NOW)).status).toBe('not_paid');
    expect((await B.propertyPaymentService.getProof('trip-1')).confirmationCode).toBe('HMAB-1234');

    await B.propertyPaymentService.resetAll();
    await A.luminaPaymentService.payDeposit('trip-1', 15000, DEADLINE, NOW);
    await B.propertyPaymentService.resetAll();
    expect((await A.luminaPaymentService.getDeposit('trip-1', NOW)).status).toBe('paid_refundable');
  });

  it("pipeline A state never leaks into pipeline B's record shape or vice versa", async () => {
    const deposit = await A.luminaPaymentService.payDeposit('trip-1', 15000, DEADLINE, NOW);
    const proof = await B.propertyPaymentService.getProof('trip-1');
    // Pipeline A records know nothing about proof fields...
    expect('confirmationCode' in deposit).toBe(false);
    expect('screenshot' in deposit).toBe(false);
    // ...and pipeline B records know nothing about deposit/refund fields.
    expect('bookingLockDeadline' in proof).toBe(false);
    expect('refundedAt' in proof).toBe(false);
  });
});
