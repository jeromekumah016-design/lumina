import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';
import { ARCHETYPE_INFO, questionnaireService } from '../services/questionnaireService';
import { Archetype } from '../types/questionnaire';
import { RETRO_THEME_ENABLED, RETRO_COLORS, RETRO_FONT } from '../theme/retro';
import { SynthwaveBackground } from '../components/retro/SynthwaveBackground';
import { NeonCard } from '../components/retro/NeonCard';
import { NeonButton } from '../components/retro/NeonButton';
import { NeonPanel } from '../components/retro/NeonPanel';
import { NeonHeader } from '../components/retro/NeonHeader';

const GROUP = [
  { name: 'Emma',   role: 'Woman', avatar: 'https://i.pravatar.cc/32?img=28' },
  { name: 'Olivia', role: 'Woman', avatar: 'https://i.pravatar.cc/32?img=29' },
  { name: 'Liam',   role: 'Man',   avatar: 'https://i.pravatar.cc/32?img=12' },
];

export default function Profile() {
  const { onboarded, membership, matching, resetAllDemoData, isLoading } = useLuminaState();
  const [archetype, setArchetype] = useState<Archetype | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const saved = await questionnaireService.getSaved();
          if (active) setArchetype(saved?.result.archetype ?? null);
        } catch (e) {
          console.warn('Failed to load archetype', e);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  const member = membership?.hasActiveMembership;
  const matchStatus = matching?.status;
  const archetypeInfo = archetype ? ARCHETYPE_INFO[archetype] : null;

  const handleReset = async () => {
    await resetAllDemoData();
    Alert.alert('Reset complete', 'Demo data cleared. Restart the flow from Feed or Profile.');
  };

  if (!RETRO_THEME_ENABLED) {
    return (
      <ScrollView className="flex-1 bg-retro-cream px-4 pt-12">
        <View className="flex-row items-center">
          <Text className="text-2xl font-extrabold tracking-tight text-retro-ink">Your Profile</Text>
          <Text className="text-retro-amber ml-1">✦</Text>
        </View>
        <Text className="text-retro-dark">
          {matchStatus === 'matched' ? '11 friends matched' : member ? 'Active member' : 'Complete onboarding to get started'}
        </Text>

        <View className="mt-5 mb-2">
          <Text className="text-xs uppercase tracking-widest font-bold text-retro-dark mb-1.5">Your Lumina journey</Text>
          <View className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-3 flex-row flex-wrap gap-2">
            <View className={`px-2.5 py-1 rounded-full border border-black ${onboarded ? 'bg-emerald-100' : 'bg-white'}`}>
              <Text className={`text-[10px] font-bold ${onboarded ? 'text-emerald-800' : 'text-retro-dark'}`}>Onboarded {onboarded ? '✓' : ''}</Text>
            </View>
            <View className={`px-2.5 py-1 rounded-full border border-black ${member ? 'bg-emerald-100' : 'bg-white'}`}>
              <Text className={`text-[10px] font-bold ${member ? 'text-emerald-800' : 'text-retro-dark'}`}>Member {member ? '✓' : ''}</Text>
            </View>
            <View className={`px-2.5 py-1 rounded-full border border-black ${matchStatus === 'matched' ? 'bg-emerald-100' : matchStatus === 'queued' ? 'bg-sky-100' : 'bg-white'}`}>
              <Text className={`text-[10px] font-bold ${matchStatus === 'matched' ? 'text-emerald-800' : 'text-retro-dark'}`}>
                {matchStatus === 'matched' ? 'Matched ✓' : matchStatus === 'queued' ? 'In queue' : 'Not queued'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/questionnaire' as any)}
          className="mb-4 bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-3 flex-row items-center"
        >
          <Ionicons name={archetypeInfo ? 'sparkles' : 'help-circle-outline'} size={18} color="#0284C8" />
          <View className="flex-1 ml-2">
            {archetypeInfo ? (
              <>
                <Text className="text-xs font-bold text-retro-ink">{archetypeInfo.title}</Text>
                <Text className="text-[10px] text-retro-dark">{archetypeInfo.tagline}</Text>
              </>
            ) : (
              <Text className="text-xs font-bold text-retro-ink">Take the travel archetype quiz</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={14} color="#6F6256" />
        </Pressable>

        <View className="flex-row gap-2 mb-4">
          <Pressable onPress={() => router.push('/onboarding' as any)} className="flex-1 bg-retro-paper border-2 border-black shadow-retro-sm py-2 rounded-xl items-center">
            <Text className="text-xs font-bold text-retro-ink">Complete Onboarding</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/subscribe' as any)} className="flex-1 bg-retro-paper border-2 border-black shadow-retro-sm py-2 rounded-xl items-center">
            <Text className="text-xs font-bold text-retro-ink">Manage Membership</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/matching' as any)} className="flex-1 bg-retro-paper border-2 border-black shadow-retro-sm py-2 rounded-xl items-center">
            <Text className="text-xs font-bold text-retro-ink">Matching Status</Text>
          </Pressable>
        </View>

        <View className="mt-2 mb-3 flex-row items-center justify-between">
          <Text className="font-extrabold text-retro-ink">Your Group (5 women + 5 men)</Text>
          <View className="bg-sky-100 border border-black px-2 py-0.5 rounded-full">
            <Text className="text-[10px] text-retro-ink font-bold">Matched</Text>
          </View>
        </View>
        {GROUP.map((g, i) => (
          <Pressable
            key={i}
            onPress={() => router.push('/matching' as any)}
            className="flex-row items-center mb-2.5 bg-retro-paper border-2 border-black shadow-retro-sm rounded-xl p-2"
          >
            <Image source={{ uri: g.avatar }} className="w-8 h-8 rounded-full mr-3 border border-black" />
            <View className="flex-1">
              <Text className="font-bold text-retro-ink">{g.name}</Text>
              <Text className="text-[11px] text-retro-dark">{g.role}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6F6256" />
          </Pressable>
        ))}
        <Text className="text-[11px] text-retro-dark mt-3 text-center">Full group + chat in Game. Badges &amp; settings coming soon.</Text>

        <Pressable onPress={() => router.push('/cycles' as any)} className="mt-3 flex-row items-center justify-center opacity-60">
          <Text className="text-retro-amber text-[10px] mr-1">✦</Text>
          <Text className="text-[10px] text-retro-dark underline">Alumni Lumina cycles</Text>
          <Ionicons name="chevron-forward" size={11} color="#8A7A6E" />
        </Pressable>

        <View className="mt-8 mb-4">
          <Pressable onPress={handleReset} className="bg-white border-2 border-black py-2.5 rounded-xl items-center">
            <Text className="text-xs text-retro-ink font-bold">Reset All Demo Data (onboard, membership, votes, etc.)</Text>
          </Pressable>
        </View>
        <View className="h-8" />
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
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <NeonHeader title="YOUR PROFILE" />
          <Text style={{ color: RETRO_COLORS.neonMagenta, fontSize: 18, marginLeft: 6 }}>✦</Text>
        </View>
        <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: RETRO_FONT.labelSize, marginBottom: 18 }}>
          {matchStatus === 'matched' ? '11 friends matched' : member ? 'Active member' : 'Complete onboarding to get started'}
        </Text>

        {/* Journey status */}
        <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
          Your Lumina Journey
        </Text>
        <NeonCard variant="cyan" style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: `Onboarded${onboarded ? ' ✓' : ''}`, active: !!onboarded },
              { label: `Member${member ? ' ✓' : ''}`, active: !!member },
              {
                label: matchStatus === 'matched' ? 'Matched ✓' : matchStatus === 'queued' ? 'In Queue' : 'Not Queued',
                active: matchStatus === 'matched' || matchStatus === 'queued',
              },
            ].map((pill, i) => (
              <View
                key={i}
                style={{
                  paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: pill.active ? RETRO_COLORS.neonGreen : RETRO_COLORS.textMuted,
                  backgroundColor: pill.active ? 'rgba(0,80,30,0.4)' : 'rgba(10,0,32,0.5)',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: pill.active ? RETRO_COLORS.neonGreen : RETRO_COLORS.textMuted }}>
                  {pill.label}
                </Text>
              </View>
            ))}
          </View>
        </NeonCard>

        {/* Archetype card */}
        <Pressable onPress={() => router.push('/questionnaire' as any)}>
          <NeonCard variant="magenta" style={{ marginBottom: 14, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={archetypeInfo ? 'sparkles' : 'help-circle-outline'}
              size={18}
              color={RETRO_COLORS.neonMagenta}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              {archetypeInfo ? (
                <>
                  <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '800', fontSize: 13 }}>{archetypeInfo.title}</Text>
                  <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 10 }}>{archetypeInfo.tagline}</Text>
                </>
              ) : (
                <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '700', fontSize: 12 }}>
                  Take the travel archetype quiz
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={14} color={RETRO_COLORS.neonMagenta} />
          </NeonCard>
        </Pressable>

        {/* Quick action buttons */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
          {[
            { label: 'ONBOARD', route: '/onboarding' },
            { label: 'MEMBERSHIP', route: '/subscribe' },
            { label: 'MATCHING', route: '/matching' },
          ].map((btn, i) => (
            <NeonButton
              key={i}
              label={btn.label}
              onPress={() => router.push(btn.route as any)}
              variant={i === 0 ? 'cyan' : i === 1 ? 'magenta' : 'cyan'}
              size="sm"
              style={{ flex: 1 }}
            />
          ))}
        </View>

        {/* Group members */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '800', fontSize: 13 }}>
            Your Group (5 women + 5 men)
          </Text>
          <View style={{
            paddingHorizontal: 8, paddingVertical: 3,
            borderRadius: 999,
            borderWidth: 1.5, borderColor: RETRO_COLORS.neonCyan,
            backgroundColor: 'rgba(0,20,60,0.5)',
          }}>
            <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 10, fontWeight: '700' }}>Matched</Text>
          </View>
        </View>

        {GROUP.map((g, i) => (
          <Pressable key={i} onPress={() => router.push('/matching' as any)}>
            <NeonCard
              variant={i % 2 === 0 ? 'magenta' : 'cyan'}
              style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <Image
                source={{ uri: g.avatar }}
                style={{ width: 32, height: 32, borderRadius: 16, marginRight: 12, borderWidth: 1.5, borderColor: RETRO_COLORS.neonCyan }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>{g.name}</Text>
                <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 11 }}>{g.role}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={RETRO_COLORS.neonCyan} />
            </NeonCard>
          </Pressable>
        ))}

        <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
          Full group + chat in Game. Badges &amp; settings coming soon.
        </Text>

        {/* Alumni entry */}
        <Pressable
          onPress={() => router.push('/cycles' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: 0.6, marginTop: 14 }}
        >
          <Text style={{ color: RETRO_COLORS.neonMagenta, fontSize: 10, marginRight: 4 }}>✦</Text>
          <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 10, textDecorationLine: 'underline' }}>
            Alumni Lumina cycles
          </Text>
          <Ionicons name="chevron-forward" size={11} color={RETRO_COLORS.textMuted} />
        </Pressable>

        {/* Reset */}
        <View style={{ marginTop: 32, marginBottom: 12 }}>
          <NeonButton
            label="RESET ALL DEMO DATA"
            onPress={handleReset}
            variant="magenta"
            size="sm"
            fullWidth
          />
        </View>
      </ScrollView>
    </SynthwaveBackground>
  );
}
