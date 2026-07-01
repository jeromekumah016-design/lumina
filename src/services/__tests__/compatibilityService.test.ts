import { compatibilityService } from '../compatibilityService';
import { UserPreferenceModel } from '../../types/matching';

const basePreference: UserPreferenceModel = {
  targetSocialStyle: { introversion: 0.6, adventurousness: 0.4 },
  interestAffinity: { food: 0.5, books: 0.2 },
  weights: { interestWeight: 0.55, socialStyleWeight: 0.45 },
};

describe('compatibilityService', () => {
  it('ranks candidates by total compatibility descending', () => {
    const ranked = compatibilityService.rankCandidates(
      ['food', 'books'],
      basePreference,
      [
        {
          id: 'c-low',
          name: 'Low',
          gender: 'MALE',
          city: 'Chicago',
          interests: ['gaming'],
          socialStyle: { introversion: 0.1, adventurousness: 0.9 },
        },
        {
          id: 'c-high',
          name: 'High',
          gender: 'FEMALE',
          city: 'Chicago',
          interests: ['food', 'books'],
          socialStyle: { introversion: 0.62, adventurousness: 0.38 },
        },
      ]
    );
    expect(ranked[0].id).toBe('c-high');
    expect(ranked[0].compatibility.total).toBeGreaterThan(ranked[1].compatibility.total);
  });

  it('updates preference model toward high-rated interaction profile', () => {
    const next = compatibilityService.updatePreferenceModel(basePreference, {
      candidateId: 'c1',
      rating: 5,
      interests: ['hiking'],
      socialStyle: { introversion: 0.9, adventurousness: 0.1 },
      createdAt: new Date().toISOString(),
    });
    expect(next.targetSocialStyle.introversion).toBeGreaterThan(basePreference.targetSocialStyle.introversion);
    expect(next.interestAffinity.hiking).toBeGreaterThan(0);
  });
});
