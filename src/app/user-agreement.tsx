import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';
import { RETRO_THEME_ENABLED, RETRO_COLORS } from '../theme/retro';
import { SynthwaveBackground } from '../components/retro/SynthwaveBackground';
import { NeonCard } from '../components/retro/NeonCard';
import { NeonButton } from '../components/retro/NeonButton';
import { NeonPanel } from '../components/retro/NeonPanel';
import { NeonHeader } from '../components/retro/NeonHeader';
import { AGREEMENT_VERSION } from '../services/userService';

const AGREEMENT_TEXT = `LUMINA USER AGREEMENT
Version ${AGREEMENT_VERSION} · Effective upon acceptance

1. ABOUT LUMINA
Lumina is a membership-based social travel club. We organize curated small-group weekend getaways for platonic friendships. By creating an account, you agree to this agreement in full.

2. ELIGIBILITY
You must be at least 18 years of age to join Lumina. By accepting this agreement you confirm you are 18 or older and legally able to enter into binding agreements in your jurisdiction.

3. THE EXPERIENCE
Lumina trips are co-ed group weekends at shared vacation rentals. Groups consist of an equal 5 men + 5 women (10 members total), plus 1–2 Lumina handlers. You will be staying with people you have not met before. You must be comfortable with this arrangement to participate.

4. IDENTITY & BACKGROUND VERIFICATION
Before being eligible for matching, you must complete:
  (a) Government ID + selfie verification (via Persona); and
  (b) A standard criminal background check (via Checkr).
Lumina reserves the right to deny membership to any applicant who does not clear both checks.

5. CODE OF CONDUCT
You agree to treat all group members with dignity and respect at all times. Any behavior that is threatening, harassing, sexually inappropriate, or in violation of another member's consent will result in immediate removal from the trip and permanent ban from Lumina. You waive any claim to a refund in such circumstances.

6. NO RECORDING POLICY
In the current version of Lumina (v1), no filming, recording, streaming, or photographing of other members is permitted without their explicit per-occurrence consent. Any future media features will require explicit opt-in per trip.

7. PRIVACY
Your personal information (name, email, gender, city preference) is stored locally on your device in this demo version. In production, data will be stored securely and in accordance with applicable privacy laws. Your identity verification data is processed by our third-party providers (Persona, Checkr) under their respective privacy policies.

8. FEES & MEMBERSHIP
Lumina operates on a paid membership model. Membership fees are disclosed on the subscription screen and are subject to change. Membership auto-renews unless cancelled. Trip costs are separate from membership and are disclosed at the time of matching.

9. RELEASE OF LIABILITY
Lumina organizes and facilitates group travel but does not own or operate the vacation rentals used for trips. By participating, you release Lumina and its handlers from liability for personal injury, property loss, or interpersonal disputes arising from your participation, except to the extent caused by Lumina's own gross negligence or willful misconduct.

10. MODIFICATIONS
Lumina may update this agreement from time to time. Continued use of the platform after notification of material changes constitutes acceptance of the updated terms. You will be asked to re-accept any new version.

11. GOVERNING LAW
This agreement is governed by the laws of the State of Illinois. Any disputes shall be resolved by binding arbitration in Chicago, IL.

──────────────────────────────────
By tapping "I Agree" below, you confirm that:
  • You are 18 years of age or older.
  • You have read and understood this agreement.
  • You agree to be bound by its terms.
──────────────────────────────────`;

