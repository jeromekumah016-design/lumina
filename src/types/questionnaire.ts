import { SocialStyleVector, TripPace } from './matching';

/**
 * Lumina profile categories ("archetypes").
 *
 * Derived deterministically from the forced-choice questionnaire via the
 * 2-axis social-style vector (introversion x adventurousness):
 *
 *                 adventurous (>= 0.5)      calm (< 0.5)
 *   outgoing      TRAILBLAZER               CONNECTOR
 *   introverted   EXPLORER                  CURATOR
 */
export type Archetype = 'TRAILBLAZER' | 'CONNECTOR' | 'EXPLORER' | 'CURATOR';

export const ARCHETYPES: readonly Archetype[] = [
  'TRAILBLAZER',
  'CONNECTOR',
  'EXPLORER',
  'CURATOR',
] as const;

export interface ArchetypeInfo {
  archetype: Archetype;
  title: string;
  tagline: string;
  description: string;
}

/** One of exactly two options in a forced-choice question. */
export interface ForcedChoiceOption {
  id: 'A' | 'B';
  label: string;
  /**
   * Additive effects on the social-style axes, each in [-1, 1].
   * Positive introversion pushes toward introverted; positive
   * adventurousness pushes toward adventurous.
   */
  effects: {
    introversion?: number;
    adventurousness?: number;
  };
  /** Optional vote for a preferred trip pace. Majority wins. */
  paceVote?: TripPace;
}

export interface ForcedChoiceQuestion {
  id: string;
  prompt: string;
  options: readonly [ForcedChoiceOption, ForcedChoiceOption];
}

export interface QuestionnaireAnswer {
  questionId: string;
  optionId: 'A' | 'B';
}

/** Pure scoring output — no persistence concerns. */
export interface ArchetypeResult {
  archetype: Archetype;
  socialStyle: SocialStyleVector;
  tripPace: TripPace;
}

/** What gets persisted after a validated submission. */
export interface PersistedQuestionnaire {
  answers: QuestionnaireAnswer[];
  result: ArchetypeResult;
  completedAt: string; // ISO
  version: number; // question-bank version the answers were scored against
}

export type QuestionnaireValidationError =
  | { kind: 'missing_answers'; missingQuestionIds: string[] }
  | { kind: 'unknown_question'; questionId: string }
  | { kind: 'duplicate_answer'; questionId: string };

/**
 * API-ready contract. The mock implementation persists to AsyncStorage;
 * a live backend adapter must satisfy this exact interface.
 */
export interface QuestionnaireApi {
  getQuestions(): readonly ForcedChoiceQuestion[];
  validateAnswers(answers: QuestionnaireAnswer[]): QuestionnaireValidationError | null;
  scoreAnswers(answers: QuestionnaireAnswer[]): ArchetypeResult;
  submitAnswers(answers: QuestionnaireAnswer[]): Promise<PersistedQuestionnaire>;
  getSaved(): Promise<PersistedQuestionnaire | null>;
  reset(): Promise<void>;
}
