import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { userService, UserProfile, MembershipStatus, MatchingStatus, MatchingStatusType } from '../services/userService';
import { propertyService } from '../services/propertyService';

/**
 * LuminaContext / useLuminaState
 * 
 * Lightweight shared state layer for the app.
 * Centralizes user journey state (onboarding, membership, matching) so screens
 * can reactively know the user's progress without every component hitting AsyncStorage directly.
 * 
 * Also exposes convenient derived state and actions.
 * 
 * Usage:
 *   const { onboarded, membership, matching, isFullyReady, refresh, subscribe, ... } = useLuminaState();
 */

export interface LuminaState {
  // Raw data
  onboarded: boolean;
  profile: UserProfile | null;
  membership: MembershipStatus | null;
  matching: MatchingStatus | null;

  // Loading / derived
  isLoading: boolean;
  isFullyReady: boolean;           // onboarded + hasActiveMembership
  isMatched: boolean;              // matching.status === 'matched'
  currentTripCity: string | null;
  matchedGroup?: Array<{ name: string; gender: string }>;

  // Actions
  refresh: () => Promise<void>;
  completeOnboarding: (updates: Partial<UserProfile>) => Promise<void>;
  subscribe: () => Promise<void>;
  joinQueue: (city?: string) => Promise<void>;
  simulateMatch: () => Promise<{ groupPreview: Array<{name: string; gender: string}> } | null>;
  leaveQueue: () => Promise<void>;
  resetAllDemoData: () => Promise<void>;
}

const LuminaContext = createContext<LuminaState | undefined>(undefined);

export function LuminaProvider({ children }: { children: ReactNode }) {
  const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [matching, setMatching] = useState<MatchingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ob, prof, mem, mat] = await Promise.all([
        userService.isOnboarded(),
        userService.getProfile(),
        userService.getMembership(),
        userService.getMatchingStatus(),
      ]);

      setOnboarded(ob);
      setProfile(prof);
      setMembership(mem);
      setMatching(mat);
    } catch (e) {
      console.warn('Failed to refresh Lumina state', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial state on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Derived values
  const isFullyReady = onboarded && !!membership?.hasActiveMembership;
  const isMatched = matching?.status === 'matched';
  const currentTripCity = matching?.queuedCity || profile?.preferredCity || null;

  // Action wrappers (keep UI simple, always refresh after mutations)
  const completeOnboarding = useCallback(async (updates: Partial<UserProfile>) => {
    await userService.completeOnboarding(updates);
    await refresh();
  }, [refresh]);

  const subscribe = useCallback(async () => {
    await userService.subscribe();
    await refresh();
  }, [refresh]);

  const joinQueue = useCallback(async (city?: string) => {
    await userService.joinQueue(city);
    await refresh();
  }, [refresh]);

  const simulateMatch = useCallback(async () => {
    const result = await userService.simulateMatch();
    await refresh();
    return result ? { groupPreview: result.groupPreview } : null;
  }, [refresh]);

  const leaveQueue = useCallback(async () => {
    await userService.leaveQueueOrReset();
    await refresh();
  }, [refresh]);

  const resetAllDemoData = useCallback(async () => {
    await userService.resetAllDemoData();
    // Also clear property votes/favorites for clean demo reset
    // Note: propertyService doesn't expose a full reset, so we do a best-effort clear of common keys
    try {
      // The propertyService uses keys like `lumina:${city}:${propId}:...`
      // For simplicity in demo, we can clear all lumina: keys
      // In a real app we'd have a better method.
      const allKeys = await (await import('@react-native-async-storage/async-storage')).default.getAllKeys();
      const luminaKeys = allKeys.filter((k: string) => k.startsWith('lumina:'));
      if (luminaKeys.length > 0) {
        await (await import('@react-native-async-storage/async-storage')).default.multiRemove(luminaKeys);
      }
    } catch (e) {
      console.warn('Partial reset of property data failed', e);
    }
    await refresh();
  }, [refresh]);

  const value: LuminaState = {
    onboarded,
    profile,
    membership,
    matching,
    isLoading,
    isFullyReady,
    isMatched,
    currentTripCity,
    matchedGroup: matching?.matchedGroup,
    refresh,
    completeOnboarding,
    subscribe,
    joinQueue,
    simulateMatch,
    leaveQueue,
    resetAllDemoData,
  };

  return (
    <LuminaContext.Provider value={value}>
      {children}
    </LuminaContext.Provider>
  );
}

export function useLuminaState(): LuminaState {
  const context = useContext(LuminaContext);
  if (context === undefined) {
    throw new Error('useLuminaState must be used within a LuminaProvider');
  }
  return context;
}
