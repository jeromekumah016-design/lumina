import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';

/**
 * Matching / Queue screen — "real matching flow hints".
 * Shows the 4 men + 7 women rule explicitly.
 * Queue status, join, simulate daily matching.
 * On successful "match" shows the group preview and deep link to Game.
 * Uses the same 11-person cohort as the PropertySelection game.
 */

export default function MatchingScreen() {
  const router = useRouter();
  const { 
    matching, 
    profile: currentProfile, 
    membership, 
    simulateMatch: sharedSimulate, 
    joinQueue: sharedJoin, 
    leaveQueue: sharedLeave, 
    refresh 
  } = useLuminaState();
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<{ groupPreview: any[] } | null>(null);

  // Derived — declared before the useEffect below that references them in the dep array.
  const isMember = membership?.hasActiveMembership;
  const isMatched = matching?.status === 'matched';
  const isQueued = matching?.status === 'queued';

  const handleJoinQueue = async () => {
    setLoading(true);
    try {
      await sharedJoin();
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateMatch = async () => {
    setLoading(true);
    try {
      const res = await sharedSimulate();
      if (res) {
        setMatchResult({ groupPreview: res.groupPreview });
      }
    } finally {
      setLoading(false);
    }
  };

  // If already matched from a prior session, populate matchResult from context
  useEffect(() => {
    if (isMatched && !matchResult && matching?.matchedGroup) {
      setMatchResult({ groupPreview: matching.matchedGroup });
    }
  }, [isMatched, matching]);

  const handleReset = async () => {
    setLoading(true);
    try {
      await sharedLeave();
      setMatchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const goToGame = () => {
    router.push('/game');
  };

  // Simple queue visual (demo numbers)
  const menNeeded = 4;
  const womenNeeded = 7;
  const currentMen = isQueued || isMatched ? 3 : 2; // pretend some people are already in
  const currentWomen = isQueued || isMatched ? 5 : 4;

  return (
    <View className="flex-1 bg-retro-cream border-4 border-black shadow-retro">
      <View className="pt-12 px-4 pb-3 bg-retro-cream border-4 border-black shadow-retro border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-1 -ml-1 mr-2">
            <Ionicons name="chevron-back" size={22} color="#64748B" />
          </Pressable>
          <Text className="text-xl font-semibold text-[#1E40AF]">Matching &amp; Queue</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-5" contentContainerStyle={{ paddingBottom: 80 }}>
        {!isMember && (
          <View className="bg-amber-100 border border-amber-200 rounded-2xl p-4 mb-5">
            <Text className="font-semibold text-amber-800">Membership required</Text>
            <Text className="text-sm text-amber-700 mt-1">Subscribe to become eligible for matching into groups.</Text>
            <Pressable onPress={() => router.push('/subscribe' as any)} className="mt-2 self-start bg-amber-600 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-semibold">Subscribe now</Text>
            </Pressable>
          </View>
        )}

        {/* The Rule - prominent, from revamp spec */}
        <View className="bg-[#DBEAFE] rounded-2xl p-4 mb-5">
          <Text className="font-semibold text-[#0C4A6E]">The 4-to-7 Rule</Text>
          <Text className="mt-1 text-sm text-[#0C4A6E]">
            Every trip group is formed with <Text className="font-bold">exactly 4 men + 7 women = 11 members</Text>, plus 1–2 optional handlers (organizers).
            We only form a group when we have at least that many eligible, verified, subscribed members available for the same city and dates.
          </Text>
          <Text className="text-[11px] mt-2 text-[#0369A1]">No partial groups. No silent drops.</Text>
        </View>

        {/* Your status */}
        <View className="mb-5">
          <Text className="uppercase text-xs tracking-widest text-retro-dark mb-1.5">Your status</Text>
          <View className="bg-retro-cream border-4 border-black shadow-retro border border-gray-100 rounded-2xl p-4">
            <View className="flex-row justify-between">
              <View>
                <Text className="text-sm text-retro-dark">Gender</Text>
                <Text className="font-semibold text-base">{currentProfile?.gender || '—'}</Text>
              </View>
              <View>
                <Text className="text-sm text-retro-dark">Preferred city</Text>
                <Text className="font-semibold text-base">{currentProfile?.preferredCity || 'Chicago'}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-retro-dark">Status</Text>
                <Text className={`font-semibold ${isMatched ? 'text-emerald-600' : isQueued ? 'text-[#0284C8]' : 'text-retro-dark'}`}>
                  {isMatched ? 'MATCHED' : isQueued ? 'In queue' : 'Not in queue'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Live-ish queue (demo) */}
        <Text className="uppercase text-xs tracking-widest text-retro-dark mb-1.5">Current queue for {matching?.queuedCity || currentProfile?.preferredCity || 'Chicago'}</Text>
        <View className="bg-retro-cream border-4 border-black shadow-retro border border-gray-100 rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm">Men</Text>
            <Text className="text-sm font-semibold">{currentMen} / {menNeeded}</Text>
          </View>
          <View className="h-2 bg-gray-100 rounded mb-3">
            <View className="h-2 bg-[#1E40AF] rounded" style={{ width: `${(currentMen / menNeeded) * 100}%` }} />
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm">Women</Text>
            <Text className="text-sm font-semibold">{currentWomen} / {womenNeeded}</Text>
          </View>
          <View className="h-2 bg-gray-100 rounded">
            <View className="h-2 bg-[#0284C8] rounded" style={{ width: `${(currentWomen / womenNeeded) * 100}%` }} />
          </View>

          <Text className="text-[11px] text-gray-400 mt-3">Matching runs daily. We only form the group when both sides hit the exact numbers.</Text>
        </View>

        {/* Actions */}
        {!isMatched && isMember && (
          <View className="flex-row gap-3 mb-4">
            {!isQueued ? (
              <Pressable onPress={handleJoinQueue} disabled={loading} className="flex-1 bg-[#0284C8] py-3 rounded-2xl items-center">
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Join the queue</Text>}
              </Pressable>
            ) : (
              <Pressable onPress={handleSimulateMatch} disabled={loading} className="flex-1 bg-emerald-600 py-3 rounded-2xl items-center">
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Simulate daily matching</Text>}
              </Pressable>
            )}
            {isQueued && (
              <Pressable onPress={handleReset} className="px-4 items-center justify-center border border-gray-300 rounded-2xl">
                <Text className="text-xs text-retro-dark">Leave queue</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Matched group preview */}
        {isMatched && matchResult && (
          <View className="mb-6">
            <Text className="font-semibold text-emerald-700 mb-2">🎉 You're matched!</Text>
            <View className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <Text className="text-sm">Your group for {matching?.queuedCity || currentProfile?.preferredCity} weekend</Text>
              <Text className="text-xs text-retro-dark mt-0.5">4 men + 7 women • exact composition</Text>

              <View className="mt-3 flex-row flex-wrap">
                {matchResult.groupPreview.map((m, i) => (
                  <View key={i} className="flex-row items-center bg-retro-cream border-4 border-black shadow-retro rounded-full px-2.5 py-1 mr-1.5 mb-1.5 border border-emerald-100">
                    <Ionicons name={m.gender === 'MALE' ? 'man' : 'woman'} size={12} color={m.gender === 'MALE' ? '#1E40AF' : '#be185d'} />
                    <Text className="ml-1 text-xs font-medium">{m.name}</Text>
                  </View>
                ))}
              </View>

              <Pressable onPress={goToGame} className="mt-4 bg-emerald-700 py-2.5 rounded-2xl items-center">
                <Text className="text-white font-semibold">Go to Game — vote on properties</Text>
              </Pressable>
            </View>
          </View>
        )}

        {!isMatched && (
          <Text className="text-xs text-gray-400 text-center">
            This is a prototype of the real daily matching engine. In production it loads eligible members (onboarded + verified + active membership + queued) and only creates the trip when the exact 4+7 threshold is met for a city + dates.
          </Text>
        )}
      </ScrollView>

      {isMatched && (
        <View className="px-4 pb-6">
          <Pressable onPress={handleReset} className="py-2 items-center">
            <Text className="text-xs text-gray-400">Reset demo matching state</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
