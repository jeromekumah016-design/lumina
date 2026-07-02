import { describe, it, expect } from '@jest/globals';
import { introBotService } from '../introBotService';

describe('introBotService', () => {
  it('walks through signup steps and completes profile', () => {
    let state = introBotService.createInitialState();
    state = introBotService.applyAnswer(state, 'start').nextState;
    state = introBotService.applyAnswer(state, 'food, books, music').nextState;
    state = introBotService.applyAnswer(state, '7').nextState;
    state = introBotService.applyAnswer(state, '4').nextState;
    state = introBotService.applyAnswer(state, 'balanced').nextState;

    expect(state.step).toBe('done');
    expect(state.profile.interests).toEqual(['food', 'books', 'music']);
    expect(state.profile.socialStyle.introversion).toBeCloseTo(0.7);
    expect(state.profile.socialStyle.adventurousness).toBeCloseTo(0.4);
    expect(state.profile.tripPace).toBe('balanced');
  });

  it('returns validation error for invalid numeric range', () => {
    let state = introBotService.createInitialState();
    state = introBotService.applyAnswer(state, 'start').nextState;
    state = introBotService.applyAnswer(state, 'food, books').nextState;
    const result = introBotService.applyAnswer(state, '11');
    expect(result.error).toContain('0 to 10');
    expect(result.nextState.step).toBe('introversion');
  });
});
