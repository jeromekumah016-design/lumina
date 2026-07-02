import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DepositEvent,
  DepositRecord,
  LuminaPaymentApi,
  LuminaPaymentError,
  MembershipPaymentEvent,
  MembershipPaymentRecord,
} from '../types/luminaPayments';

/**
 * Pipeline A — Lumina payments (Stripe path): membership subscription + trip
 * deposit. Charges flow through Lumina. Strictly separate from Pipeline B
 * (propertyPaymentService) — no shared state, records, or storage keys.
 *
 * The state machines live in the exported pure functions
 * (transitionMembership / transitionDeposit) so every transition is unit
 * testable without storage; the service wraps them with persistence.
 */

const STORAGE_KEY = 'lumina:payments:pipelineA';

interface PipelineAStore {
  membership: MembershipPaymentRecord;
  deposits: Record<string, DepositRecord>;
}

const INITIAL_MEMBERSHIP: MembershipPaymentRecord = {
  status: 'none',
  plan: null,
  amountCents: null,
  paidAt: null,
  canceledAt: null,
};

export function initialDeposit(tripId: string): DepositRecord {
  return {
    tripId,
    status: 'not_paid',
    amountCents: null,
    paidAt: null,
    bookingLockDeadline: null,
    refundedAt: null,
    lockedAt: null,
  };
}

// ── Pure state machines ──────────────────────────────────────────────────────

export function transitionMembership(
  record: MembershipPaymentRecord,
  event: MembershipPaymentEvent,
  now: Date
): MembershipPaymentRecord {
  switch (event.type) {
    case 'PAY': {
      if (record.status === 'active') {
        throw new LuminaPaymentError('membership_already_active', 'Membership is already active.');
      }
      if (!Number.isInteger(event.amountCents) || event.amountCents <= 0) {
        throw new LuminaPaymentError('invalid_amount', 'Membership amount must be a positive integer of cents.');
      }
      return {
        status: 'active',
        plan: event.plan,
        amountCents: event.amountCents,
        paidAt: now.toISOString(),
        canceledAt: null,
      };
    }
    case 'CANCEL': {
      if (record.status !== 'active') {
        throw new LuminaPaymentError('membership_not_active', 'No active membership to cancel.');
      }
      return { ...record, status: 'canceled', canceledAt: now.toISOString() };
    }
  }
}

/**
 * Deposit state machine. The booking-lock deadline is the explicit pivot:
 *   - strictly BEFORE the deadline: paid deposit is refundable
 *   - AT or AFTER the deadline: paid deposit is locked (non-refundable)
 */
export function transitionDeposit(record: DepositRecord, event: DepositEvent, now: Date): DepositRecord {
  // Time-based pivot is applied before every event so no code path can act
  // on a stale "refundable" state after the deadline has passed.
  const current = applyDeadlinePivot(record, now);

  switch (event.type) {
    case 'EVALUATE':
      return current;

    case 'PAY': {
      if (current.status !== 'not_paid') {
        throw new LuminaPaymentError(
          current.status === 'refunded' ? 'deposit_already_refunded' : 'deposit_already_paid',
          `Deposit cannot be paid from state '${current.status}'.`
        );
      }
      if (!Number.isInteger(event.amountCents) || event.amountCents <= 0) {
        throw new LuminaPaymentError('invalid_amount', 'Deposit amount must be a positive integer of cents.');
      }
      const deadline = new Date(event.bookingLockDeadline);
      if (Number.isNaN(deadline.getTime()) || deadline.getTime() <= now.getTime()) {
        throw new LuminaPaymentError('invalid_deadline', 'Booking-lock deadline must be a valid future date.');
      }
      return {
        ...current,
        status: 'paid_refundable',
        amountCents: event.amountCents,
        paidAt: now.toISOString(),
        bookingLockDeadline: deadline.toISOString(),
      };
    }

    case 'REQUEST_REFUND': {
      if (current.status === 'not_paid') {
        throw new LuminaPaymentError('deposit_not_paid', 'No paid deposit to refund.');
      }
      if (current.status === 'refunded') {
        throw new LuminaPaymentError('deposit_already_refunded', 'Deposit was already refunded.');
      }
      if (current.status === 'locked_nonrefundable') {
        throw new LuminaPaymentError(
          'deposit_locked',
          'The booking-lock deadline has passed — this deposit is non-refundable.'
        );
      }
      // paid_refundable and strictly before the deadline (pivot already applied).
      return { ...current, status: 'refunded', refundedAt: now.toISOString() };
    }
  }
}

