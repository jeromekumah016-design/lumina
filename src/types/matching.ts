import type { Archetype } from './questionnaire';

export type TripPace = 'relaxed' | 'balanced' | 'high-energy';

export interface SocialStyleVector {
  introversion: number; // 0 (outgoing) -> 1 (introvert)
  adventurousness: number; // 0 (calm) -> 1 (adventurous)
}

export interface PreferenceWeights {
  interestWeight: number;
  socialStyleWeight: number;
}

export interface IntroProfile {
  interests: string[];
  socialStyle: SocialStyleVector;
  tripPace: TripPace;
  /** Persisted profile category from the forced-choice questionnaire. */
  archetype?: Archetype;
  completedAt?: string;
}

export interface UserPreferenceModel {
  targetSocialStyle: SocialStyleVector;
  interestAffinity: Record<string, number>;
  weights: PreferenceWeights;
}

export interface UserMatchingProfile {
  introProfile: IntroProfile;
  preferenceModel: UserPreferenceModel;
  interactionCount: number;
  updatedAt: string;
}

export interface MatchCandidate {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  city: string;
  interests: string[];
  socialStyle: SocialStyleVector;
}

export interface CompatibilityBreakdown {
  total: number;
  interest: number;
  social: number;
  affinityBoost: number;
  /** Present only when the scoring user has a persisted archetype. */
  archetypeSynergy?: number;
}

export interface RankedCandidate extends MatchCandidate {
  compatibility: CompatibilityBreakdown;
}

export interface InteractionFeedback {
  candidateId: string;
  rating: number; // 1..5
  interests: string[];
  socialStyle: SocialStyleVector;
  createdAt: string;
}
