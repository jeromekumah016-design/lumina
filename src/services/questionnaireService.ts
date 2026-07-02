import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Archetype,
  ArchetypeInfo,
  ArchetypeResult,
  ForcedChoiceQuestion,
  PersistedQuestionnaire,
  QuestionnaireAnswer,
  QuestionnaireApi,
  QuestionnaireValidationError,
} from '../types/questionnaire';
import { SocialStyleVector, TripPace } from '../types/matching';
import { compatibilityService } from './compatibilityService';
import { userService } from './userService';

const STORAGE_KEY = 'lumina:user:questionnaire';

/** Bump when the question bank changes in a way that invalidates old answers. */
export const QUESTION_BANK_VERSION = 1;

export const ARCHETYPE_INFO: Record<Archetype, ArchetypeInfo> = {
  TRAILBLAZER: {
    archetype: 'TRAILBLAZER',
    title: 'The Trailblazer',
    tagline: 'Outgoing · Adventurous',
    description:
      'You bring the energy. First to suggest the plan, first out the door. Groups love you for turning a weekend into a story.',
  },
  CONNECTOR: {
    archetype: 'CONNECTOR',
    title: 'The Connector',
    tagline: 'Outgoing · Easygoing',
    description:
      'You make strangers feel like friends. You keep the group talking, laughing, and comfortable — the social glue of any trip.',
  },
  EXPLORER: {
    archetype: 'EXPLORER',
    title: 'The Explorer',
    tagline: 'Reflective · Adventurous',
    description:
      'You seek the hidden gem, not the crowd. You would rather find the unmarked taqueria than wait in line at the landmark.',
  },
  CURATOR: {
    archetype: 'CURATOR',
    title: 'The Curator',
    tagline: 'Reflective · Easygoing',
    description:
      'You savor the details — the good coffee, the quiet museum hall, the long conversation. You make trips feel considered.',
  },
};

/**
 * Forced-choice question bank (v1).
 * Effects are additive deltas on the 0..1 social-style axes starting from 0.5.
 * Six style questions at ±0.13 give full range coverage (0.5 ± 0.78 clamped),
 * and two pace questions vote on trip pace.
 */