/** Applies the refundable → locked pivot if the deadline has been reached. */
function applyDeadlinePivot(record: DepositRecord, now: Date): DepositRecord {
  if (
    record.status === 'paid_refundable' &&
    record.bookingLockDeadline !== null &&
    now.getTime() >= new Date(record.bookingLockDeadline).getTime()
  ) {
    return { ...record, status: 'locked_nonrefundable', lockedAt: now.toISOString() };
  }
  return record;
}

// ── Persistence-backed service ───────────────────────────────────────────────

let cachedStore: PipelineAStore | null = null;

async function loadStore(): Promise<PipelineAStore> {
  if (cachedStore) return cachedStore;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cachedStore = raw
      ? (JSON.parse(raw) as PipelineAStore)
      : { membership: { ...INITIAL_MEMBERSHIP }, deposits: {} };
  } catch {
    // Corrupt/unreadable store: start clean but do NOT cache, so a transient
    // read failure can recover on the next call.
    return { membership: { ...INITIAL_MEMBERSHIP }, deposits: {} };
  }
  return cachedStore;
}

async function saveStore(store: PipelineAStore): Promise<void> {
  // Persistence failures must surface to callers — a swallowed write here
  // would show a paid state that evaporates on restart.
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  cachedStore = store;
}

export const luminaPaymentService: LuminaPaymentApi = {
  async getMembershipPayment(): Promise<MembershipPaymentRecord> {
    const store = await loadStore();
    return { ...store.membership };
  },

  async payMembership(plan: string, amountCents: number): Promise<MembershipPaymentRecord> {
    const store = await loadStore();
    const next = transitionMembership(store.membership, { type: 'PAY', plan, amountCents }, new Date());
    await saveStore({ ...store, membership: next });
    return { ...next };
  },

  async cancelMembership(): Promise<MembershipPaymentRecord> {
    const store = await loadStore();
    const next = transitionMembership(store.membership, { type: 'CANCEL' }, new Date());
    await saveStore({ ...store, membership: next });
    return { ...next };
  },

  async getDeposit(tripId: string, now: Date = new Date()): Promise<DepositRecord> {
    const store = await loadStore();
    const record = store.deposits[tripId] || initialDeposit(tripId);
    const evaluated = transitionDeposit(record, { type: 'EVALUATE' }, now);
    if (evaluated.status !== record.status) {
      // The deadline pivot fired — persist so the lock is durable.
      await saveStore({ ...store, deposits: { ...store.deposits, [tripId]: evaluated } });
    }
    return { ...evaluated };
  },

  async payDeposit(
    tripId: string,
    amountCents: number,
    bookingLockDeadline: string,
    now: Date = new Date()
  ): Promise<DepositRecord> {
    const store = await loadStore();
    const record = store.deposits[tripId] || initialDeposit(tripId);
    const next = transitionDeposit(record, { type: 'PAY', amountCents, bookingLockDeadline }, now);
    await saveStore({ ...store, deposits: { ...store.deposits, [tripId]: next } });
    return { ...next };
  },

  async requestDepositRefund(tripId: string, now: Date = new Date()): Promise<DepositRecord> {
    const store = await loadStore();
    const record = store.deposits[tripId] || initialDeposit(tripId);
    let next: DepositRecord;
    try {
      next = transitionDeposit(record, { type: 'REQUEST_REFUND' }, now);
    } catch (error) {
      // If the refusal was the deadline pivot, persist the locked state so the
      // record reflects reality even though the refund was denied.
      const evaluated = transitionDeposit(record, { type: 'EVALUATE' }, now);
      if (evaluated.status !== record.status) {
        await saveStore({ ...store, deposits: { ...store.deposits, [tripId]: evaluated } });
      }
      throw error;
    }
    await saveStore({ ...store, deposits: { ...store.deposits, [tripId]: next } });
    return { ...next };
  },

  async isDepositRefundable(tripId: string, now: Date = new Date()): Promise<boolean> {
    const deposit = await this.getDeposit(tripId, now);
    return deposit.status === 'paid_refundable';
  },

  async resetAll(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    cachedStore = null;
  },
};
