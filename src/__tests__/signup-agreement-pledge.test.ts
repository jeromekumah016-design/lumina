/**
 * Tests for the sign-up / user-agreement / conduct-pledge persistence layer.
 *
 * Follows the project test strategy: pure service/logic layer, no component
 * renders, node environment, in-memory AsyncStorage mock.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function freshService() {
  jest.resetModules();
  const mod = require('../services/userService');
  return mod.userService as typeof import('../services/userService').userService;
}

function freshVersions() {
  jest.resetModules();
  const mod = require('../services/userService');
  return {
    AGREEMENT_VERSION: mod.AGREEMENT_VERSION as string,
    PLEDGE_VERSION: mod.PLEDGE_VERSION as string,
  };
}

// ─── Suite A: AccountStub ─────────────────────────────────────────────────────

describe('AccountStub — persistence', () => {
  let svc: ReturnType<typeof freshService>;

  beforeEach(() => {
    svc = freshService();
  });

  it('getAccountStub returns null when no account exists', async () => {
    const stub = await svc.getAccountStub();
    expect(stub).toBeNull();
  });

  it('saveAccountStub persists and getAccountStub reads it back', async () => {
    const payload = { name: 'Jerome Kumah', email: 'jerome@example.com', createdAt: '2026-06-27T00:00:00.000Z' };
    await svc.saveAccountStub(payload);
    const result = await svc.getAccountStub();
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Jerome Kumah');
    expect(result!.email).toBe('jerome@example.com');
    expect(result!.createdAt).toBe('2026-06-27T00:00:00.000Z');
  });

  it('saveAccountStub returns the saved stub', async () => {
    const payload = { name: 'Alex Rivera', email: 'alex@example.com', createdAt: new Date().toISOString() };
    const returned = await svc.saveAccountStub(payload);
    expect(returned).toMatchObject(payload);
  });

  it('saving a second account stub overwrites the first', async () => {
    await svc.saveAccountStub({ name: 'First', email: 'first@x.com', createdAt: '2026-01-01T00:00:00.000Z' });
    await svc.saveAccountStub({ name: 'Second', email: 'second@x.com', createdAt: '2026-01-02T00:00:00.000Z' });
    const result = await svc.getAccountStub();
    expect(result!.name).toBe('Second');
    expect(result!.email).toBe('second@x.com');
  });

  it('account stub email is a non-empty string', async () => {
    await svc.saveAccountStub({ name: 'Test', email: 'test@lumina.app', createdAt: new Date().toISOString() });
    const result = await svc.getAccountStub();
    expect(typeof result!.email).toBe('string');
    expect(result!.email.length).toBeGreaterThan(0);
  });

  it('account stub does not have a password field', async () => {
    const payload = { name: 'No Pass', email: 'nopass@lumina.app', createdAt: new Date().toISOString() };
    await svc.saveAccountStub(payload);
    const result = await svc.getAccountStub();
    expect((result as any).password).toBeUndefined();
  });
});

// ─── Suite B: AgreementRecord ─────────────────────────────────────────────────

describe('AgreementRecord — persistence', () => {
  let svc: ReturnType<typeof freshService>;

  beforeEach(() => {
    svc = freshService();
  });

  it('getAgreementStatus returns null when no agreement exists', async () => {
    const ag = await svc.getAgreementStatus();
    expect(ag).toBeNull();
  });

  it('acceptAgreement persists and getAgreementStatus reads it back', async () => {
    await svc.acceptAgreement();
    const ag = await svc.getAgreementStatus();
    expect(ag).not.toBeNull();
    expect(ag!.accepted).toBe(true);
  });

  it('acceptAgreement stores the correct version (1.0)', async () => {
    await svc.acceptAgreement();
    const ag = await svc.getAgreementStatus();
    expect(ag!.version).toBe('1.0');
  });

  it('acceptAgreement stores an ISO timestamp for acceptedAt', async () => {
    const before = new Date().toISOString();
    await svc.acceptAgreement();
    const after = new Date().toISOString();
    const ag = await svc.getAgreementStatus();
    expect(ag!.acceptedAt >= before).toBe(true);
    expect(ag!.acceptedAt <= after).toBe(true);
  });

  it('acceptAgreement returns the stored record', async () => {
    const record = await svc.acceptAgreement();
    expect(record.accepted).toBe(true);
    expect(record.version).toBe('1.0');
    expect(typeof record.acceptedAt).toBe('string');
  });

  it('AGREEMENT_VERSION constant is "1.0"', () => {
    const { AGREEMENT_VERSION } = freshVersions();
    expect(AGREEMENT_VERSION).toBe('1.0');
  });
});

// ─── Suite C: PledgeRecord ────────────────────────────────────────────────────

describe('PledgeRecord — persistence', () => {
  let svc: ReturnType<typeof freshService>;

  beforeEach(() => {
    svc = freshService();
  });

  it('getPledgeStatus returns null when no pledge exists', async () => {
    const pl = await svc.getPledgeStatus();
    expect(pl).toBeNull();
  });

  it('acceptPledge persists and getPledgeStatus reads it back', async () => {
    await svc.acceptPledge('JK');
    const pl = await svc.getPledgeStatus();
    expect(pl).not.toBeNull();
    expect(pl!.accepted).toBe(true);
  });

  it('acceptPledge stores the correct version (1.0)', async () => {
    await svc.acceptPledge('JK');
    const pl = await svc.getPledgeStatus();
    expect(pl!.version).toBe('1.0');
  });

  it('acceptPledge stores the provided initials', async () => {
    await svc.acceptPledge('JDK');
    const pl = await svc.getPledgeStatus();
    expect(pl!.initials).toBe('JDK');
  });

  it('acceptPledge stores an ISO timestamp for acceptedAt', async () => {
    const before = new Date().toISOString();
    await svc.acceptPledge('AB');
    const after = new Date().toISOString();
    const pl = await svc.getPledgeStatus();
    expect(pl!.acceptedAt >= before).toBe(true);
    expect(pl!.acceptedAt <= after).toBe(true);
  });

  it('acceptPledge returns the stored record', async () => {
    const record = await svc.acceptPledge('XY');
    expect(record.accepted).toBe(true);
    expect(record.initials).toBe('XY');
    expect(record.version).toBe('1.0');
  });

  it('PLEDGE_VERSION constant is "1.0"', () => {
    const { PLEDGE_VERSION } = freshVersions();
    expect(PLEDGE_VERSION).toBe('1.0');
  });
});

// ─── Suite D: New-user gate logic ─────────────────────────────────────────────

describe('New-user gate routing logic', () => {
  it('no account → gate should redirect to /intro', () => {
    const accountStub = null;
    const agreementStatus = null;
    const pledgeStatus = null;

    function resolveRoute(acct: any, ag: any, pl: any): string {
      if (!acct) return '/intro';
      if (!ag?.accepted) return '/user-agreement';
      if (!pl?.accepted) return '/conduct-pledge';
      return 'APP';
    }

    expect(resolveRoute(accountStub, agreementStatus, pledgeStatus)).toBe('/intro');
  });

  it('account exists but no agreement → gate should redirect to /user-agreement', () => {
    const accountStub = { name: 'Test', email: 'test@x.com', createdAt: '' };
    const agreementStatus = null;
    const pledgeStatus = null;

    function resolveRoute(acct: any, ag: any, pl: any): string {
      if (!acct) return '/intro';
      if (!ag?.accepted) return '/user-agreement';
      if (!pl?.accepted) return '/conduct-pledge';
      return 'APP';
    }

    expect(resolveRoute(accountStub, agreementStatus, pledgeStatus)).toBe('/user-agreement');
  });

  it('account + agreement but no pledge → gate should redirect to /conduct-pledge', () => {
    const accountStub = { name: 'Test', email: 'test@x.com', createdAt: '' };
    const agreementStatus = { accepted: true, version: '1.0', acceptedAt: '' };
    const pledgeStatus = null;

    function resolveRoute(acct: any, ag: any, pl: any): string {
      if (!acct) return '/intro';
      if (!ag?.accepted) return '/user-agreement';
      if (!pl?.accepted) return '/conduct-pledge';
      return 'APP';
    }

    expect(resolveRoute(accountStub, agreementStatus, pledgeStatus)).toBe('/conduct-pledge');
  });

  it('all steps complete → no gate redirect (user reaches the app)', () => {
    const accountStub = { name: 'Jerome', email: 'jerome@x.com', createdAt: '' };
    const agreementStatus = { accepted: true, version: '1.0', acceptedAt: '' };
    const pledgeStatus = { accepted: true, version: '1.0', acceptedAt: '', initials: 'JK' };

    function resolveRoute(acct: any, ag: any, pl: any): string {
      if (!acct) return '/intro';
      if (!ag?.accepted) return '/user-agreement';
      if (!pl?.accepted) return '/conduct-pledge';
      return 'APP';
    }

    expect(resolveRoute(accountStub, agreementStatus, pledgeStatus)).toBe('APP');
  });

  it('agreement with accepted:false is treated as incomplete', () => {
    const accountStub = { name: 'Test', email: 'test@x.com', createdAt: '' };
    const agreementStatus = { accepted: false, version: '1.0', acceptedAt: '' };
    const pledgeStatus = null;

    function resolveRoute(acct: any, ag: any, pl: any): string {
      if (!acct) return '/intro';
      if (!ag?.accepted) return '/user-agreement';
      if (!pl?.accepted) return '/conduct-pledge';
      return 'APP';
    }

    expect(resolveRoute(accountStub, agreementStatus, pledgeStatus)).toBe('/user-agreement');
  });
});

// ─── Suite E: resetAllDemoData clears new state ───────────────────────────────

describe('resetAllDemoData — clears account stub, agreement, pledge', () => {
  it('clears accountStub after save', async () => {
    const svc = freshService();
    await svc.saveAccountStub({ name: 'Test', email: 'test@x.com', createdAt: new Date().toISOString() });
    await svc.resetAllDemoData();
    const result = await svc.getAccountStub();
    expect(result).toBeNull();
  });

  it('clears agreement after accept', async () => {
    const svc = freshService();
    await svc.acceptAgreement();
    await svc.resetAllDemoData();
    const result = await svc.getAgreementStatus();
    expect(result).toBeNull();
  });

  it('clears pledge after accept', async () => {
    const svc = freshService();
    await svc.acceptPledge('JK');
    await svc.resetAllDemoData();
    const result = await svc.getPledgeStatus();
    expect(result).toBeNull();
  });

  it('clears all three in one reset and all return null', async () => {
    const svc = freshService();
    await svc.saveAccountStub({ name: 'Full', email: 'full@x.com', createdAt: new Date().toISOString() });
    await svc.acceptAgreement();
    await svc.acceptPledge('FK');
    await svc.resetAllDemoData();
    const [acct, ag, pl] = await Promise.all([
      svc.getAccountStub(),
      svc.getAgreementStatus(),
      svc.getPledgeStatus(),
    ]);
    expect(acct).toBeNull();
    expect(ag).toBeNull();
    expect(pl).toBeNull();
  });

  it('resetAllDemoData also clears existing onboarding state', async () => {
    const svc = freshService();
    await svc.completeOnboarding({ name: 'Jerome', gender: 'MALE', age: 28, preferredCity: 'Chicago' });
    await svc.resetAllDemoData();
    const isOnboarded = await svc.isOnboarded();
    expect(isOnboarded).toBe(false);
  });
});

// ─── Suite F: Signup input validation (pure logic) ────────────────────────────

describe('Signup input validation logic', () => {
  function validateEmail(email: string): string | null {
    if (!email.trim()) return 'Email is required.';
    const idx = email.indexOf('@');
    if (idx < 1) return 'Enter a valid email address.';
    const domain = email.slice(idx + 1);
    if (!domain.includes('.') || domain.length < 3) return 'Enter a valid email address.';
    return null;
  }

  function validateName(name: string): string | null {
    if (name.trim().length < 2) return 'Name must be at least 2 characters.';
    return null;
  }

  it('valid email passes validation', () => {
    expect(validateEmail('jerome@example.com')).toBeNull();
  });

  it('empty email fails validation', () => {
    expect(validateEmail('')).not.toBeNull();
  });

  it('email without @ fails validation', () => {
    expect(validateEmail('notanemail')).not.toBeNull();
  });

  it('email without domain dot fails validation', () => {
    expect(validateEmail('user@nodot')).not.toBeNull();
  });

  it('email starting with @ fails validation', () => {
    expect(validateEmail('@domain.com')).not.toBeNull();
  });

  it('valid name passes validation', () => {
    expect(validateName('Jerome')).toBeNull();
  });

  it('single-char name fails validation', () => {
    expect(validateName('J')).not.toBeNull();
  });

  it('empty name fails validation', () => {
    expect(validateName('')).not.toBeNull();
  });

  it('whitespace-only name fails validation', () => {
    expect(validateName('   ')).not.toBeNull();
  });
});

// ─── Suite G: Pledge initials validation (pure logic) ─────────────────────────

describe('Pledge initials validation logic', () => {
  function isValidInitials(raw: string): boolean {
    const trimmed = raw.trim().toUpperCase();
    return trimmed.length >= 2 && trimmed.length <= 4;
  }

  it('"JK" is valid initials', () => {
    expect(isValidInitials('JK')).toBe(true);
  });

  it('"JDK" is valid initials', () => {
    expect(isValidInitials('JDK')).toBe(true);
  });

  it('"ABCD" is valid (max 4)', () => {
    expect(isValidInitials('ABCD')).toBe(true);
  });

  it('single letter is invalid (too short)', () => {
    expect(isValidInitials('J')).toBe(false);
  });

  it('empty string is invalid', () => {
    expect(isValidInitials('')).toBe(false);
  });

  it('5 letters is invalid (too long)', () => {
    expect(isValidInitials('ABCDE')).toBe(false);
  });

  it('whitespace-only is invalid', () => {
    expect(isValidInitials('   ')).toBe(false);
  });
});
