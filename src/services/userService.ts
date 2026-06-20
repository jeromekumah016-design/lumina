import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * User service for Lumina mobile prototype.
 * Handles:
 * - Onboarding completion + basic profile (name, gender critical for 4M/7F matching, city pref, age)
 * - Membership / subscription status (hasActiveMembership set only after "payment")
 * - Matching queue + simulation hints (real matching flow teaser)
 *
 * All persisted via AsyncStorage. Mock data for demo.
 * Explicitly discloses the co-ed 4 men + 7 women group trip format per product spec.
 */

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface UserProfile {
  name: string;
  gender: Gender;
  age: number;
  preferredCity: string;
}

export interface MembershipStatus {
  hasActiveMembership: boolean;
  subscribedAt?: string; // ISO
  plan?: string; // e.g. "Monthly"
}

export type MatchingStatusType = 'not_queued' | 'queued' | 'matched';

export interface MatchingStatus {
  status: MatchingStatusType;
  queuedCity?: string;
  matchedGroupId?: string;
  matchedAt?: string;
  matchedGroup?: Array<{ name: string; gender: string }>;
}

const STORAGE_KEYS = {
  PROFILE: 'lumina:user:profile',
  ONBOARDED: 'lumina:user:onboarded',
  MEMBERSHIP: 'lumina:user:membership',
  MATCHING: 'lumina:user:matching',
} as const;

// Default / seed data
const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  gender: 'MALE',
  age: 28,
  preferredCity: 'Chicago',
};

const DEFAULT_MEMBERSHIP: MembershipStatus = {
  hasActiveMembership: false,
};

const DEFAULT_MATCHING: MatchingStatus = {
  status: 'not_queued',
};

// In-memory cache
let cachedProfile: UserProfile | null = null;
let cachedOnboarded: boolean | null = null;
let cachedMembership: MembershipStatus | null = null;
let cachedMatching: MatchingStatus | null = null;

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

async function save<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const userService = {
  // --- Onboarding + Profile ---
  async isOnboarded(): Promise<boolean> {
    if (cachedOnboarded !== null) return cachedOnboarded;
    const val = await load<boolean>(STORAGE_KEYS.ONBOARDED, false);
    cachedOnboarded = val;
    return val;
  },

  async getProfile(): Promise<UserProfile> {
    if (cachedProfile) return cachedProfile;
    const profile = await load<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    cachedProfile = profile;
    return profile;
  },

  async completeOnboarding(profile: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile();
    const updated: UserProfile = {
      ...current,
      ...profile,
      // ensure required fields
      gender: profile.gender ?? current.gender,
      preferredCity: profile.preferredCity ?? current.preferredCity,
    };
    await save(STORAGE_KEYS.PROFILE, updated);
    cachedProfile = updated;

    await save(STORAGE_KEYS.ONBOARDED, true);
    cachedOnboarded = true;

    return updated;
  },

  // --- Membership / Subscription ---
  async getMembership(): Promise<MembershipStatus> {
    if (cachedMembership) return cachedMembership;
    const m = await load<MembershipStatus>(STORAGE_KEYS.MEMBERSHIP, DEFAULT_MEMBERSHIP);
    cachedMembership = m;
    return m;
  },

  async subscribe(plan: string = 'Monthly'): Promise<MembershipStatus> {
    // In real app this would be after successful Stripe Checkout + webhook confirmation.
    // Here we simulate "payment success" immediately for the prototype.
    const status: MembershipStatus = {
      hasActiveMembership: true,
      subscribedAt: new Date().toISOString(),
      plan,
    };
    await save(STORAGE_KEYS.MEMBERSHIP, status);
    cachedMembership = status;
    return status;
  },

  async cancelMembership(): Promise<MembershipStatus> {
    const status: MembershipStatus = {
      hasActiveMembership: false,
    };
    await save(STORAGE_KEYS.MEMBERSHIP, status);
    cachedMembership = status;
    // Also leave any active queue — a non-member must not remain queued for matching.
    const matching = await this.getMatchingStatus();
    if (matching.status !== 'not_queued') {
      await this.leaveQueueOrReset();
    }
    return status;
  },

  // --- Matching flow hints (4 men + 7 women rule) ---
  async getMatchingStatus(): Promise<MatchingStatus> {
    if (cachedMatching) return cachedMatching;
    const s = await load<MatchingStatus>(STORAGE_KEYS.MATCHING, DEFAULT_MATCHING);
    cachedMatching = s;
    return s;
  },

  async joinQueue(city?: string): Promise<MatchingStatus> {
    const profile = await this.getProfile();
    const status: MatchingStatus = {
      status: 'queued',
      queuedCity: city || profile.preferredCity,
    };
    await save(STORAGE_KEYS.MATCHING, status);
    cachedMatching = status;
    return status;
  },

  /**
   * Simulate the daily matching engine (runDailyMatching in full backend).
   * Enforces the 4 MALE + 7 FEMALE rule for demo.
   * If user is queued and we have "enough" (demo always succeeds for simplicity),
   * marks as matched and returns the group.
   */
  async simulateMatch(): Promise<{ status: MatchingStatus; groupPreview: Array<{name: string; gender: string}> }> {
    const current = await this.getMatchingStatus();
    const profile = await this.getProfile();

    if (current.status !== 'queued') {
      // Auto-join if not queued
      await this.joinQueue();
    }

    // Demo: always form a group. In real impl this would check counts per city/gender/availability.
    const groupPreview = [
      { name: 'Emma', gender: 'FEMALE' },
      { name: 'Olivia', gender: 'FEMALE' },
      { name: 'Sophia', gender: 'FEMALE' },
      { name: 'Isabella', gender: 'FEMALE' },
      { name: 'Mia', gender: 'FEMALE' },
      { name: 'Ava', gender: 'FEMALE' },
      { name: 'Charlotte', gender: 'FEMALE' },
      { name: 'Liam', gender: 'MALE' },
      { name: 'Noah', gender: 'MALE' },
      { name: 'Oliver', gender: 'MALE' },
      { name: 'James', gender: 'MALE' },
    ];

    const matched: MatchingStatus = {
      status: 'matched',
      queuedCity: current.queuedCity || profile.preferredCity,
      matchedGroupId: 'grp-' + Date.now().toString(36),
      matchedAt: new Date().toISOString(),
      matchedGroup: groupPreview,
    };

    await save(STORAGE_KEYS.MATCHING, matched);
    cachedMatching = matched;

    return { status: matched, groupPreview };
  },

  async leaveQueueOrReset(): Promise<MatchingStatus> {
    const reset: MatchingStatus = { status: 'not_queued' };
    await save(STORAGE_KEYS.MATCHING, reset);
    cachedMatching = reset;
    return reset;
  },

  // Utility for screens
  async getFullStatus() {
    const [onboarded, profile, membership, matching] = await Promise.all([
      this.isOnboarded(),
      this.getProfile(),
      this.getMembership(),
      this.getMatchingStatus(),
    ]);
    return { onboarded, profile, membership, matching };
  },

  // For dev/debug - reset everything
  async resetAllDemoData(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    cachedProfile = null;
    cachedOnboarded = null;
    cachedMembership = null;
    cachedMatching = null;
  },
};
