import React, { useState } from 'react';
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

const PRICE = 39;

const BENEFITS = [
  'Access to curated 5M + 5F weekend trips',
  'Priority matching in your preferred city',
  'All lodging + activities included in trip fee',
  'Safety team (handlers + safety person) on every trip',
  'Post-trip reviews and incident support',
  'Community of members building real friendships',
];

export default function SubscribeScreen() {
  const router = useRouter();
  const { membership, subscribe: sharedSubscribe, refresh } = useLuminaState();
  const [loading, setLoading] = useState(false);

  const subscribed = membership?.hasActiveMembership;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      await sharedSubscribe();
    } finally {
      setLoading(false);
    }
  };

  const handleGoToMatching = () => {
    router.push('/matching' as any);
  };

  const handleCancel = async () => {
    await userService.cancelMembership();
    await refresh();
  };

  if (!RETRO_THEME_ENABLED) {
    return (
      <View className="flex-1 bg-retro-cream">
        <View className="pt-12 px-4 pb-3 bg-retro-cream border-b-2 border-black">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="p-1 -ml-1 mr-2">
              <Ionicons name="chevron-back" size={22} color="#1A1612" />
            </Pressable>
            <View>
              <View className="flex-row items-center">
                <Text className="text-2xl font-extrabold tracking-tight text-retro-ink">Lumina</Text>
                <Text className="text-retro-amber text-lg ml-0.5 -mt-0.5">✦</Text>
              </View>
              <Text className="text-sm text-retro-dark -mt-0.5">Membership</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 60 }}>
          {!subscribed ? (
            <>
              <Text className="text-3xl font-extrabold tracking-tight text-retro-ink">One membership.{'\n'}Real weekends.</Text>
              <Text className="mt-2 text-retro-dark">Join the club that gets you out of the house and into curated small-group travel with 10 other members.</Text>

              <View className="mt-6 bg-retro-paper border-2 border-black shadow-retro rounded-2xl p-5">
                <View className="flex-row items-baseline">
                  <Text className="text-5xl font-extrabold text-retro-ink">${PRICE}</Text>
                  <Text className="text-retro-dark ml-1">/mo</Text>
                </View>
                <Text className="text-sm text-retro-dark mt-0.5">Billed monthly. Cancel anytime.</Text>

                <View className="mt-5 pt-4 border-t-2 border-black">
                  {BENEFITS.map((b, i) => (
                    <View key={i} className="flex-row items-center mb-2.5">
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text className="ml-2 text-retro-ink text-[13px] font-medium">{b}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={handleSubscribe}
                  disabled={loading}
                  className="mt-6 bg-retro-blue py-3.5 rounded-xl border-2 border-black shadow-retro-sm items-center flex-row justify-center"
                >
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <Text className="text-white font-bold text-base">Subscribe for ${PRICE}/mo</Text>
                  )}
                </Pressable>

                <Text className="text-[10px] text-center text-retro-dark mt-3">
                  After subscribing you can join the matching queue for your city.
                </Text>
              </View>

              <View className="mt-5 bg-sky-100 border-2 border-black rounded-2xl p-4">
                <Text className="text-xs text-retro-ink">
                  <Text className="font-extrabold">Important:</Text> Your membership gives you access to be matched into groups of an equal 5 men + 5 women for weekend trips at shared rentals. This is a real in-person social experience with strangers.
                </Text>
              </View>
            </>
          ) : (
            <View className="items-center mt-4">
              <View className="bg-emerald-100 border-2 border-black rounded-full p-4">
                <Ionicons name="wallet" size={42} color="#10b981" />
              </View>
              <Text className="mt-4 text-2xl font-extrabold text-retro-ink">You're a Lumina member.</Text>
              <Text className="text-center text-retro-dark mt-1">Membership active since {membership?.subscribedAt ? new Date(membership.subscribedAt).toLocaleDateString() : 'today'}.</Text>

              <View className="mt-6 w-full bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-4">
                <Text className="font-extrabold text-retro-ink">What's next?</Text>
                <Text className="text-sm text-retro-dark mt-1">Join the queue for your city and get placed into a forming 5M + 5F group.</Text>
              </View>

              <Pressable onPress={handleGoToMatching} className="mt-4 w-full bg-retro-blue py-3.5 rounded-xl border-2 border-black shadow-retro items-center">
                <Text className="text-white font-bold">Go to Matching &amp; Queue</Text>
              </Pressable>

              <Pressable onPress={handleCancel} className="mt-3">
                <Text className="text-rose-600 text-sm font-semibold">Cancel membership (demo)</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {!subscribed && (
          <View className="px-4 pb-6">
            <Pressable onPress={() => router.back()} className="py-3 items-center">
              <Text className="text-retro-dark text-sm font-semibold">Maybe later</Text>
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
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <NeonHeader title="LUMINA" style={{ marginRight: 6 }} />
              <Text style={{ color: RETRO_COLORS.neonMagenta, fontSize: 18 }}>✦</Text>
            </View>
            <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>Membership</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          {!subscribed ? (
            <>
              <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 26, fontWeight: '900', letterSpacing: 1, marginBottom: 8 }}>
                One membership.{'\n'}Real weekends.
              </Text>
              <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 13, marginBottom: 20 }}>
                Join the club that gets you out of the house and into curated small-group travel with 10 other members.
              </Text>

              {/* Pricing card */}
              <NeonCard variant="gold" style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 }}>
                  <Text style={{ color: RETRO_COLORS.neonYellow, fontSize: 48, fontWeight: '900' }}>${PRICE}</Text>
                  <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 16, marginLeft: 6 }}>/mo</Text>
                </View>
                <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, marginBottom: 16 }}>
                  Billed monthly. Cancel anytime.
                </Text>

                <View style={{ borderTopWidth: 1, borderTopColor: RETRO_COLORS.neonYellow, opacity: 0.4, marginBottom: 14 }} />

                {BENEFITS.map((b, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Ionicons name="checkmark-circle" size={16} color={RETRO_COLORS.neonGreen} />
                    <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 13, marginLeft: 8, flex: 1 }}>{b}</Text>
                  </View>
                ))}

                <View style={{ marginTop: 16 }}>
                  {loading ? (
                    <View style={{ alignItems: 'center', padding: 14 }}>
                      <ActivityIndicator color={RETRO_COLORS.neonCyan} />
                    </View>
                  ) : (
                    <NeonButton
                      label={`SUBSCRIBE · $${PRICE}/MO`}
                      onPress={handleSubscribe}
                      variant="cyan"
                      size="lg"
                      fullWidth
                    />
                  )}
                </View>

                <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10, textAlign: 'center', marginTop: 10 }}>
                  After subscribing you can join the matching queue for your city.
                </Text>
              </NeonCard>

              <NeonPanel variant="warning">
                <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 12 }}>
                  <Text style={{ color: RETRO_COLORS.neonOrange, fontWeight: '800' }}>Important: </Text>
                  Your membership gives you access to be matched into groups of an equal 5 men + 5 women for weekend trips at shared rentals. This is a real in-person social experience with strangers.
                </Text>
              </NeonPanel>
            </>
          ) : (
            // Subscribed success state
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <View style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: 'rgba(0,60,20,0.5)',
                borderWidth: 2, borderColor: RETRO_COLORS.neonGreen,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="wallet" size={40} color={RETRO_COLORS.neonGreen} />
              </View>
              <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 22, fontWeight: '900', letterSpacing: 2, marginBottom: 6 }}>
                YOU'RE A LUMINA MEMBER.
              </Text>
              <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
                Membership active since {membership?.subscribedAt ? new Date(membership.subscribedAt).toLocaleDateString() : 'today'}.
              </Text>

              <NeonCard variant="cyan" style={{ width: '100%', marginBottom: 16 }}>
                <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '800', fontSize: 14, marginBottom: 6 }}>
                  What's next?
                </Text>
                <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 13 }}>
                  Join the queue for your city and get placed into a forming 5M + 5F group.
                </Text>
              </NeonCard>

              <NeonButton
                label="GO TO MATCHING & QUEUE"
                onPress={handleGoToMatching}
                variant="cyan"
                size="lg"
                fullWidth
                style={{ marginBottom: 14 }}
              />

              <Pressable onPress={handleCancel}>
                <Text style={{ color: RETRO_COLORS.neonMagenta, fontSize: 13, fontWeight: '600' }}>
                  Cancel membership (demo)
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {!subscribed && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            <Pressable onPress={() => router.back()} style={{ paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 14 }}>Maybe later</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SynthwaveBackground>
  );
}
