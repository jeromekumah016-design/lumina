/**
 * Rule-based intent classifier for the Lumina assistant.
 * Scores each intent by keyword hits; highest score wins.
 * Falls back to FALLBACK when no intent clears the threshold.
 *
 * LLM-swap seam: this file is the only place intent resolution happens.
 * To add an LLM backend, replace or augment `classifyIntent` — the rest
 * of the assistant (UI, knowledge base lookups) stays unchanged.
 */

import type { Intent } from './knowledgeBase';

// ─── Keyword → Intent map ─────────────────────────────────────────────────────

const INTENT_PATTERNS: Array<{ intent: Intent; keywords: string[] }> = [
  {
    intent: 'WHAT_IS_LUMINA',
    keywords: [
      'what is lumina', 'what is this', 'about lumina', 'what does lumina do',
      'what\'s lumina', 'what are you', 'tell me about', 'how does lumina work',
      'lumina app', 'purpose', 'platonic', 'friendship', 'concept',
    ],
  },
  {
    intent: 'HOW_GAME_WORKS',
    keywords: [
      'game', 'voting', 'vote', 'keep', 'eliminate', 'how do i vote',
      'property voting', 'how does voting', 'game work', 'play the game',
      'cast a vote', 'round', 'property round',
    ],
  },
  {
    intent: 'VOTE_LIMIT',
    keywords: [
      'vote limit', 'how many votes', '2 votes', 'two votes', 'votes per round',
      'out of votes', 'used my votes', 'votes left', 'max votes', 'voting limit',
    ],
  },
  {
    intent: 'MATCHING',
    keywords: [
      'matching', 'get matched', 'match', 'queue', 'group', 'how do i join a group',
      'when will i be matched', 'matching queue', 'waiting', 'matched',
      'trip group', 'find a group',
    ],
  },
  {
    intent: 'MEMBERSHIP',
    keywords: [
      'membership', 'subscribe', 'subscription', 'pay', 'price', 'cost', 'fee',
      'join', 'premium', 'plan', 'member', 'how much', 'pricing',
    ],
  },
  {
    intent: 'TRIPS',
    keywords: [
      'trip', 'trips', 'trip room', 'itinerary', 'travel', 'weekend', 'getaway',
      'upcoming trip', 'booked', 'trip details', 'accommodation',
    ],
  },
  {
    intent: 'ONBOARDING',
    keywords: [
      'onboarding', 'onboard', 'get started', 'setup', 'set up', 'sign up',
      'register', 'new user', 'first steps', 'starting', 'how do i begin',
    ],
  },
  {
    intent: 'CONDUCT_PLEDGE',
    keywords: [
      'pledge', 'conduct', 'conduct pledge', 'rules', 'community rules',
      'code of conduct', 'agreement', 'user agreement', 'terms', 'initials',
      'commitment', 'values', 'behavior',
    ],
  },
  {
    intent: 'SAFETY',
    keywords: [
      'safe', 'safety', 'trust', 'secure', 'verified', 'background', 'vetting',
      'trustworthy', 'reputation', 'trust score', 'reliable', 'community standards',
    ],
  },
  {
    intent: 'ACCOUNT',
    keywords: [
      'account', 'profile', 'email', 'name', 'my info', 'account details',
      'password', 'login', 'log in', 'sign in', 'delete account', 'username',
    ],
  },
  {
    intent: 'CITIES',
    keywords: [
      'cities', 'city', 'chicago', 'new york', 'atlanta', 'location', 'where',
      'destination', 'destinations', 'coastal', 'laguna', 'malibu', 'tahoe',
      'santa barbara', 'hawaii', 'palm springs', 'which cities', 'available cities',
    ],
  },
  {
    intent: 'PROPERTIES',
    keywords: [
      'properties', 'property', 'house', 'airbnb', 'vrbo', 'listing', 'home',
      'rent', 'rental', 'stay', 'accommodation', 'venue', 'wicker park',
      'gold coast', 'per person', 'cost per person',
    ],
  },
  {
    intent: 'GENDER_BALANCE',
    keywords: [
      'gender', 'balance', 'men', 'women', '5 men', '5 women', 'gender balance',
      'male', 'female', 'equal', 'ratio', 'split', 'mixed',
    ],
  },
];

const SCORE_THRESHOLD = 1;

// ─── Classifier ───────────────────────────────────────────────────────────────

export function classifyIntent(message: string): Intent {
  const normalized = message.toLowerCase().trim();
  const scores: Partial<Record<Intent, number>> = {};

  for (const { intent, keywords } of INTENT_PATTERNS) {
    let score = 0;
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        // Longer keyword matches are worth more (more specific)
        score += kw.split(' ').length;
      }
    }
    if (score > 0) scores[intent] = score;
  }

  if (Object.keys(scores).length === 0) return 'FALLBACK';

  const best = (Object.entries(scores) as [Intent, number][]).reduce(
    (top, cur) => (cur[1] > top[1] ? cur : top),
    ['FALLBACK' as Intent, 0] as [Intent, number],
  );

  return best[1] >= SCORE_THRESHOLD ? best[0] : 'FALLBACK';
}
