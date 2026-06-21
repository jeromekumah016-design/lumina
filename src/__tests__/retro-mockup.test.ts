/**
 * retro-mockup.test.ts
 *
 * Tests for the new additions introduced by the feature/retro-match-mockup branch:
 *   1. Coastal Demo dataset in propertyService
 *   2. formatMockupCountdown utility
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { formatMockupCountdown } from '../utils/countdown';

function freshService() {
  const mod = require('../services/propertyService');
  return mod.propertyService as typeof import('../services/propertyService').propertyService;
}

type Svc = ReturnType<typeof freshService>;

// ─── Suite 12: Coastal Demo dataset ──────────────────────────────────────────
describe('Coastal Demo dataset', () => {
  let svc: Svc;

  beforeEach(() => {
    jest.resetModules();
    svc = freshService();
  });

  it('setCurrentCity("Coastal Demo") resolves without throwing', async () => {
    await expect(svc.setCurrentCity('Coastal Demo')).resolves.toBeUndefined();
  });

  it('getProperties() returns exactly 6 Coastal Demo properties', async () => {
    await svc.setCurrentCity('Coastal Demo');
    const props = await svc.getProperties();
    expect(props).toHaveLength(6);
  });

  it('all Coastal Demo property IDs start with "coast-"', async () => {
    await svc.setCurrentCity('Coastal Demo');
    const props = await svc.getProperties();
    expect(props.every((p) => p.id.startsWith('coast-'))).toBe(true);
  });

  it('Azure Cove Villa (coast-1) has pricePerPerson = 127', async () => {
    await svc.setCurrentCity('Coastal Demo');
    const props = await svc.getProperties();
    const villa = props.find((p) => p.id === 'coast-1');
    expect(villa).toBeDefined();
    expect(villa!.pricePerPerson).toBe(127);
    expect(villa!.title).toBe('Azure Cove Villa');
  });

  it('Pineview Retreat (coast-2) has pricePerPerson = 98', async () => {
    await svc.setCurrentCity('Coastal Demo');
    const props = await svc.getProperties();
    const p = props.find((x) => x.id === 'coast-2')!;
    expect(p.pricePerPerson).toBe(98);
    expect(p.title).toBe('Pineview Retreat');
  });

  it('Casa Del Sol (coast-3) has pricePerPerson = 112', async () => {
    await svc.setCurrentCity('Coastal Demo');
    const props = await svc.getProperties();
    const p = props.find((x) => x.id === 'coast-3')!;
    expect(p.pricePerPerson).toBe(112);
    expect(p.title).toBe('Casa Del Sol');
  });

  it('Oceanfront Haven (coast-4) has pricePerPerson = 135', async () => {
    await svc.setCurrentCity('Coastal Demo');
    const props = await svc.getProperties();
    const p = props.find((x) => x.id === 'coast-4')!;
    expect(p.pricePerPerson).toBe(135);
    expect(p.title).toBe('Oceanfront Haven');
  });

  it('Tropical Hideaway (coast-5) has pricePerPerson = 89', async () => {
    await svc.setCurrentCity('Coastal Demo');
    const props = await svc.getProperties();
    const p = props.find((x) => x.id === 'coast-5')!;
    expect(p.pricePerPerson).toBe(89);
    expect(p.title).toBe('Tropical Hideaway');
  });

  it('Desert Oasis (coast-6) has pricePerPerson = 104', async () => {
    await svc.setCurrentCity('Coastal Demo');
    const props = await svc.getProperties();
    const p = props.find((x) => x.id === 'coast-6')!;
    expect(p.pricePerPerson).toBe(104);
    expect(p.title).toBe('Desert Oasis');
  });

  it('every Coastal Demo property has required fields', async () => {
    await svc.setCurrentCity('Coastal Demo');
    const props = await svc.getProperties();
    for (const p of props) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.title).toBe('string');
      expect(p.title.length).toBeGreaterThan(3);
      expect(typeof p.pricePerPerson).toBe('number');
      expect(p.pricePerPerson).toBeGreaterThan(0);
      expect(typeof p.keepVotes).toBe('number');
      expect(typeof p.eliminateVotes).toBe('number');
      expect(typeof p.location.city).toBe('string');
      expect(p.myVote === null || p.myVote === 'keep' || p.myVote === 'eliminate').toBe(true);
    }
  });

  it('switching to Coastal Demo and back to Chicago restores Chicago properties', async () => {
    await svc.setCurrentCity('Coastal Demo');
    const demo = await svc.getProperties();
    expect(demo.every((p) => p.id.startsWith('coast-'))).toBe(true);

    await svc.setCurrentCity('Chicago');
    const chicago = await svc.getProperties();
    expect(chicago.every((p) => p.id.startsWith('chi-'))).toBe(true);
  });

  it('vote limit (2-vote cap) works correctly on Coastal Demo properties', async () => {
    await svc.setCurrentCity('Coastal Demo');

    // All coast- props start with myVote null — can cast 2 votes
    await svc.castVote('coast-1', 'keep');
    await svc.castVote('coast-2', 'eliminate');
    const count = await svc.getUserVoteCount();
    expect(count).toBe(2);

    // 3rd vote must be blocked
    const result = await svc.castVote('coast-3', 'keep');
    expect(result.myVote).toBeNull();
  });

  it('addComment works for a valid Coastal Demo property', async () => {
    await svc.setCurrentCity('Coastal Demo');
    const comment = await svc.addComment('coast-1', 'Stunning ocean view!');
    expect(comment.author).toBe('You');
    expect(comment.text).toBe('Stunning ocean view!');
  });

  it('addComment throws for an unknown property in Coastal Demo context', async () => {
    await svc.setCurrentCity('Coastal Demo');
    await expect(svc.addComment('chi-1', 'test')).rejects.toThrow('Property not found');
  });

  it('getAvailableCities includes "Coastal Demo"', async () => {
    const cities = await svc.getAvailableCities();
    expect(cities).toContain('Coastal Demo');
  });

  it('Casa Del Sol is the top pick by keepVotes in Coastal Demo', async () => {
    await svc.setCurrentCity('Coastal Demo');
    const props = await svc.getProperties();
    const top = [...props].sort((a, b) => b.keepVotes - a.keepVotes)[0];
    expect(top.id).toBe('coast-3'); // 22 keep votes
    expect(top.title).toBe('Casa Del Sol');
  });
});

// ─── Suite 13: formatMockupCountdown utility ──────────────────────────────────
describe('formatMockupCountdown', () => {
  it('formats "18:42:17" as "18H 42M 17S"', () => {
    expect(formatMockupCountdown('18:42:17')).toBe('18H 42M 17S');
  });

  it('formats "00:00:00" as "0H 0M 0S"', () => {
    expect(formatMockupCountdown('00:00:00')).toBe('0H 0M 0S');
  });

  it('formats "23:59:59" as "23H 59M 59S"', () => {
    expect(formatMockupCountdown('23:59:59')).toBe('23H 59M 59S');
  });

  it('strips leading zeros from numbers', () => {
    expect(formatMockupCountdown('05:08:03')).toBe('5H 8M 3S');
  });

  it('returns original string if format is not HH:MM:SS', () => {
    expect(formatMockupCountdown('invalid')).toBe('invalid');
  });

  it('returns original string for empty input', () => {
    expect(formatMockupCountdown('')).toBe('');
  });

  it('handles single-digit hours correctly', () => {
    expect(formatMockupCountdown('01:30:45')).toBe('1H 30M 45S');
  });

  it('result always ends with "S"', () => {
    const result = formatMockupCountdown('10:20:30');
    expect(result.endsWith('S')).toBe(true);
  });

  it('result always contains "H" and "M" separators', () => {
    const result = formatMockupCountdown('10:20:30');
    expect(result).toContain('H');
    expect(result).toContain('M');
  });
});
