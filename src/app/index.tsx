import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';
import { RETRO_THEME_ENABLED, RETRO_COLORS, RETRO_FONT } from '../theme/retro';
import { SynthwaveBackground } from '../components/retro/SynthwaveBackground';
import { NeonCard } from '../components/retro/NeonCard';
import { NeonButton } from '../components/retro/NeonButton';
import { NeonPanel } from '../components/retro/NeonPanel';
import { NeonHeader } from '../components/retro/NeonHeader';

const CITIES = [
  { name: 'Chicago', desc: 'Midwest charm, urban adventures', members: 10 },
  { name: 'New York', desc: 'Big city energy, iconic views', members: 10 },
  { name: 'Atlanta', desc: 'Southern hospitality, green escapes', members: 10 },
];

export default function Feed() {
  const { onboarded, membership, matching, isLoading, accountStub, agreementStatus, pledgeStatus } = useLuminaState();

  const member = membership?.hasActiveMembership;
  const matched = matching?.status === 'matched';

  // Gate: route new users through intro → signup → agreement → pledge before the main app.
  useEffect(() => {
    if (isLoading) return;
    if (!accountStub) { router.replace('/intro' as any); return; }
    if (!agreementStatus?.accepted) { router.replace('/user-agreement' as any); return; }
    if (!pledgeStatus?.accepted) { router.replace('/conduct-pledge' as any); return; }
  }, [isLoading, accountStub, agreementStatus, pledgeStatus]);

  if (!RETRO_THEME_ENABLED) {
    return (
      <ScrollView className="flex-1 bg-retro-cream px-4 pt-12">
        <View className="flex-row items-center">
          <Text className="text-3xl font-extrabold tracking-tight text-retro-ink">Lumina</Text>
          <Text className="text-retro-amber text-lg ml-0.5 -mt-0.5">✦</Text>
        </View>
        <Text className="text-retro-dark mt-1">Curated small-group travel for platonic friendships.</Text>

        <View className="mt-4 bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-3 flex-row items-center">
          <View className="flex-1">
            <Text className="text-sm font-bold text-retro-ink">{matched ? 'You\'re matched for a trip!' : member ? 'Member • Ready to match' : 'Complete onboarding & subscribe to get matched'}</Text>
            <Text className="text-xs text-retro-dark">5 men + 5 women groups • weekend getaways</Text>
          </View>
          <Pressable onPress={() => router.push((matched ? '/matching' : '/onboarding') as any)} className="bg-retro-blue border-2 border-black px-3 py-1.5 rounded-full">
            <Text className="text-white text-xs font-bold">{matched ? 'View matching' : 'Get started'}</Text>
          </Pressable>
        </View>

        {!onboarded || !member ? (
          <View className="mt-3 bg-amber-100 border-2 border-black shadow-retro-sm rounded-2xl p-4">
            <Text className="font-extrabold text-retro-ink">Unlock the full Lumina experience</Text>
            <Text className="text-sm text-retro-dark mt-1">Onboard + subscribe to join the matching queue and vote in the Game with your group.</Text>
            <Pressable onPress={() => router.push('/onboarding' as any)} className="mt-3 bg-retro-ink border-2 border-black self-start px-4 py-1.5 rounded-full">
              <Text className="text-white text-xs font-bold">Start Onboarding</Text>
            </Pressable>
          </View>
        ) : null}

        <Text className="text-xs uppercase tracking-widest font-bold text-retro-dark mt-6 mb-3">Upcoming City Experiences</Text>
        {CITIES.map((c, i) => (
          <Pressable
            key={i}
            onPress={() => router.push('/game' as any)}
            className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-4 mb-3 flex-row items-center"
          >
            <View className="flex-1">
              <Text className="font-extrabold text-lg text-retro-ink">{c.name}</Text>
              <Text className="text-retro-dark text-sm mt-0.5">{c.desc}</Text>
              <View className="flex-row items-center mt-1.5">
                <Ionicons name="people-outline" size={12} color="#6F6256" />
                <Text className="text-xs text-retro-dark ml-1">{c.members} friends • 3 days</Text>
              </View>
            </View>
            <View className="bg-retro-blue border-2 border-black rounded-full p-2">
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </View>
          </Pressable>
        ))}

        <View className="mt-2 bg-sky-100 border-2 border-black rounded-xl p-3">
          <Text className="text-[12px] font-semibold text-retro-ink text-center">Tap the <Text className="font-extrabold">Game</Text> tab to vote on properties for the next trip.</Text>
        </View>
        <View className="h-20" />
      </ScrollView>
    );
  }

  // ── Retro synthwave render ──────────────────────────────────────────────────
  return (
    <SynthwaveBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 52, paddingBottom: 100 }}
      >
        {/* Header — neon "LUMINA" wordmark */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text style={{
            fontSize: 34,
            fontWeight: '900',
            fontStyle: 'italic',
            color: RETRO_COLORS.neonPink,
            letterSpacing: 5,
            textShadowColor: RETRO_COLORS.neonPink,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 16,
          }}>
            LUMINA
          </Text>
          <Text style={{
            color: RETRO_COLORS.neonYellow,
            fontSize: 22,
            marginLeft: 6,
            textShadowColor: RETRO_COLORS.neonYellow,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 10,
          }}>✦</Text>
        </View>
        <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: RETRO_FONT.labelSize, marginBottom: 16, letterSpacing: 0.5 }}>
          Curated small-group travel for platonic friendships.
        </Text>

        {/* Status / entry card */}
        <NeonCard variant="cyan" style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '700', fontSize: 13, marginBottom: 2 }}>
                {matched ? 'You\'re matched for a trip!' : member ? 'Member · Ready to match' : 'Complete onboarding & subscribe to get matched'}
              </Text>
              <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 11 }}>
                5 men + 5 women groups · weekend getaways
              </Text>
            </View>
            <NeonButton
              label={matched ? 'VIEW MATCH' : 'GET STARTED'}
              onPress={() => router.push((matched ? '/matching' : '/onboarding') as any)}
              variant="cyan"
              size="sm"
              style={{ marginLeft: 10 }}
            />
          </View>
        </NeonCard>

        {/* Gate prompt */}
        {(!onboarded || !member) && (
          <NeonPanel variant="warning" style={{ marginBottom: 16 }}>
            <Text style={{ color: RETRO_COLORS.neonOrange, fontWeight: '800', fontSize: 13, letterSpacing: 1, marginBottom: 4 }}>
              UNLOCK THE FULL LUMINA EXPERIENCE
            </Text>
            <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, marginBottom: 10 }}>
              Onboard + subscribe to join the matching queue and vote in the Game with your group.
            </Text>
            <NeonButton
              label="START ONBOARDING"
              onPress={() => router.push('/onboarding' as any)}
              variant="magenta"
              size="sm"
            />
          </NeonPanel>
        )}

        {/* City section label — neon */}
        <Text style={{
          color: RETRO_COLORS.neonCyan,
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 10,
          marginTop: 4,
          textShadowColor: RETRO_COLORS.neonCyan,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 6,
        }}>
          — UPCOMING CITY EXPERIENCES —
        </Text>

        {/* City cards */}
        {CITIES.map((c, i) => (
          <Pressable key={i} onPress={() => router.push('/game' as any)}>
            <NeonCard
              variant={i % 2 === 0 ? 'magenta' : 'cyan'}
              style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: i % 2 === 0 ? RETRO_COLORS.neonMagenta : RETRO_COLORS.neonCyan,
                  fontWeight: '900',
                  fontSize: 16,
                  letterSpacing: 1.5,
                  textShadowColor: i % 2 === 0 ? RETRO_COLORS.neonMagenta : RETRO_COLORS.neonCyan,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 8,
                }}>
                  {c.name.toUpperCase()}
                </Text>
                <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>{c.desc}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Ionicons name="people-outline" size={12} color={RETRO_COLORS.neonCyan} />
                  <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 11, marginLeft: 4 }}>
                    {c.members} friends · 3 days
                  </Text>
                </View>
              </View>
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: RETRO_COLORS.keepBg,
                borderWidth: 2, borderColor: RETRO_COLORS.neonCyan,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="chevron-forward" size={16} color={RETRO_COLORS.neonCyan} />
              </View>
            </NeonCard>
          </Pressable>
        ))}

        {/* Tip */}
        <NeonPanel variant="info">
          <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, textAlign: 'center' }}>
            Tap the <Text style={{ color: RETRO_COLORS.neonCyan, fontWeight: '700' }}>Game</Text> tab to vote on properties for the next trip.
          </Text>
        </NeonPanel>
      </ScrollView>
    </SynthwaveBackground>
  );
}
