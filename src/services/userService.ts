import AsyncStorage from '@react-native-async-storage/async-storage';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface UserProfile {
  name: string;
  gender: Gender;
  age: number;
  preferredCity: string;
}

export interface MembershipStatus {
  hasActiveMembership: boolean;
  subscribedAt?: string;
  plan?: string;
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
  COMPLETED_CYCLES: 'lumina:user:completedCycles',
} as const;

const DEFAULT_PROFILE: UserProfile = { name: 'Alex Rivera', gender: 'MALE', age: 28, preferredCity: 'Chicago' };
const DEFAULT_MEMBERSHIP: MembershipStatus = { hasActiveMembership: false };
const DEFAULT_MATCHING: MatchingStatus = { status: 'not_queued' };

let cachedProfile: UserProfile | null = null;
let cachedOnboarded: boolean | null = null;
let cachedMembership: MembershipStatus | null = null;
let cachedMatching: MatchingStatus | null = null;
let cachedCompletedCycles: string[] | null = null;

async function load<T>(key: string, fallback: T): Promise<T> {
  try { const raw = await AsyncStorage.getItem(key); if (raw) return JSON.parse(raw) as T; } catch {}
  return fallback;
}

async function save<T>(key: string, value: T): Promise<void> {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export const userService = {
  async isOnboarded(): Promise<boolean> {
    if (cachedOnboarded !== null) return cachedOnboarded;
    const val = await load<boolean>(STORAGE_KEYS.ONBOARDED, false);
    cachedOnboarded = val; return val;
  },
  async getProfile(): Promise<UserProfile> {
    if (cachedProfile) return cachedProfile;
    const profile = await load<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    cachedProfile = profile; return profile;
  },
  async completeOnboarding(profile: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile();
    const updated: UserProfile = { ...current, ...profile, gender: profile.gender ?? current.gender, preferredCity: profile.preferredCity ?? current.preferredCity };
    await save(STORAGE_KEYS.PROFILE, updated); cachedProfile = updated;
    await save(STORAGE_KEYS.ONBOARDED, true); cachedOnboarded = true;
    return updated;
  },
  async getMembership(): Promise<MembershipStatus> {
    if (cachedMembership) return cachedMembership;
    const m = await load<MembershipStatus>(STORAGE_KEYS.MEMBERSHIP, DEFAULT_MEMBERSHIP);
    cachedMembership = m; return m;
  },
  async subscribe(plan: string = 'Monthly'): Promise<MembershipStatus> {
    const status: MembershipStatus = { hasActiveMembership: true, subscribedAt: new Date().toISOString(), plan };
    await save(STORAGE_KEYS.MEMBERSHIP, status); cachedMembership = status; return status;
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
  async getMatchingStatus(): Promise<MatchingStatus> {
    if (cachedMatching) return cachedMatching;
    const s = await load<MatchingStatus>(STORAGE_KEYS.MATCHING, DEFAULT_MATCHING);
    cachedMatching = s; return s;
  },
  async joinQueue(city?: string): Promise<MatchingStatus> {
    const profile = await this.getProfile();
    const status: MatchingStatus = { status: 'queued', queuedCity: city || profile.preferredCity };
    await save(STORAGE_KEYS.MATCHING, status); cachedMatching = status; return status;
  },
  // FIX #1: Guard against re-matching an already-matched user.
  async simulateMatch(): Promise<{ status: MatchingStatus; groupPreview: Array<{ name: string; gender: string }> }> {
    const current = await this.getMatchingStatus();
    if (current.status === 'matched') {
      return { status: current, groupPreview: current.matchedGroup || [] };
    }
    const profile = await this.getProfile();
    if (current.status !== 'queued') await this.joinQueue();
    const groupPreview = [
      { name: 'Emma', gender: 'FEMALE' }, { name: 'Olivia', gender: 'FEMALE' },
      { name: 'Sophia', gender: 'FEMALE' }, { name: 'Isabella', gender: 'FEMALE' },
      { name: 'Mia', gender: 'FEMALE' }, { name: 'Liam', gender: 'MALE' },
      { name: 'Noah', gender: 'MALE' }, { name: 'Oliver', gender: 'MALE' },
      { name: 'James', gender: 'MALE' }, { name: 'Lucas', gender: 'MALE' },
    ];
    const matched: MatchingStatus = {
      status: 'matched', queuedCity: current.queuedCity || profile.preferredCity,
      matchedGroupId: 'grp-' + Date.now().toString(36), matchedAt: new Date().toISOString(), matchedGroup: groupPreview,
    };
    await save(STORAGE_KEYS.MATCHING, matched); cachedMatching = matched;
    return { status: matched, groupPreview };
  },
  async leaveQueueOrReset(): Promise<MatchingStatus> {
    const reset: MatchingStatus = { status: 'not_queued' };
    await save(STORAGE_KEYS.MATCHING, reset); cachedMatching = reset; return reset;
  },
  // ── Alumni cycles: the single source of truth for the access GATE ──────────
  // hasCompletedCycle is DERIVED from this list (length > 0) — never stored as a
  // separate flag, so the two can't drift out of sync.
  async getCompletedCycleIds(): Promise<string[]> {
    if (cachedCompletedCycles) return cachedCompletedCycles;
    const ids = await load<string[]>(STORAGE_KEYS.COMPLETED_CYCLES, []);
    cachedCompletedCycles = ids; return ids;
  },
  /** Record that the current user has finished a cycle (idempotent). Unlocks the gallery. */
  async completeCycle(cycleId: string): Promise<string[]> {
    const current = await this.getCompletedCycleIds();
    if (current.includes(cycleId)) return current;
    const updated = [...current, cycleId];
    await save(STORAGE_KEYS.COMPLETED_CYCLES, updated); cachedCompletedCycles = updated;
    return updated;
  },
  async getFullStatus() {
    const [onboarded, profile, membership, matching] = await Promise.all([this.isOnboarded(), this.getProfile(), this.getMembership(), this.getMatchingStatus()]);
    return { onboarded, profile, membership, matching };
  },
  async resetAllDemoData(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    cachedProfile = null; cachedOnboarded = null; cachedMembership = null; cachedMatching = null;
    cachedCompletedCycles = null;
  },
};
