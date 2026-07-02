import {
  InteractionFeedback,
  MatchCandidate,
  RankedCandidate,
  SocialStyleVector,
  UserPreferenceModel,
} from '../types/matching';
import { Archetype } from '../types/questionnaire';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function normalizeInterest(interest: string): string {
  return interest.trim().toLowerCase();
}

function jaccardOverlap(a: string[], b: string[]): number {
  const setA = new Set(a.map(normalizeInterest).filter(Boolean));
  const setB = new Set(b.map(normalizeInterest).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : 0;
}

function socialSimilarity(a: SocialStyleVector, b: SocialStyleVector): number {
  const introSimilarity = 1 - Math.abs(a.introversion - b.introversion);
  const adventurousSimilarity = 1 - Math.abs(a.adventurousness - b.adventurousness);
  return (introSimilarity + adventurousSimilarity) / 2;
}

function affinityScore(interestAffinity: Record<string, number>, interests: string[]): number {
  const normalized = interests.map(normalizeInterest).filter(Boolean);
  if (normalized.length === 0) return 0;
  const total = normalized.reduce((sum, item) => sum + (interestAffinity[item] || 0), 0);
  return clamp((total / normalized.length + 1) / 2, 0, 1);
}

/**
 * Archetype synergy matrix. Same quadrant pairs well; quadrants sharing one
 * social-style axis pair moderately; diagonal opposites pair least (but never
 * zero — Lumina groups intentionally mix personalities).
 */
const ARCHETYPE_AXES: Record<Archetype, { introverted: boolean; adventurous: boolean }> = {
  TRAILBLAZER: { introverted: false, adventurous: true },
  CONNECTOR: { introverted: false, adventurous: false },
  EXPLORER: { introverted: true, adventurous: true },
  CURATOR: { introverted: true, adventurous: false },
};

export const compatibilityService = {
  /** Deterministic quadrant mapping from a social-style vector. */
  deriveArchetype(style: SocialStyleVector): Archetype {
    const introverted = style.introversion >= 0.5;
    const adventurous = style.adventurousness >= 0.5;
    if (introverted) return adventurous ? 'EXPLORER' : 'CURATOR';
    return adventurous ? 'TRAILBLAZER' : 'CONNECTOR';
  },

  /** Synergy in [0, 1]: 1 same quadrant, 0.6 one shared axis, 0.3 opposite. */
  archetypeSynergy(a: Archetype, b: Archetype): number {
    const axesA = ARCHETYPE_AXES[a];
    const axesB = ARCHETYPE_AXES[b];
    const shared =
      (axesA.introverted === axesB.introverted ? 1 : 0) +
      (axesA.adventurous === axesB.adventurous ? 1 : 0);
    if (shared === 2) return 1;
    if (shared === 1) return 0.6;
    return 0.3;
  },

  scoreCandidate(
    myInterests: string[],
    preferenceModel: UserPreferenceModel,
    candidate: MatchCandidate,
    myArchetype?: Archetype
  ): RankedCandidate['compatibility'] {
    const interest = jaccardOverlap(myInterests, candidate.interests);
    const social = socialSimilarity(preferenceModel.targetSocialStyle, candidate.socialStyle);
    const affinityBoost = affinityScore(preferenceModel.interestAffinity, candidate.interests);
    const totalWeight = preferenceModel.weights.interestWeight + preferenceModel.weights.socialStyleWeight;
    const weightedBase =
      (interest * preferenceModel.weights.interestWeight +
        social * preferenceModel.weights.socialStyleWeight) /
      (totalWeight || 1);
    if (myArchetype === undefined) {
      // Legacy path — identical scoring to pre-archetype behavior.
      const total = clamp(weightedBase * 0.9 + affinityBoost * 0.1, 0, 1);
      return {
        total: round(total),
        interest: round(interest),
        social: round(social),
        affinityBoost: round(affinityBoost),
      };
    }
    const candidateArchetype = this.deriveArchetype(candidate.socialStyle);
    const synergy = this.archetypeSynergy(myArchetype, candidateArchetype);
    const total = clamp(weightedBase * 0.85 + affinityBoost * 0.1 + synergy * 0.05, 0, 1);
    return {
      total: round(total),
      interest: round(interest),
      social: round(social),
      affinityBoost: round(affinityBoost),
      archetypeSynergy: round(synergy),
    };
  },

  rankCandidates(
    myInterests: string[],
    preferenceModel: UserPreferenceModel,
    candidates: MatchCandidate[],
    myArchetype?: Archetype
  ): RankedCandidate[] {
    return [...candidates]
      .map((candidate) => ({
        ...candidate,
        compatibility: this.scoreCandidate(myInterests, preferenceModel, candidate, myArchetype),
      }))
      .sort((a, b) => b.compatibility.total - a.compatibility.total);
  },

  updatePreferenceModel(model: UserPreferenceModel, feedback: InteractionFeedback): UserPreferenceModel {
    const rating = clamp(feedback.rating, 1, 5);
    const learningRate = (rating - 3) / 10;
    const nextInterestAffinity = { ...model.interestAffinity };
    for (const interest of feedback.interests.map(normalizeInterest).filter(Boolean)) {
      const current = nextInterestAffinity[interest] || 0;
      nextInterestAffinity[interest] = clamp(current + learningRate, -1, 1);
    }
    const targetSocialStyle = {
      introversion: clamp(
        model.targetSocialStyle.introversion +
          learningRate * (feedback.socialStyle.introversion - model.targetSocialStyle.introversion),
        0,
        1
      ),
      adventurousness: clamp(
        model.targetSocialStyle.adventurousness +
          learningRate * (feedback.socialStyle.adventurousness - model.targetSocialStyle.adventurousness),
        0,
        1
      ),
    };

    return {
      targetSocialStyle,
      interestAffinity: nextInterestAffinity,
      weights: {
        interestWeight: clamp(model.weights.interestWeight + learningRate * 0.05, 0.35, 0.75),
        socialStyleWeight: clamp(model.weights.socialStyleWeight - learningRate * 0.05, 0.25, 0.65),
      },
    };
  },
};
