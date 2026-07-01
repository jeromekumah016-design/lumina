import { IntroProfile, TripPace } from '../types/matching';

export type IntroBotStepId = 'welcome' | 'interests' | 'introversion' | 'adventurousness' | 'tripPace' | 'done';

export interface IntroBotState {
  step: IntroBotStepId;
  profile: IntroProfile;
  transcript: Array<{ from: 'bot' | 'user'; text: string }>;
}

const STEP_ORDER: IntroBotStepId[] = [
  'welcome',
  'interests',
  'introversion',
  'adventurousness',
  'tripPace',
  'done',
];

function normalizeInterests(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function toScale(input: string): number | null {
  const parsed = Number(input);
  if (Number.isNaN(parsed)) return null;
  if (parsed < 0 || parsed > 10) return null;
  return parsed / 10;
}

function normalizeTripPace(input: string): TripPace | null {
  const value = input.trim().toLowerCase();
  if (value === 'relaxed') return 'relaxed';
  if (value === 'balanced') return 'balanced';
  if (value === 'high-energy' || value === 'high energy' || value === 'high') return 'high-energy';
  return null;
}

function nextStep(step: IntroBotStepId): IntroBotStepId {
  const index = STEP_ORDER.indexOf(step);
  return STEP_ORDER[Math.min(index + 1, STEP_ORDER.length - 1)];
}

export const introBotService = {
  createInitialState(existing?: Partial<IntroProfile>): IntroBotState {
    const profile: IntroProfile = {
      interests: existing?.interests || [],
      socialStyle: existing?.socialStyle || { introversion: 0.5, adventurousness: 0.5 },
      tripPace: existing?.tripPace || 'balanced',
      completedAt: existing?.completedAt,
    };
    return {
      step: 'welcome',
      profile,
      transcript: [{ from: 'bot', text: this.getPrompt('welcome') }],
    };
  },

  getPrompt(step: IntroBotStepId): string {
    switch (step) {
      case 'welcome':
        return 'Hi, I am Lumina Intro Bot. I will learn your interests and social style for better matching in Chicago. Reply "start" when ready.';
      case 'interests':
        return 'Great. Tell me your top interests (comma-separated), for example: food, art, hiking, live music.';
      case 'introversion':
        return 'On a scale from 0 to 10, how introverted are you? (0 = very outgoing, 10 = very introverted)';
      case 'adventurousness':
        return 'On a scale from 0 to 10, how adventurous are you? (0 = calm/structured, 10 = very adventurous)';
      case 'tripPace':
        return 'Pick your preferred trip pace: relaxed, balanced, or high-energy.';
      case 'done':
      default:
        return 'Thanks! Your intro profile is saved and will improve future pairing.';
    }
  },

  applyAnswer(state: IntroBotState, answer: string): { nextState: IntroBotState; error?: string } {
    const userText = answer.trim();
    const transcript: IntroBotState['transcript'] = [
      ...state.transcript,
      { from: 'user', text: userText },
    ];
    let profile = { ...state.profile };
    let step = state.step;

    if (step === 'welcome') {
      if (!userText) {
        return { nextState: { ...state, transcript }, error: 'Please reply "start" to continue.' };
      }
      step = nextStep(step);
    } else if (step === 'interests') {
      const interests = normalizeInterests(userText);
      if (interests.length < 2) {
        return { nextState: { ...state, transcript }, error: 'Please provide at least 2 interests.' };
      }
      profile = { ...profile, interests };
      step = nextStep(step);
    } else if (step === 'introversion') {
      const introversion = toScale(userText);
      if (introversion === null) {
        return { nextState: { ...state, transcript }, error: 'Please enter a number from 0 to 10.' };
      }
      profile = { ...profile, socialStyle: { ...profile.socialStyle, introversion } };
      step = nextStep(step);
    } else if (step === 'adventurousness') {
      const adventurousness = toScale(userText);
      if (adventurousness === null) {
        return { nextState: { ...state, transcript }, error: 'Please enter a number from 0 to 10.' };
      }
      profile = { ...profile, socialStyle: { ...profile.socialStyle, adventurousness } };
      step = nextStep(step);
    } else if (step === 'tripPace') {
      const tripPace = normalizeTripPace(userText);
      if (!tripPace) {
        return { nextState: { ...state, transcript }, error: 'Please answer with relaxed, balanced, or high-energy.' };
      }
      profile = { ...profile, tripPace, completedAt: new Date().toISOString() };
      step = nextStep(step);
    }

    const botPrompt = this.getPrompt(step);
    return {
      nextState: {
        step,
        profile,
        transcript: [...transcript, { from: 'bot', text: botPrompt }],
      },
    };
  },
};
