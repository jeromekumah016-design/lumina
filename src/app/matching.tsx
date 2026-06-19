import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';

/**
 * Matching / Queue screen — "real matching flow hints".
 * Shows the equal 5 men + 5 women rule explicitly.
 * Queue status, join, simulate daily matching.
 * On successful "match" shows the group preview and deep link to Game.
 * Uses the same 10-person cohort as the PropertySelection game.
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

  const isMember = membership?.hasActiveMembership;
  const isMatched = matching?.status === 'matched';
  const isQueued = matching?.status === 'queued';

  // Simple queue visual (demo numbers)
  const menNeeded = 5;
  const womenNeeded = 5;
  const currentMen = isQueued || isMatched ? 4 : 2; // pretend some people are already in
  const currentWomen = isQueued || isMatched ? 4 : 3;

  return (
    <View className="flex-1 bg-retro-cream">
      <View className="pt-12 px-4 pb-3 bg-retro-cream border-b-2 border-black">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-1 -ml-1 mr-2">
            <Ionicons name="chevron-back" size={22} color="#1A1612" />
          </Pressable>
          <Text className="text-xl font-extrabold tracking-tight text-retro-ink">Matching &amp; Queue</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-5" contentContainerStyle={{ paddingBottom: 80 }}>
        {!isMember && (
          <View className="bg-amber-100 border-2 border-black shadow-retro-sm rounded-2xl p-4 mb-5">
            <Text className="font-extrabold text-retro-ink">Membership required</Text>
            <Text className="text-sm text-retro-dark mt-1">Subscribe to become eligible for matching into groups.</Text>
            <Pressable onPress={() => router.push('/subscribe' as any)} className="mt-2 self-start bg-retro-ink border-2 border-black px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">Subscribe now</Text>
            </Pressable>
          </View>
        )}

        {/* The Rule - prominent, from revamp spec */}
        <View className="bg-sky-100 border-2 border-black shadow-retro-sm rounded-2xl p-4 mb-5">
          <Text className="font-extrabold text-retro-ink">The 5-to-5 Rule</Text>
          <Text className="mt-1 text-sm text-retro-ink">
            Every trip group is formed with <Text className="font-extrabold">an equal 5 men + 5 women = 10 members</Text>, plus 1–2 optional handlers (organizers).
            We only form a group when we have at least that many eligible, verified, subscribed members available for the same city and dates.
          </Text>
          <Text className="text-[11px] font-bold mt-2 text-retro-blue">No partial groups. No silent drops.</Text>
        </View>

        {/* Your status */}
        <View className="mb-5">
          <Text className="uppercase text-xs tracking-widest font-bold text-retro-dark mb-1.5">Your status</Text>
          <View className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-4">
            <View className="flex-row justify-between">
              <View>
                <Text className="text-sm text-retro-dark">Gender</Text>
                <Text className="font-bold text-base text-retro-ink">{currentProfile?.gender || '—'}</Text>
              </View>
              <View>
                <Text className="text-sm text-retro-dark">Preferred city</Text>
                <Text className="font-bold text-base text-retro-ink">{currentProfile?.preferredCity || 'Chicago'}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-retro-dark">Status</Text>
                <Text className={`font-bold ${isMatched ? 'text-emerald-700' : isQueued ? 'text-retro-blue' : 'text-retro-dark'}`}>
                  {isMatched ? 'MATCHED' : isQueued ? 'In queue' : 'Not in queue'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Live-ish queue (demo) */}
        <Text className="uppercase text-xs tracking-widest font-bold text-retro-dark mb-1.5">Current queue for {matching?.queuedCity || currentProfile?.preferredCity || 'Chicago'}</Text>
        <View className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm font-semibold text-retro-ink">Men</Text>
            <Text className="text-sm font-bold text-retro-ink">{currentMen} / {menNeeded}</Text>
          </View>
          <View className="h-2 bg-white border border-black rounded-full overflow-hidden mb-3">
            <View className="h-full bg-retro-navy" style={{ width: `${(currentMen / menNeeded) * 100}%` }} />
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm font-semibold text-retro-ink">Women</Text>
            <Text className="text-sm font-bold text-retro-ink">{currentWomen} / {womenNeeded}</Text>
          </View>
          <View className="h-2 bg-white border border-black rounded-full overflow-hidden">
            <View className="h-full bg-retro-pink" style={{ width: `${(currentWomen / womenNeeded) * 100}%` }} />
          </View>

          <Text className="text-[11px] text-retro-dark mt-3">Matching runs daily. We only form the group when both sides hit the exact numbers.</Text>
        </View>

        {/* Actions */}
        {!isMatched && isMember && (
          <View className="flex-row gap-3 mb-4">
            {!isQueued ? (
              <Pressable onPress={handleJoinQueue} disabled={loading} className="flex-1 bg-retro-blue py-3 rounded-xl border-2 border-black shadow-retro-sm items-center">
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Join the queue</Text>}
              </Pressable>
            ) : (
              <Pressable onPress={handleSimulateMatch} disabled={loading} className="flex-1 bg-emerald-600 py-3 rounded-xl border-2 border-black shadow-retro-sm items-center">
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Simulate daily matching</Text>}
              </Pressable>
            )}
            {isQueued && (
              <Pressable onPress={handleReset} className="px-4 items-center justify-center bg-white border-2 border-black rounded-xl">
                <Text className="text-xs font-bold text-retro-ink">Leave queue</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Matched group preview */}
        {isMatched && matchResult && (
          <View className="mb-6">
            <Text className="font-extrabold text-emerald-700 mb-2">🎉 You're matched!</Text>
            <View className="bg-emerald-100 border-2 border-black shadow-retro-sm rounded-2xl p-4">
              <Text className="text-sm font-semibold text-retro-ink">Your group for {matching?.queuedCity || currentProfile?.preferredCity} weekend</Text>
              <Text className="text-xs text-retro-dark mt-0.5">5 men + 5 women • equal composition</Text>

              <View className="mt-3 flex-row flex-wrap">
                {matchResult.groupPreview.map((m, i) => (
                  <View key={i} className="flex-row items-center bg-white border border-black rounded-full px-2.5 py-1 mr-1.5 mb-1.5">
                    <Ionicons name={m.gender === 'MALE' ? 'man' : 'woman'} size={12} color={m.gender === 'MALE' ? '#1E40AF' : '#be185d'} />
                    <Text className="ml-1 text-xs font-semibold text-retro-ink">{m.name}</Text>
                  </View>
                ))}
              </View>

              <Pressable onPress={goToGame} className="mt-4 bg-retro-ink py-2.5 rounded-xl border-2 border-black shadow-retro-sm items-center">
                <Text className="text-white font-bold">Go to Game — vote on properties</Text>
              </Pressable>
            </View>
          </View>
        )}

        {!isMatched && (
          <Text className="text-xs text-retro-dark text-center">
            This is a prototype of the real daily matching engine. In production it loads eligible members (onboarded + verified + active membership + queued) and only creates the trip when the exact 5+5 threshold is met for a city + dates.
          </Text>
        )}
      </ScrollView>

      {isMatched && (
        <View className="px-4 pb-6">
          <Pressable onPress={handleReset} className="py-2 items-center">
            <Text className="text-xs text-retro-dark font-semibold">Reset demo matching state</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
