/**
 * Tests for the Lumina assistant intent engine and public API.
 * Pure logic layer — no React Native components, no network calls.
 */

import { describe, it, expect } from '@jest/globals';
import { classifyIntent } from '../lib/assistant/intentEngine';
import { KNOWLEDGE_BASE, SUGGESTED_QUESTIONS } from '../lib/assistant/knowledgeBase';
import { getAssistantReply } from '../lib/assistant';

// ─── Intent classification ────────────────────────────────────────────────────

describe('classifyIntent — WHAT_IS_LUMINA', () => {
  const cases = [
    'What is Lumina?',
    'what is this app',
    'tell me about lumina',
    'what does lumina do',
    'what are you',
    'platonic friendship travel',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('WHAT_IS_LUMINA');
    });
  });
});

describe('classifyIntent — HOW_GAME_WORKS', () => {
  const cases = [
    'How does the Game work?',
    'explain voting',
    'how do I vote',
    'what is keep and eliminate',
    'how does property voting work',
    'game',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('HOW_GAME_WORKS');
    });
  });
});

describe('classifyIntent — VOTE_LIMIT', () => {
  const cases = [
    'how many votes do I get',
    'vote limit',
    '2 votes per round',
    'I used my votes',
    'voting limit',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('VOTE_LIMIT');
    });
  });
});

describe('classifyIntent — MATCHING', () => {
  const cases = [
    'how do I get matched',
    'matching queue',
    'when will I be matched',
    'how do I join a group',
    'find a group',
    'matched',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('MATCHING');
    });
  });
});

describe('classifyIntent — MEMBERSHIP', () => {
  const cases = [
    'how much does it cost',
    'subscribe',
    'membership pricing',
    'how do I join',
    'premium plan',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('MEMBERSHIP');
    });
  });
});

describe('classifyIntent — TRIPS', () => {
  const cases = [
    'what is the trip room',
    'upcoming trips',
    'weekend getaway',
    'itinerary',
    'travel details',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('TRIPS');
    });
  });
});

describe('classifyIntent — ONBOARDING', () => {
  const cases = [
    'how do I get started',
    'onboarding',
    'new user setup',
    'how do I begin',
    'sign up steps',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('ONBOARDING');
    });
  });
});

describe('classifyIntent — CONDUCT_PLEDGE', () => {
  const cases = [
    'what is the conduct pledge',
    'code of conduct',
    'community rules',
    'pledge initials',
    'user agreement',
    'values',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('CONDUCT_PLEDGE');
    });
  });
});

describe('classifyIntent — SAFETY', () => {
  const cases = [
    'is the app safe',
    'how is trust handled',
    'trust score',
    'is this secure',
    'community standards',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('SAFETY');
    });
  });
});

describe('classifyIntent — ACCOUNT', () => {
  const cases = [
    'my account',
    'edit my profile',
    'change my email',
    'how do I log in',
    'account details',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('ACCOUNT');
    });
  });
});

describe('classifyIntent — CITIES', () => {
  const cases = [
    'which cities are available',
    'Chicago destinations',
    'New York',
    'Atlanta',
    'available destinations',
    'Malibu',
    'Lake Tahoe',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('CITIES');
    });
  });
});

describe('classifyIntent — PROPERTIES', () => {
  const cases = [
    'show me properties',
    'Airbnb listings',
    'rental properties',
    'cost per person per night',
    'Wicker Park loft',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('PROPERTIES');
    });
  });
});

describe('classifyIntent — GENDER_BALANCE', () => {
  const cases = [
    'gender balance',
    '5 men and 5 women',
    'equal gender split',
    'male female ratio',
    'gender ratio',
  ];
  cases.forEach(q => {
    it(`classifies "${q}"`, () => {
      expect(classifyIntent(q)).toBe('GENDER_BALANCE');
    });
  });
});

describe('classifyIntent — FALLBACK', () => {
  const cases = [
    'asdfghjkl',
    '???',
    'what is the weather like',
    'tell me a joke',
    '',
    '   ',
  ];
  cases.forEach(q => {
    it(`falls back for "${q}"`, () => {
      expect(classifyIntent(q)).toBe('FALLBACK');
    });
  });
});

// ─── Knowledge base integrity ─────────────────────────────────────────────────

describe('KNOWLEDGE_BASE integrity', () => {
  const intents = Object.keys(KNOWLEDGE_BASE) as Array<keyof typeof KNOWLEDGE_BASE>;

  it('has an entry for every intent including FALLBACK', () => {
    const required = [
      'WHAT_IS_LUMINA', 'HOW_GAME_WORKS', 'VOTE_LIMIT', 'MATCHING',
      'MEMBERSHIP', 'TRIPS', 'ONBOARDING', 'CONDUCT_PLEDGE', 'SAFETY',
      'ACCOUNT', 'CITIES', 'PROPERTIES', 'GENDER_BALANCE', 'FALLBACK',
    ];
    for (const intent of required) {
      expect(KNOWLEDGE_BASE).toHaveProperty(intent);
    }
  });

  intents.forEach(intent => {
    it(`${intent} has a non-empty answer`, () => {
      expect(KNOWLEDGE_BASE[intent].answer.length).toBeGreaterThan(20);
    });

    it(`${intent} has at least 1 follow-up (FALLBACK: at least 2)`, () => {
      const minFollowUps = intent === 'FALLBACK' ? 2 : 1;
      expect(KNOWLEDGE_BASE[intent].followUps.length).toBeGreaterThanOrEqual(minFollowUps);
    });
  });

  it('SUGGESTED_QUESTIONS has at least 4 entries', () => {
    expect(SUGGESTED_QUESTIONS.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── getAssistantReply public API ─────────────────────────────────────────────

describe('getAssistantReply', () => {
  it('returns a reply with text, followUps, and intent', async () => {
    const reply = await getAssistantReply('What is Lumina?');
    expect(reply.text.length).toBeGreaterThan(10);
    expect(Array.isArray(reply.followUps)).toBe(true);
    expect(reply.intent).toBe('WHAT_IS_LUMINA');
  });

  it('returns FALLBACK intent for unknown query', async () => {
    const reply = await getAssistantReply('xyzzy plugh');
    expect(reply.intent).toBe('FALLBACK');
    expect(reply.text.length).toBeGreaterThan(10);
  });

  it('resolves correctly for voting question', async () => {
    const reply = await getAssistantReply('how many votes do I get per round?');
    expect(reply.intent).toBe('VOTE_LIMIT');
    expect(reply.text).toContain('2');
  });

  it('resolves correctly for matching question', async () => {
    const reply = await getAssistantReply('how do I get matched?');
    expect(reply.intent).toBe('MATCHING');
  });

  it('returns followUps that are non-empty strings', async () => {
    const reply = await getAssistantReply('What is the Game?');
    for (const q of reply.followUps) {
      expect(typeof q).toBe('string');
      expect(q.length).toBeGreaterThan(0);
    }
  });
});