export default function UserAgreementScreen() {
  const router = useRouter();
  const { acceptAgreement } = useLuminaState();

  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const canAgree = scrolledToBottom && ageConfirmed;

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const atBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (atBottom && !scrolledToBottom) setScrolledToBottom(true);
  };

  const handleAgree = async () => {
    if (!canAgree) return;
    setSaving(true);
    try {
      await acceptAgreement();
      router.replace('/conduct-pledge' as any);
    } finally {
      setSaving(false);
    }
  };

  if (!RETRO_THEME_ENABLED) {
    return (
      <View className="flex-1 bg-retro-cream">
        <View className="pt-12 pb-3 px-4 bg-retro-cream border-b-2 border-black">
          <Pressable onPress={() => router.back()} className="p-1 -ml-1 mb-2">
            <Ionicons name="chevron-back" size={22} color="#64748B" />
          </Pressable>
          <Text className="font-extrabold text-retro-ink text-xl">User Agreement</Text>
          <Text className="text-retro-dark text-sm mt-1">Step 2 of 3 · Read & accept</Text>
        </View>
        {!scrolledToBottom && (
          <View className="bg-amber-50 border-b-2 border-black px-4 py-2 flex-row items-center">
            <Ionicons name="arrow-down-circle-outline" size={16} color="#92400e" />
            <Text className="text-amber-900 text-xs font-semibold ml-2">Scroll to read the full agreement</Text>
          </View>
        )}
        <ScrollView
          className="flex-1 px-4 py-4"
          onScroll={handleScroll}
          scrollEventThrottle={100}
        >
          <View className="bg-white border-2 border-black rounded-2xl p-4 mb-4">
            <Text className="text-retro-ink text-[12px] leading-relaxed font-mono">{AGREEMENT_TEXT}</Text>
          </View>
          <Pressable onPress={() => setAgeConfirmed(!ageConfirmed)}
            className="flex-row items-start bg-retro-paper border-2 border-black rounded-xl p-3 mb-6">
            <View className={`w-5 h-5 mt-0.5 rounded border-2 border-black mr-3 items-center justify-center ${ageConfirmed ? 'bg-retro-blue' : 'bg-white'}`}>
              {ageConfirmed && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
            <Text className="flex-1 text-[13px] text-retro-ink">I confirm I am 18 years of age or older and have read and understood this agreement.</Text>
          </Pressable>
        </ScrollView>
        <View className="px-4 pb-8 pt-3 border-t-2 border-black bg-retro-cream">
          {!scrolledToBottom && (
            <Text className="text-center text-xs text-retro-dark mb-2">↓ Scroll to the bottom first</Text>
          )}
          <Pressable onPress={handleAgree} disabled={!canAgree}
            className={`py-3.5 rounded-xl border-2 items-center ${canAgree ? 'bg-retro-blue border-black' : 'bg-gray-200 border-gray-300'}`}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <Text className={`font-bold ${canAgree ? 'text-white' : 'text-gray-400'}`}>I Agree →</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Retro synthwave render ──────────────────────────────────────────────────
  return (
    <SynthwaveBackground>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12,
          borderBottomWidth: 1.5, borderBottomColor: RETRO_COLORS.neonCyan,
          backgroundColor: 'rgba(10,0,32,0.9)',
        }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 10 }}>
            <Ionicons name="chevron-back" size={22} color={RETRO_COLORS.neonCyan} />
          </Pressable>
          <NeonHeader title="USER AGREEMENT" subtitle="Step 2 of 3 · Read & accept" />
        </View>

        {/* Scroll hint */}
        {!scrolledToBottom && (
          <View style={{
            backgroundColor: 'rgba(40,20,0,0.7)',
            borderBottomWidth: 1.5, borderBottomColor: RETRO_COLORS.neonOrange,
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 8,
          }}>
            <Ionicons name="arrow-down-circle-outline" size={16} color={RETRO_COLORS.neonOrange} />
            <Text style={{ color: RETRO_COLORS.neonOrange, fontSize: 11, fontWeight: '700', marginLeft: 8 }}>
              Scroll to read the full agreement
            </Text>
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          onScroll={handleScroll}
          scrollEventThrottle={100}
        >
          {/* Agreement text */}
          <NeonCard variant="cyan" style={{ marginBottom: 16 }}>
            <Text style={{
              color: RETRO_COLORS.textPrimary,
              fontSize: 12, lineHeight: 19,
              fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
            }}>
              {AGREEMENT_TEXT}
            </Text>
          </NeonCard>

          {/* Age + read confirmation checkbox */}
          <Pressable
            onPress={() => setAgeConfirmed(!ageConfirmed)}
            style={{
              flexDirection: 'row', alignItems: 'flex-start',
              backgroundColor: 'rgba(10,0,32,0.6)',
              borderWidth: 1.5,
              borderColor: ageConfirmed ? RETRO_COLORS.neonGreen : RETRO_COLORS.textMuted,
              borderRadius: 10, padding: 12, marginBottom: 20,
            }}
          >
            <View style={{
              width: 20, height: 20, marginTop: 2, borderRadius: 4,
              borderWidth: 2,
              borderColor: ageConfirmed ? RETRO_COLORS.neonGreen : RETRO_COLORS.textMuted,
              backgroundColor: ageConfirmed ? 'rgba(0,60,20,0.6)' : 'transparent',
              marginRight: 12, alignItems: 'center', justifyContent: 'center',
            }}>
              {ageConfirmed && <Ionicons name="checkmark" size={13} color={RETRO_COLORS.neonGreen} />}
            </View>
            <Text style={{ flex: 1, color: RETRO_COLORS.textPrimary, fontSize: 13, lineHeight: 19 }}>
              I confirm I am 18 years of age or older and have read and understood this agreement.
            </Text>
          </Pressable>
        </ScrollView>

        {/* Footer CTA */}
        <View style={{
          paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12,
          borderTopWidth: 1.5, borderTopColor: RETRO_COLORS.neonCyan,
          backgroundColor: 'rgba(10,0,32,0.9)',
        }}>
          {!scrolledToBottom && (
            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 8 }}>
              ↓ Scroll to the bottom first
            </Text>
          )}
          {saving ? (
            <ActivityIndicator color={RETRO_COLORS.neonCyan} style={{ padding: 14 }} />
          ) : (
            <NeonButton
              label="I AGREE →"
              onPress={handleAgree}
              variant="cyan"
              size="lg"
              fullWidth
              disabled={!canAgree}
            />
          )}
        </View>
      </View>
    </SynthwaveBackground>
  );
}

