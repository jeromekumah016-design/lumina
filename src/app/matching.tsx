import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';
import { userService } from '../services/userService';
import { RETRO_THEME_ENABLED, RETRO_COLORS, RETRO_FONT } from '../theme/retro';
import { SynthwaveBackground } from '../components/retro/SynthwaveBackground';
import { NeonCard } from '../components/retro/NeonCard';
import { NeonButton } from '../components/retro/NeonButton';
import { NeonPanel } from '../components/retro/NeonPanel';
import { NeonHeader } from '../components/retro/NeonHeader';

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
  const [rankedPreview, setRankedPreview] = useState<Array<{ id: string; name: string; total: number; interests: string[]; socialStyle: { introversion: number; adventurousness: number } }>>([]);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isMember = membership?.hasActiveMembership;
  const isMatched = matching?.status === 'matched';
  const isQueued = matching?.status === 'queued';
  const queueCity = matching?.queuedCity || currentProfile?.preferredCity || 'Chicago';

  const handleJoinQueue = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const introReady = await userService.isIntroProfileReady();
      if (!introReady) {
        setActionError('Complete the Intro Bot first so matching can use your interests and social style.');
        return;
      }
      await sharedJoin();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to join queue.');
    } finally { setLoading(false); }
  };

  const handleSimulateMatch = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await sharedSimulate();
      if (res) setMatchResult({ groupPreview: res.groupPreview });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to simulate matching.');
    } finally { setLoading(false); }
  };

  const handleReset = async () => {
    setLoading(true);
    setActionError(null);
    try {
      await sharedLeave();
      setMatchResult(null);
    } finally { setLoading(false); }
  };

  const goToGame = () => { router.push('/game'); };

  const handleFeedback = async (rating: number) => {
    const candidate = rankedPreview[0];
    if (!candidate) return;
    setFeedbackSaving(true);
    try {
      await userService.recordInteractionFeedback({
        candidateId: candidate.id,
        rating,
        interests: candidate.interests,
        socialStyle: candidate.socialStyle,
      });
      const refreshed = await userService.getRankedCandidates(queueCity);
      setRankedPreview(
        refreshed.slice(0, 4).map((item) => ({
          id: item.id,
          name: item.name,
          total: item.compatibility.total,
          interests: item.interests,
          socialStyle: item.socialStyle,
        }))
      );
    } finally {
      setFeedbackSaving(false);
    }
  };

  useEffect(() => {
    if (isMatched && !matchResult && matching?.matchedGroup) {
      setMatchResult({ groupPreview: matching.matchedGroup });
    }
  }, [isMatched, matching]);

  useEffect(() => {
    (async () => {
      const next = await userService.getRankedCandidates(queueCity);
      setRankedPreview(
        next.slice(0, 4).map((item) => ({
          id: item.id,
          name: item.name,
          total: item.compatibility.total,
          interests: item.interests,
          socialStyle: item.socialStyle,
        }))
      );
    })();
  }, [queueCity, isQueued, isMatched]);

  const menNeeded = 5;
  const womenNeeded = 5;
  const currentMen = isQueued || isMatched ? 4 : 2;
  const currentWomen = isQueued || isMatched ? 4 : 3;

  if (!RETRO_THEME_ENABLED) {
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

          <View className="bg-sky-100 border-2 border-black shadow-retro-sm rounded-2xl p-4 mb-5">
            <Text className="font-extrabold text-retro-ink">The 5-to-5 Rule</Text>
            <Text className="mt-1 text-sm text-retro-ink">
              Every trip group is formed with <Text className="font-extrabold">an equal 5 men + 5 women = 10 members</Text>, plus 1–2 optional handlers (organizers).
              We only form a group when we have at least that many eligible, verified, subscribed members available for the same city and dates.
            </Text>
            <Text className="text-[11px] font-bold mt-2 text-retro-blue">No partial groups. No silent drops.</Text>
          </View>

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

          <Text className="uppercase text-xs tracking-widest font-bold text-retro-dark mb-1.5">Current queue for {matching?.queuedCity || currentProfile?.preferredCity || 'Chicago'}</Text>
          <View className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-4 mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm font-semibold text-retro-ink">Men</Text>
              <Text className="text-sm font-bold text-retro-ink">{currentMen} / {menNeeded}</Text>
            </View>
            {actionError ? (
              <View className="bg-amber-100 border-2 border-black shadow-retro-sm rounded-2xl p-3 mb-4">
                <Text className="text-xs font-semibold text-retro-ink">{actionError}</Text>
              </View>
            ) : null}
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

          <View className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-4 mb-4">
            <Text className="text-sm font-extrabold text-retro-ink">Top compatibility picks in Chicago</Text>
            <Text className="text-[11px] text-retro-dark mt-1">Based on shared interests + social style + your rating history.</Text>
            <View className="mt-3">
              {rankedPreview.map((item) => (
                <View key={item.id} className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs font-semibold text-retro-ink">{item.name}</Text>
                  <Text className="text-xs font-bold text-retro-blue">{Math.round(item.total * 100)}%</Text>
                </View>
              ))}
            </View>
          </View>

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
                <View className="mt-4">
                  <Text className="text-xs text-retro-dark mb-2">How was your latest interaction quality?</Text>
                  <View className="flex-row gap-2">
                    <Pressable disabled={feedbackSaving} onPress={() => handleFeedback(5)} className="bg-emerald-600 px-3 py-2 rounded-full border border-black">
                      <Text className="text-white text-xs font-bold">Great (5)</Text>
                    </Pressable>
                    <Pressable disabled={feedbackSaving} onPress={() => handleFeedback(2)} className="bg-amber-600 px-3 py-2 rounded-full border border-black">
                      <Text className="text-white text-xs font-bold">Not great (2)</Text>
                    </Pressable>
                  </View>
                </View>
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

  // ── Retro synthwave render ──────────────────────────────────────────────────
  return (
    <SynthwaveBackground>
      <View style={{ flex: 1 }}>
        {/* Nav header */}
        <View style={{
          paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12,
          borderBottomWidth: 1.5, borderBottomColor: RETRO_COLORS.neonCyan,
          backgroundColor: 'rgba(10,0,32,0.85)',
          flexDirection: 'row', alignItems: 'center',
        }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="chevron-back" size={22} color={RETRO_COLORS.neonCyan} />
          </Pressable>
          <NeonHeader title="MATCHING & QUEUE" />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {/* Membership gate */}
          {!isMember && (
            <NeonPanel variant="warning" style={{ marginBottom: 16 }}>
              <Text style={{ color: RETRO_COLORS.neonOrange, fontWeight: '800', fontSize: 13, marginBottom: 4 }}>
                MEMBERSHIP REQUIRED
              </Text>
              <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>
                Subscribe to become eligible for matching into groups.
              </Text>
              <NeonButton
                label="SUBSCRIBE NOW"
                onPress={() => router.push('/subscribe' as any)}
                variant="magenta"
                size="sm"
              />
            </NeonPanel>
          )}

          {/* 5-to-5 Rule */}
          <NeonPanel variant="info" style={{ marginBottom: 16 }}>
            <Text style={{ color: RETRO_COLORS.neonCyan, fontWeight: '800', fontSize: 13, letterSpacing: 1, marginBottom: 6 }}>
              THE 5-TO-5 RULE
            </Text>
            <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 13, lineHeight: 19 }}>
              Every trip group is formed with{' '}
              <Text style={{ color: RETRO_COLORS.neonYellow, fontWeight: '800' }}>an equal 5 men + 5 women = 10 members</Text>
              , plus 1–2 optional handlers. We only form a group when we have at least that many eligible, verified, subscribed members for the same city and dates.
            </Text>
            <Text style={{ color: RETRO_COLORS.neonCyan, fontWeight: '700', fontSize: 11, marginTop: 8 }}>
              No partial groups. No silent drops.
            </Text>
          </NeonPanel>

          {/* Your status */}
          <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
            Your Status
          </Text>
          <NeonCard variant="cyan" style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11 }}>Gender</Text>
                <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '700', fontSize: 14 }}>
                  {currentProfile?.gender || '—'}
                </Text>
              </View>
              <View>
                <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11 }}>City</Text>
                <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '700', fontSize: 14 }}>
                  {currentProfile?.preferredCity || 'Chicago'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11 }}>Status</Text>
                <Text style={{
                  fontWeight: '700', fontSize: 14,
                  color: isMatched ? RETRO_COLORS.neonGreen : isQueued ? RETRO_COLORS.neonCyan : RETRO_COLORS.textMuted,
                }}>
                  {isMatched ? 'MATCHED' : isQueued ? 'IN QUEUE' : 'NOT QUEUED'}
                </Text>
              </View>
            </View>
          </NeonCard>

          {/* Queue visualization */}
          <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
            Current Queue · {queueCity}
          </Text>
          <NeonCard variant="magenta" style={{ marginBottom: 16 }}>
            {[
              { label: 'Men', current: currentMen, needed: menNeeded, color: RETRO_COLORS.neonCyan },
              { label: 'Women', current: currentWomen, needed: womenNeeded, color: RETRO_COLORS.neonMagenta },
            ].map((row, i) => (
              <View key={i} style={{ marginBottom: i === 0 ? 12 : 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '600', fontSize: 13 }}>{row.label}</Text>
                  <Text style={{ color: row.color, fontWeight: '700', fontSize: 13 }}>
                    {row.current} / {row.needed}
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: 'rgba(10,0,32,0.8)', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: row.color }}>
                  <View style={{
                    height: '100%',
                    width: `${(row.current / row.needed) * 100}%`,
                    backgroundColor: row.color,
                    borderRadius: 4,
                  }} />
                </View>
              </View>
            ))}
            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11, marginTop: 10 }}>
              Matching runs daily. We only form the group when both sides hit the exact numbers.
            </Text>
          </NeonCard>
          {actionError ? (
            <NeonPanel variant="warning" style={{ marginBottom: 16 }}>
              <Text style={{ color: RETRO_COLORS.neonOrange, fontSize: 12, fontWeight: '700' }}>{actionError}</Text>
            </NeonPanel>
          ) : null}

          <NeonCard variant="cyan" style={{ marginBottom: 16 }}>
            <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>
              TOP COMPATIBILITY PICKS · CHICAGO
            </Text>
            <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 11, marginTop: 4 }}>
              Shared interests + social style + your rating history.
            </Text>
            <View style={{ marginTop: 10 }}>
              {rankedPreview.map((item) => (
                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 12, fontWeight: '600' }}>{item.name}</Text>
                  <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 12, fontWeight: '700' }}>
                    {Math.round(item.total * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </NeonCard>

          {/* Actions */}
          {!isMatched && isMember && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {!isQueued ? (
                loading ? (
                  <View style={{ flex: 1, alignItems: 'center', padding: 12 }}>
                    <ActivityIndicator color={RETRO_COLORS.neonCyan} />
                  </View>
                ) : (
                  <NeonButton
                    label="JOIN THE QUEUE"
                    onPress={handleJoinQueue}
                    variant="cyan"
                    size="md"
                    style={{ flex: 1 }}
                  />
                )
              ) : (
                loading ? (
                  <View style={{ flex: 1, alignItems: 'center', padding: 12 }}>
                    <ActivityIndicator color={RETRO_COLORS.neonGreen} />
                  </View>
                ) : (
                  <NeonButton
                    label="SIMULATE DAILY MATCHING"
                    onPress={handleSimulateMatch}
                    variant="cyan"
                    size="md"
                    style={{ flex: 1, borderColor: RETRO_COLORS.neonGreen }}
                  />
                )
              )}
              {isQueued && (
                <NeonButton
                  label="LEAVE"
                  onPress={handleReset}
                  variant="magenta"
                  size="md"
                />
              )}
            </View>
          )}

          {/* Matched group preview */}
          {isMatched && matchResult && (
            <NeonPanel variant="success" style={{ marginBottom: 20 }}>
              <Text style={{ color: RETRO_COLORS.neonGreen, fontWeight: '800', fontSize: 15, letterSpacing: 1, marginBottom: 4 }}>
                🎉 YOU'RE MATCHED!
              </Text>
              <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '600', fontSize: 13, marginBottom: 2 }}>
                Your group for {queueCity} weekend
              </Text>
              <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 11, marginBottom: 12 }}>
                5 men + 5 women · equal composition
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {matchResult.groupPreview.map((m: any, i: number) => (
                  <View key={i} style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 8, paddingVertical: 4,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: m.gender === 'MALE' ? RETRO_COLORS.neonCyan : RETRO_COLORS.neonMagenta,
                    backgroundColor: 'rgba(10,0,32,0.5)',
                  }}>
                    <Ionicons
                      name={m.gender === 'MALE' ? 'man' : 'woman'}
                      size={11}
                      color={m.gender === 'MALE' ? RETRO_COLORS.neonCyan : RETRO_COLORS.neonMagenta}
                    />
                    <Text style={{ marginLeft: 4, fontSize: 11, fontWeight: '600', color: RETRO_COLORS.textPrimary }}>
                      {m.name}
                    </Text>
                  </View>
                ))}
              </View>
              <NeonButton
                label="GO TO GAME — VOTE ON PROPERTIES"
                onPress={goToGame}
                variant="cyan"
                size="md"
                fullWidth
              />
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 11, marginBottom: 8 }}>
                  How was your latest interaction quality?
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <NeonButton
                    label={feedbackSaving ? 'SAVING...' : 'GREAT (5)'}
                    onPress={() => handleFeedback(5)}
                    variant="cyan"
                    size="sm"
                    disabled={feedbackSaving}
                  />
                  <NeonButton
                    label={feedbackSaving ? 'SAVING...' : 'NOT GREAT (2)'}
                    onPress={() => handleFeedback(2)}
                    variant="magenta"
                    size="sm"
                    disabled={feedbackSaving}
                  />
                </View>
              </View>
            </NeonPanel>
          )}

          {!isMatched && (
            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11, textAlign: 'center' }}>
              This is a prototype of the real daily matching engine. In production it loads eligible members (onboarded + verified + active membership + queued) and only creates the trip when the exact 5+5 threshold is met for a city + dates.
            </Text>
          )}
        </ScrollView>

        {isMatched && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            <Pressable onPress={handleReset} style={{ paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11, fontWeight: '600' }}>
                Reset demo matching state
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SynthwaveBackground>
  );
}
