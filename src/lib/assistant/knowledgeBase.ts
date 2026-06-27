/**
 * Lumina assistant knowledge base.
 * All answers are accurate to the current app state (as of feature/lumina-chat-assistant).
 * Keep in sync with real app copy; replace with CMS/API fetch later if needed.
 */

export type Intent =
  | 'WHAT_IS_LUMINA'
  | 'HOW_GAME_WORKS'
  | 'VOTE_LIMIT'
  | 'MATCHING'
  | 'MEMBERSHIP'
  | 'TRIPS'
  | 'ONBOARDING'
  | 'CONDUCT_PLEDGE'
  | 'SAFETY'
  | 'ACCOUNT'
  | 'CITIES'
  | 'PROPERTIES'
  | 'GENDER_BALANCE'
  | 'FALLBACK';

export interface KBEntry {
  intent: Intent;
  answer: string;
  followUps: string[];
}

export const KNOWLEDGE_BASE: Record<Intent, KBEntry> = {
  WHAT_IS_LUMINA: {
    intent: 'WHAT_IS_LUMINA',
    answer:
      'Lumina is a curated small-group travel app for building real platonic friendships. Each trip is a balanced group of 10 people (5 men + 5 women) who vote together on weekend getaway properties and travel as a unit. No romance, no networking — just genuine connection.',
    followUps: ['How does the Game work?', 'How do I get matched?', 'What cities are available?'],
  },
  HOW_GAME_WORKS: {
    intent: 'HOW_GAME_WORKS',
    answer:
      'The Game is a group property-voting round. Your group of 10 sees 6 properties for a chosen city. Each person votes KEEP or ELIMINATE on the listings. You have 2 votes per round — use them wisely! The group\'s combined votes determine which properties survive each round, narrowing down to the trip destination.',
    followUps: ['What\'s the vote limit?', 'Which cities are available?', 'How do I get matched?'],
  },
  VOTE_LIMIT: {
    intent: 'VOTE_LIMIT',
    answer:
      'Each player gets exactly 2 votes per round — you can cast them as KEEP or ELIMINATE across any of the 6 properties. Once you\'ve used both votes, you\'re done for that round. Votes are final, so choose carefully!',
    followUps: ['How does the Game work?', 'What cities are available?'],
  },
  MATCHING: {
    intent: 'MATCHING',
    answer:
      'After completing onboarding and subscribing, you\'re placed in the matching queue. Lumina assembles balanced groups of 10 (5 men + 5 women). Once your group is formed, you\'ll see a match notification and can head to the Game together. Check the Matching screen under your profile for queue status.',
    followUps: ['How do I subscribe?', 'What is the gender balance?', 'How does the Game work?'],
  },
  MEMBERSHIP: {
    intent: 'MEMBERSHIP',
    answer:
      'Lumina membership unlocks the matching queue and the full trip experience. Complete onboarding first, then subscribe on the Subscribe screen. Membership gives you access to the Game, trip voting, and the Trip Room for your matched group.',
    followUps: ['How do I onboard?', 'How do I get matched?', 'What is the Trip Room?'],
  },
  TRIPS: {
    intent: 'TRIPS',
    answer:
      'Once your group is matched and a property is chosen through the Game, the Trip Room opens — it\'s a shared space where all 10 members can coordinate details, see the itinerary, and prep for the trip. Browse the Trips tab for your upcoming and past adventures.',
    followUps: ['How does matching work?', 'How does the Game work?'],
  },
  ONBOARDING: {
    intent: 'ONBOARDING',
    answer:
      'Onboarding walks you through who Lumina is for and what to expect. After signing up and accepting the User Agreement, you\'ll complete the Conduct Pledge before reaching the main app. From there, complete your profile and subscribe to enter the matching queue.',
    followUps: ['What is the Conduct Pledge?', 'How do I subscribe?', 'What is Lumina?'],
  },
  CONDUCT_PLEDGE: {
    intent: 'CONDUCT_PLEDGE',
    answer:
      'The Conduct Pledge is a personal commitment you make before joining. You pledge to join Lumina to build real friendships — not to impress, perform, or pursue. You commit to honesty, care, and doing the right thing even when it\'s inconvenient. Your initials confirm you represent this community.',
    followUps: ['What is Lumina?', 'How do I get matched?'],
  },
  SAFETY: {
    intent: 'SAFETY',
    answer:
      'Lumina is built on trust and intentional community. Every member agrees to the User Agreement and signs the Conduct Pledge before entering the app. Groups are carefully balanced and curated. The Trust score system helps surface reliable, respectful members over time.',
    followUps: ['What is the Conduct Pledge?', 'What is Lumina?'],
  },
  ACCOUNT: {
    intent: 'ACCOUNT',
    answer:
      'You created your Lumina account with a name and email during sign-up. Your profile shows your Account, Agreement, and Pledge status. Account details can be found on the Profile tab. Password-based auth and full account management are coming soon.',
    followUps: ['How do I onboard?', 'What is the Conduct Pledge?'],
  },
  CITIES: {
    intent: 'CITIES',
    answer:
      'Lumina currently offers trips to Chicago, New York, and Atlanta — plus a Coastal Demo set featuring spots like Laguna Beach, Lake Tahoe, Santa Barbara, Malibu, Hawaii, and Palm Springs. More cities are coming as the community grows. Lumina takes a cities-first expansion approach.',
    followUps: ['How does the Game work?', 'What properties are available?'],
  },
  PROPERTIES: {
    intent: 'PROPERTIES',
    answer:
      'Each city has 6 curated Airbnb/Vrbo-style properties for your group to vote on. Chicago listings include spots like a Cozy Wicker Park Loft and a Gold Coast Lakefront Studio. Prices range from ~$89 to $135 per person per night. Your group votes KEEP or ELIMINATE to pick the winner.',
    followUps: ['How does the Game work?', 'What cities are available?'],
  },
  GENDER_BALANCE: {
    intent: 'GENDER_BALANCE',
    answer:
      'Every Lumina group is exactly 5 men and 5 women — 10 people total. This equal balance is intentional: it creates a space focused on platonic friendship rather than dating dynamics. The matching algorithm ensures this balance before a group is confirmed.',
    followUps: ['How does matching work?', 'What is Lumina?'],
  },
  FALLBACK: {
    intent: 'FALLBACK',
    answer:
      'I\'m not sure about that one yet! Try asking me about: what Lumina is, how the Game works, voting rules, matching, membership, trips, cities, or the Conduct Pledge. I\'m here to help with anything Lumina-related.',
    followUps: [
      'What is Lumina?',
      'How does the Game work?',
      'How do I get matched?',
    ],
  },
};

export const SUGGESTED_QUESTIONS = [
  'What is Lumina?',
  'How does the Game work?',
  'How do I get matched?',
  'What cities are available?',
  'What is the Conduct Pledge?',
];
