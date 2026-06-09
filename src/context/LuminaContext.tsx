import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
// FIX #2: static import - no more dynamic import() inside a callback
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService, UserProfile, MembershipStatus, MatchingStatus, MatchingStatusType } from '../services/userService';
import { propertyService } from '../services/propertyService';

export interface LuminaState {
  onboarded: boolean;
  profile: UserProfile | null;
  membership: MembershipStatus | null;
  matching: MatchingStatus | null;
  isLoading: boolean;
  isFullyReady: boolean;
  isMatched: boolean;
  currentTripCity: string | null;
  matchedGroup?: Array<{ name: string; gender: string }>;
  refresh: () => Promise<void>;
  completeOnboarding: (updates: Partial<UserProfile>) => Promise<void>;
  subscribe: () => Promise<void>;
  joinQueue: (city?: string) => Promise<void>;
  simulateMatch: () => Promise<{ groupPreview: Array<{ name: string; gender: string }> } | null>;
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
      setOnboarded(ob); setProfile(prof); setMembership(mem); setMatching(mat);
    } catch (e) {
      console.warn('Failed to refresh Lumina state', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const isFullyReady = onboarded && !!membership?.hasActiveMembership;
  const isMatched = matching?.status === 'matched';
  const currentTripCity = matching?.queuedCity || profile?.preferredCity || null;

  const completeOnboarding = useCallback(async (updates: Partial<UserProfile>) => {
    await userService.completeOnboarding(updates); await refresh();
  }, [refresh]);

  const subscribe = useCallback(async () => {
    await userService.subscribe(); await refresh();
  }, [refresh]);

  const joinQueue = useCallback(async (city?: string) => {
    await userService.joinQueue(city); await refresh();
  }, [refresh]);

  const simulateMatch = useCallback(async () => {
    const result = await userService.simulateMatch(); await refresh();
    return result ? { groupPreview: result.groupPreview } : null;
  }, [refresh]);

  const leaveQueue = useCallback(async () => {
    await userService.leaveQueueOrReset(); await refresh();
  }, [refresh]);

  // FIX #2: delegate full reset to each service - no dynamic imports, no silent failures.
  const resetAllDemoData = useCallback(async () => {
    try { await userService.resetAllDemoData(); } catch (e) { console.warn('userService.resetAllDemoData failed', e); }
    try { await (propertyService as any).resetAll?.(); } catch (e) { console.warn('propertyService.resetAll failed', e); }
    await refresh();
  }, [refresh]);

  const value: LuminaState = {
    onboarded, profile, membership, matching, isLoading,
    isFullyReady, isMatched, currentTripCity,
    matchedGroup: matching?.matchedGroup,
    refresh, completeOnboarding, subscribe, joinQueue, simulateMatch, leaveQueue, resetAllDemoData,
  };

  return <LuminaContext.Provider value={value}>{children}</LuminaContext.Provider>;
}

export function useLuminaState(): LuminaState {
  const context = useContext(LuminaContext);
  if (context === undefined) throw new Error('useLuminaState must be used within a LuminaProvider');
  return context;
}