const QUESTIONS: readonly ForcedChoiceQuestion[] = [
  {
    id: 'q1-friday',
    prompt: "It's Friday night in a new city. You...",
    options: [
      { id: 'A', label: 'Find the busiest rooftop bar and talk to everyone', effects: { introversion: -0.13 } },
      { id: 'B', label: 'Pick a cozy spot and go deep with one or two people', effects: { introversion: 0.13 } },
    ],
  },
  {
    id: 'q2-recharge',
    prompt: 'After a full day with the group, you recharge by...',
    options: [
      { id: 'A', label: 'Keeping the night going — energy feeds energy', effects: { introversion: -0.13 } },
      { id: 'B', label: 'Taking an hour of quiet before rejoining', effects: { introversion: 0.13 } },
    ],
  },
  {
    id: 'q3-meals',
    prompt: 'Group dinner: the restaurant lost your reservation. You...',
    options: [
      { id: 'A', label: 'Rally everyone to a street-food crawl instead', effects: { adventurousness: 0.13 } },
      { id: 'B', label: 'Find the nearest solid backup with open tables', effects: { adventurousness: -0.13 } },
    ],
  },
  {
    id: 'q4-plans',
    prompt: 'Your ideal trip plan looks like...',
    options: [
      { id: 'A', label: 'A loose list of ideas — decide in the moment', effects: { adventurousness: 0.13 } },
      { id: 'B', label: 'A clear itinerary with times and backups', effects: { adventurousness: -0.13 } },
    ],
  },
  {
    id: 'q5-newpeople',
    prompt: 'Meeting the 9 strangers in your Lumina group, you...',
    options: [
      { id: 'A', label: 'Introduce yourself to all of them in the first hour', effects: { introversion: -0.13 } },
      { id: 'B', label: 'Warm up gradually — you open up as the weekend goes', effects: { introversion: 0.13 } },
    ],
  },
  {
    id: 'q6-activity',
    prompt: 'Free afternoon in Chicago. Pick one:',
    options: [
      { id: 'A', label: 'Kayak the river, then whatever happens next', effects: { adventurousness: 0.13 } },
      { id: 'B', label: 'Art Institute, then a great bakery you researched', effects: { adventurousness: -0.13 } },
    ],
  },
  {
    id: 'q7-pace',
    prompt: 'The best trip pace feels like...',
    options: [
      { id: 'A', label: 'Packed — see and do everything', effects: {}, paceVote: 'high-energy' },
      { id: 'B', label: 'Unhurried — fewer things, done well', effects: {}, paceVote: 'relaxed' },
    ],
  },
  {
    id: 'q8-morning',
    prompt: 'Trip mornings should start...',
    options: [
      { id: 'A', label: 'Early — first ones at breakfast, full day ahead', effects: {}, paceVote: 'high-energy' },
      { id: 'B', label: 'Slow — coffee first, plans after', effects: {}, paceVote: 'relaxed' },
    ],
  },
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function resolvePace(votes: TripPace[]): TripPace {
  const high = votes.filter((v) => v === 'high-energy').length;
  const relaxed = votes.filter((v) => v === 'relaxed').length;
  if (high > relaxed) return 'high-energy';
  if (relaxed > high) return 'relaxed';
  return 'balanced';
}

export class QuestionnaireSubmissionError extends Error {
  readonly validation: QuestionnaireValidationError;
  constructor(validation: QuestionnaireValidationError, message: string) {
    super(message);
    this.name = 'QuestionnaireSubmissionError';
    this.validation = validation;
  }
}

let cachedSaved: PersistedQuestionnaire | null | undefined;

export const questionnaireService: QuestionnaireApi = {
  getQuestions(): readonly ForcedChoiceQuestion[] {
    return QUESTIONS;
  },

  validateAnswers(answers: QuestionnaireAnswer[]): QuestionnaireValidationError | null {
    const knownIds = new Set(QUESTIONS.map((q) => q.id));
    const seen = new Set<string>();
    for (const answer of answers) {
      if (!knownIds.has(answer.questionId)) {
        return { kind: 'unknown_question', questionId: answer.questionId };
      }
      if (seen.has(answer.questionId)) {
        return { kind: 'duplicate_answer', questionId: answer.questionId };
      }
      seen.add(answer.questionId);
    }
    const missing = QUESTIONS.filter((q) => !seen.has(q.id)).map((q) => q.id);
    if (missing.length > 0) {
      return { kind: 'missing_answers', missingQuestionIds: missing };
    }
    return null;
  },

  /** Pure + deterministic. Assumes answers already validated. */
  scoreAnswers(answers: QuestionnaireAnswer[]): ArchetypeResult {
    let introversion = 0.5;
    let adventurousness = 0.5;
    const paceVotes: TripPace[] = [];
    for (const answer of answers) {
      const question = QUESTIONS.find((q) => q.id === answer.questionId);
      if (!question) continue;
      const option = question.options.find((o) => o.id === answer.optionId);
      if (!option) continue;
      introversion += option.effects.introversion || 0;
      adventurousness += option.effects.adventurousness || 0;
      if (option.paceVote) paceVotes.push(option.paceVote);
    }
    const socialStyle: SocialStyleVector = {
      introversion: Math.round(clamp01(introversion) * 100) / 100,
      adventurousness: Math.round(clamp01(adventurousness) * 100) / 100,
    };
    return {
      archetype: compatibilityService.deriveArchetype(socialStyle),
      socialStyle,
      tripPace: resolvePace(paceVotes),
    };
  },

  async submitAnswers(answers: QuestionnaireAnswer[]): Promise<PersistedQuestionnaire> {
    const validation = this.validateAnswers(answers);
    if (validation) {
      const message =
        validation.kind === 'missing_answers'
          ? `Please answer every question (${validation.missingQuestionIds.length} remaining).`
          : validation.kind === 'unknown_question'
            ? `Unknown question: ${validation.questionId}.`
            : `Question answered twice: ${validation.questionId}.`;
      throw new QuestionnaireSubmissionError(validation, message);
    }
    const result = this.scoreAnswers(answers);
    const record: PersistedQuestionnaire = {
      answers: [...answers],
      result,
      completedAt: new Date().toISOString(),
      version: QUESTION_BANK_VERSION,
    };
    // Persist the raw questionnaire record, then sync the matching profile.
    // AsyncStorage failures must surface — a silent miss here would strand the
    // user with an unsaved profile category while the UI claims success.
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    cachedSaved = record;
    await userService.saveIntroProfile({
      socialStyle: result.socialStyle,
      tripPace: result.tripPace,
      archetype: result.archetype,
    });
    return record;
  },

  async getSaved(): Promise<PersistedQuestionnaire | null> {
    if (cachedSaved !== undefined) return cachedSaved;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      cachedSaved = raw ? (JSON.parse(raw) as PersistedQuestionnaire) : null;
    } catch {
      // Unreadable/corrupt record — treat as absent rather than crash the UI,
      // but do NOT cache so a transient read failure can recover on retry.
      return null;
    }
    return cachedSaved;
  },

  async reset(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    cachedSaved = null;
  },
};
