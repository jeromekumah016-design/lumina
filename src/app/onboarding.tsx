import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { userService, Gender } from '../services/userService';
import { useLuminaState } from '../context/LuminaContext';
import { RETRO_THEME_ENABLED, RETRO_COLORS, RETRO_FONT } from '../theme/retro';
import { SynthwaveBackground } from '../components/retro/SynthwaveBackground';
import { NeonCard } from '../components/retro/NeonCard';
import { NeonButton } from '../components/retro/NeonButton';
import { NeonPanel } from '../components/retro/NeonPanel';

const STEPS = ['welcome', 'profile', 'agreements', 'verify', 'complete'] as const;
type Step = typeof STEPS[number];

const CITIES = ['Chicago', 'New York', 'Atlanta'] as const;

const REQUIRED_AGREEMENTS = [
  { key: 'coedTrip', label: 'I understand this is a co-ed group weekend getaway (5 men + 5 women + 1-2 handlers) at a shared vacation rental with other members (strangers).' },
  { key: 'conduct', label: 'I have read and agree to the Code of Conduct, house rules, and consent policies.' },
  { key: 'safety', label: 'I consent to ID verification (Persona) and background check (Checkr). I understand I cannot be matched until both clear.' },
  { key: 'noRecording', label: 'I understand there is no filming, recording, or streaming of members in v1. Any future media requires explicit per-trip opt-in.' },
  { key: 'privacy', label: 'I agree to the privacy policy and photo/release guidelines for the trip.' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding: contextCompleteOnboarding } = useLuminaState();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [stepIndex, setStepIndex] = useState(0);

  const [name, setName] = useState('Alex Rivera');
  const [age, setAge] = useState('28');
  const [ageError, setAgeError] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender>('MALE');
  const [preferredCity, setPreferredCity] = useState<'Chicago' | 'New York' | 'Atlanta'>('Chicago');
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const [idVerified, setIdVerified] = useState(false);
  const [bgVerified, setBgVerified] = useState(false);
  const [verifying, setVerifying] = useState<'id' | 'bg' | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const goToStep = (idx: number) => {
    setStepIndex(idx);
    setCurrentStep(STEPS[idx]);
  };
  const next = () => goToStep(Math.min(stepIndex + 1, STEPS.length - 1));
  const back = () => goToStep(Math.max(stepIndex - 1, 0));

  useEffect(() => {
    (async () => {
      try {
        const profile = await userService.getProfile();
        if (profile) {
          setName(profile.name);
          setGender(profile.gender);
          setPreferredCity(profile.preferredCity as any);
          setAge(String(profile.age));
        }
      } catch {}
    })();
  }, []);

  const toggleAgreement = (key: string) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allAgreementsChecked = REQUIRED_AGREEMENTS.every((a) => agreements[a.key]);

  const validateAge = (val: string): string | null => {
    const n = parseInt(val, 10);
    if (isNaN(n) || val.trim() === '') return 'Please enter a valid age.';
    if (n < 18) return 'You must be at least 18 to join Lumina.';
    if (n > 99) return 'Please enter a valid age.';
    return null;
  };

  const handleAgeChange = (val: string) => {
    setAge(val);
    setAgeError(validateAge(val));
  };

  const simulateVerify = async (type: 'id' | 'bg') => {
    setVerifying(type);
    await new Promise((r) => setTimeout(r, 850));
    if (type === 'id') setIdVerified(true);
    else setBgVerified(true);
    setVerifying(null);
  };

  const handleComplete = async () => {
    if (!allAgreementsChecked || !idVerified || !bgVerified) return;
    const ageVal = parseInt(age, 10);
    if (isNaN(ageVal)) return;
    setCompleting(true);
    try {
      await contextCompleteOnboarding({
        name: name.trim() || 'New Member',
        gender,
        age: ageVal,
        preferredCity,
      });
      setCompleted(true);
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setCompleting(false);
    }
  };

  const goToSubscribe = () => router.push('/subscribe' as any);
  const goBackToApp = () => router.back();
  const goToIntroBot = () => router.push('/intro-bot' as any);
  const goToQuestionnaire = () => router.push('/questionnaire' as any);

  const canGoNext = () => {
    if (currentStep === 'profile') return name.trim().length > 1 && age.length > 0 && !ageError;
    if (currentStep === 'agreements') return allAgreementsChecked;
    if (currentStep === 'verify') return idVerified && bgVerified && allAgreementsChecked;
    return true;
  };

  // ── Classic render ─────────────────────────────────────────────────────────
  const renderClassicStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <View className="flex-1 px-4">
            <View className="items-center mt-6">
              <View className="flex-row items-center">
                <Text className="text-4xl font-extrabold tracking-tight text-retro-ink">Lumina</Text>
                <Text className="text-retro-amber text-2xl ml-1 -mt-1">✦</Text>
              </View>
              <Text className="text-retro-dark mt-1">Social travel, reimagined.</Text>
            </View>
            <Text className="mt-8 text-xl font-extrabold text-retro-ink text-center">
              Real friendships.{'\n'}Real weekends.{'\n'}In real life.
            </Text>
            <View className="mt-6 bg-sky-100 border-2 border-black shadow-retro-sm rounded-2xl p-4">
              <Text className="text-retro-ink text-[13px] leading-relaxed">
                Lumina is a paid membership social club that organizes small-group weekend getaways.
                Members are matched into curated groups of{' '}
                <Text className="font-semibold">an equal 5 men + 5 women (10 total)</Text> plus 1-2 handlers, and travel together to a booked vacation rental for the weekend.
              </Text>
              <Text className="text-retro-ink text-[12px] mt-2 font-semibold">
                Every member must clearly understand they are joining a co-ed, in-person group trip with other members (strangers) at a shared rental home.
              </Text>
            </View>
            <Text className="mt-6 text-center text-retro-dark text-xs">3 cities to start • Chicago, New York, Atlanta</Text>
            <Pressable onPress={goToIntroBot} className="mt-4 self-center bg-retro-ink border-2 border-black px-4 py-2 rounded-full">
              <Text className="text-white text-xs font-bold">Run intro signup bot</Text>
            </Pressable>
            <Pressable onPress={goToQuestionnaire} className="mt-2 self-center bg-retro-blue border-2 border-black px-4 py-2 rounded-full">
              <Text className="text-white text-xs font-bold">Take the travel archetype quiz</Text>
            </Pressable>
          </View>
        );
      case 'profile':
        return (
          <View className="flex-1 px-4">
            <Text className="text-lg font-extrabold text-retro-ink">Tell us about you</Text>
            <Text className="text-retro-dark text-sm mt-1">This helps us match you into the right group composition.</Text>
            <View className="mt-5">
              <Text className="text-xs uppercase tracking-widest text-retro-dark mb-1.5">YOUR NAME</Text>
              <TextInput value={name} onChangeText={setName} className="bg-white border-2 border-black rounded-xl shadow-retro-sm px-4 py-3 text-base" placeholder="Alex Rivera" />
            </View>
            <View className="mt-4">
              <Text className="text-xs uppercase tracking-widest text-retro-dark mb-1.5">AGE</Text>
              <TextInput value={age} onChangeText={handleAgeChange} keyboardType="number-pad" className="bg-white border-2 border-black rounded-xl shadow-retro-sm px-4 py-3 text-base w-24" />
              {ageError ? <Text className="text-xs text-red-500 mt-1">{ageError}</Text> : null}
            </View>
            <View className="mt-4">
              <Text className="text-xs uppercase tracking-widest text-retro-dark mb-2">GENDER (required for matching)</Text>
              <View className="flex-row gap-2">
                {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => (
                  <Pressable key={g} onPress={() => setGender(g)} className={`flex-1 py-3 rounded-xl border-2 border-black items-center ${gender === g ? 'bg-retro-blue shadow-retro-sm' : 'bg-retro-paper'}`}>
                    <Text className={`font-bold ${gender === g ? 'text-white' : 'text-retro-ink'}`}>{g === 'MALE' ? 'Man' : g === 'FEMALE' ? 'Woman' : 'Other'}</Text>
                  </Pressable>
                ))}
              </View>
              <Text className="text-[11px] text-gray-400 mt-1.5">Groups are formed as an equal 5 men + 5 women. Other may be counted toward either side or not eligible for fixed-ratio trips (disclosed at signup).</Text>
            </View>
            <View className="mt-4">
              <Text className="text-xs uppercase tracking-widest text-retro-dark mb-2">PREFERRED CITY</Text>
              <View className="flex-row gap-2">
                {CITIES.map((c) => (
                  <Pressable key={c} onPress={() => setPreferredCity(c)} className={`flex-1 py-3 rounded-full border-2 border-black items-center ${preferredCity === c ? 'bg-retro-blue shadow-retro-sm' : 'bg-retro-paper'}`}>
                    <Text className={`text-sm font-bold ${preferredCity === c ? 'text-white' : 'text-retro-ink'}`}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        );
      case 'agreements':
        return (
          <View className="flex-1 px-4">
            <Text className="text-lg font-extrabold text-retro-ink">Important agreements</Text>
            <Text className="text-sm text-retro-dark mt-1">Please read and check every box. This is a real co-ed group trip experience.</Text>
            <ScrollView className="mt-4" style={{ maxHeight: 380 }}>
              {REQUIRED_AGREEMENTS.map((item) => (
                <Pressable key={item.key} onPress={() => toggleAgreement(item.key)} className="flex-row items-start bg-retro-paper border-2 border-black shadow-retro-sm rounded-xl p-3 mb-2.5">
                  <View className={`w-5 h-5 mt-0.5 rounded border-2 border-black mr-3 items-center justify-center ${agreements[item.key] ? 'bg-retro-blue' : 'bg-white'}`}>
                    {agreements[item.key] && <Ionicons name="checkmark" size={14} color="white" />}
                  </View>
                  <Text className="flex-1 text-[13px] text-retro-ink leading-snug">{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text className="text-[11px] text-center text-gray-400 mt-3">You must complete ID + background verification before being eligible for matching.</Text>
          </View>
        );
      case 'verify':
        return (
          <View className="flex-1 px-4">
            <Text className="text-lg font-extrabold text-retro-ink">Safety &amp; verification</Text>
            <Text className="text-sm text-retro-dark mt-1">These steps protect everyone in the group.</Text>
            {!allAgreementsChecked ? (
              <View className="mt-3 bg-amber-100 border-2 border-black rounded-xl p-3">
                <Text className="text-xs text-retro-ink font-bold">⚠ Please go back and accept all agreements before completing verification.</Text>
              </View>
            ) : null}
            <View className="mt-6 space-y-3">
              {[
                { type: 'id' as const, icon: 'id-card-outline', label: 'Government ID + Selfie Verification', sub: 'Powered by Persona. Takes ~2 minutes.', verified: idVerified, btnLabel: idVerified ? '✓ Verified' : 'Start ID Verification' },
                { type: 'bg' as const, icon: 'shield-checkmark-outline', label: 'Background Check', sub: 'Powered by Checkr. Standard criminal + sex offender check.', verified: bgVerified, btnLabel: bgVerified ? '✓ Clear' : 'Run Background Check' },
              ].map((item) => (
                <View key={item.type} className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-4">
                  <View className="flex-row items-center">
                    <Ionicons name={item.icon as any} size={22} color="#0284C8" />
                    <Text className="ml-2 font-semibold">{item.label}</Text>
                  </View>
                  <Text className="text-xs text-retro-dark mt-1 ml-7">{item.sub}</Text>
                  <Pressable onPress={() => !item.verified && simulateVerify(item.type)} disabled={item.verified || verifying === item.type} className={`mt-3 ml-7 self-start px-4 py-2 rounded-full border-2 border-black ${item.verified ? 'bg-emerald-100' : 'bg-retro-blue'}`}>
                    {verifying === item.type ? <ActivityIndicator color="#fff" /> : (
                      <Text className={item.verified ? 'text-emerald-800 text-xs font-bold' : 'text-white text-xs font-bold'}>{item.btnLabel}</Text>
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
            <Text className="text-center text-[11px] text-gray-400 mt-6">You will not be matched into any group until both verifications are complete and clear.</Text>
          </View>
        );
      case 'complete':
        return (
          <View className="flex-1 px-4 items-center justify-center">
            {!completed ? (
              <>
                <Ionicons name="checkmark-circle" size={64} color="#0284C8" />
                <Text className="mt-4 text-2xl font-extrabold text-retro-ink">You're almost in.</Text>
                <Text className="text-center text-gray-600 mt-2">Review your info and finish onboarding.</Text>
                <View className="mt-6 w-full bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-4">
                  <Text className="text-sm"><Text className="text-retro-dark">Name:</Text> {name}</Text>
                  <Text className="text-sm mt-1"><Text className="text-retro-dark">Gender:</Text> {gender} · <Text className="text-retro-dark">Age:</Text> {age}</Text>
                  <Text className="text-sm mt-1"><Text className="text-retro-dark">Home city:</Text> {preferredCity}</Text>
                  <Text className="text-[11px] text-gray-400 mt-3">All agreements accepted • ID + BG verified</Text>
                </View>
                <Pressable onPress={handleComplete} disabled={completing || !allAgreementsChecked || !idVerified || !bgVerified} className="mt-6 bg-retro-ink w-full py-3.5 rounded-xl border-2 border-black shadow-retro items-center">
                  {completing ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-base">Join Lumina</Text>}
                </Pressable>
              </>
            ) : (
              <>
                <View className="items-center">
                  <View className="bg-emerald-100 rounded-full p-3">
                    <Ionicons name="checkmark-done" size={48} color="#10b981" />
                  </View>
                  <Text className="mt-4 text-2xl font-semibold">Welcome to Lumina, {name.split(' ')[0]}.</Text>
                  <Text className="text-center text-gray-600 mt-2">Onboarding complete. Next step: activate your membership to get placed in the matching queue.</Text>
                </View>
                <Pressable onPress={goToSubscribe} className="mt-8 bg-retro-blue w-full py-3.5 rounded-xl border-2 border-black shadow-retro items-center">
                  <Text className="text-white font-bold">Continue to Membership</Text>
                </Pressable>
                <Pressable onPress={goBackToApp} className="mt-3">
                  <Text className="text-retro-blue text-sm font-semibold">Back to app (you can subscribe later)</Text>
                </Pressable>
              </>
            )}
          </View>
        );
    }
  };

  if (!RETRO_THEME_ENABLED) {
    return (
      <View className="flex-1 bg-retro-cream">
        <View className="pt-12 pb-3 px-4 bg-retro-cream border-b-2 border-black">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.back()} className="p-1 -ml-1">
              <Ionicons name="chevron-back" size={22} color="#64748B" />
            </Pressable>
            <Text className="font-extrabold text-retro-ink">Lumina Onboarding</Text>
            <View style={{ width: 22 }} />
          </View>
          <View className="mt-3 h-2 bg-white border border-black rounded-full overflow-hidden">
            <View className="h-full bg-retro-blue" style={{ width: `${progress}%` }} />
          </View>
          <Text className="text-[10px] font-bold text-retro-dark mt-1 text-right">{stepIndex + 1} / {STEPS.length}</Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {renderClassicStep()}
        </ScrollView>

        {currentStep !== 'complete' && (
          <View className="px-4 pb-6 pt-2 border-t-2 border-black bg-retro-cream flex-row">
            {stepIndex > 0 && (
              <Pressable onPress={back} className="flex-1 mr-2 py-3 rounded-xl bg-retro-paper border-2 border-black items-center">
                <Text className="font-bold text-retro-ink">Back</Text>
              </Pressable>
            )}
            <Pressable onPress={next} disabled={!canGoNext()} className={`flex-1 py-3 rounded-xl border-2 items-center ${canGoNext() ? 'bg-retro-blue border-black shadow-retro-sm' : 'bg-gray-200 border-gray-300'}`}>
              <Text className={`font-bold ${canGoNext() ? 'text-white' : 'text-gray-400'}`}>
                {currentStep === 'verify' ? 'Finish & Review' : 'Continue'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  // ── Retro synthwave render ──────────────────────────────────────────────────
  const renderRetroStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <View style={{ alignItems: 'center', paddingHorizontal: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 36, fontWeight: '900', letterSpacing: 4,
                textShadowColor: RETRO_COLORS.neonCyan, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>
                LUMINA
              </Text>
              <Text style={{ color: RETRO_COLORS.neonMagenta, fontSize: 26, marginLeft: 6 }}>✦</Text>
            </View>
            <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 13, marginBottom: 24 }}>Social travel, reimagined.</Text>
            <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 }}>
              Real friendships.{'\n'}Real weekends.{'\n'}In real life.
            </Text>
            <NeonPanel variant="info" style={{ marginBottom: 16 }}>
              <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 13, lineHeight: 20 }}>
                Lumina is a paid membership social club that organizes small-group weekend getaways.
                Members are matched into curated groups of{' '}
                <Text style={{ color: RETRO_COLORS.neonYellow, fontWeight: '700' }}>an equal 5 men + 5 women (10 total)</Text>
                {' '}plus 1-2 handlers, and travel together to a booked vacation rental for the weekend.
              </Text>
              <Text style={{ color: RETRO_COLORS.neonOrange, fontSize: 12, marginTop: 8, fontWeight: '600' }}>
                Every member must clearly understand they are joining a co-ed, in-person group trip with strangers at a shared rental home.
              </Text>
            </NeonPanel>
            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11, textAlign: 'center' }}>
              3 cities to start · Chicago, New York, Atlanta
            </Text>
            <NeonButton
              label="RUN INTRO SIGNUP BOT"
              onPress={goToIntroBot}
              variant="magenta"
              size="sm"
              style={{ marginTop: 14 }}
            />
            <NeonButton
              label="TAKE THE ARCHETYPE QUIZ"
              onPress={goToQuestionnaire}
              variant="cyan"
              size="sm"
              style={{ marginTop: 10 }}
            />
          </View>
        );

      case 'profile':
        return (
          <View>
            <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 17, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>
              TELL US ABOUT YOU
            </Text>
            <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, marginBottom: 20 }}>
              This helps us match you into the right group composition.
            </Text>

            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Your Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Alex Rivera"
              placeholderTextColor={RETRO_COLORS.textMuted}
              style={{
                backgroundColor: 'rgba(10,0,32,0.8)',
                borderWidth: 1.5, borderColor: RETRO_COLORS.neonCyan,
                borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
                color: RETRO_COLORS.textPrimary, fontSize: 15, marginBottom: 14,
              }}
            />

            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Age</Text>
            <TextInput
              value={age}
              onChangeText={handleAgeChange}
              keyboardType="number-pad"
              placeholder="28"
              placeholderTextColor={RETRO_COLORS.textMuted}
              style={{
                backgroundColor: 'rgba(10,0,32,0.8)',
                borderWidth: 1.5, borderColor: ageError ? RETRO_COLORS.neonOrange : RETRO_COLORS.neonCyan,
                borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
                color: RETRO_COLORS.textPrimary, fontSize: 15, width: 100, marginBottom: 4,
              }}
            />
            {ageError ? <Text style={{ color: RETRO_COLORS.neonOrange, fontSize: 11, marginBottom: 14 }}>{ageError}</Text> : <View style={{ height: 14 }} />}

            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Gender (required for matching)</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 10,
                    borderWidth: 2,
                    borderColor: gender === g ? RETRO_COLORS.neonCyan : RETRO_COLORS.textMuted,
                    backgroundColor: gender === g ? RETRO_COLORS.keepBg : 'rgba(10,0,32,0.5)',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '700', color: gender === g ? RETRO_COLORS.neonCyan : RETRO_COLORS.textMuted, fontSize: 13 }}>
                    {g === 'MALE' ? 'Man' : g === 'FEMALE' ? 'Woman' : 'Other'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11, marginBottom: 20 }}>
              Groups are formed as an equal 5 men + 5 women. Other may not be eligible for fixed-ratio trips (disclosed at signup).
            </Text>

            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Preferred City</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CITIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setPreferredCity(c)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 20,
                    borderWidth: 2,
                    borderColor: preferredCity === c ? RETRO_COLORS.neonMagenta : RETRO_COLORS.textMuted,
                    backgroundColor: preferredCity === c ? RETRO_COLORS.elimBg : 'rgba(10,0,32,0.5)',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '700', color: preferredCity === c ? RETRO_COLORS.neonMagenta : RETRO_COLORS.textMuted, fontSize: 12 }}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      case 'agreements':
        return (
          <View>
            <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 17, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>
              IMPORTANT AGREEMENTS
            </Text>
            <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, marginBottom: 16 }}>
              Please read and check every box. This is a real co-ed group trip experience.
            </Text>
            {REQUIRED_AGREEMENTS.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => toggleAgreement(item.key)}
                style={{
                  flexDirection: 'row', alignItems: 'flex-start',
                  backgroundColor: 'rgba(10,0,32,0.6)',
                  borderWidth: 1.5,
                  borderColor: agreements[item.key] ? RETRO_COLORS.neonGreen : RETRO_COLORS.textMuted,
                  borderRadius: 10, padding: 12, marginBottom: 10,
                }}
              >
                <View style={{
                  width: 20, height: 20, marginTop: 2, borderRadius: 4,
                  borderWidth: 2,
                  borderColor: agreements[item.key] ? RETRO_COLORS.neonGreen : RETRO_COLORS.textMuted,
                  backgroundColor: agreements[item.key] ? 'rgba(0,60,20,0.6)' : 'transparent',
                  marginRight: 12, alignItems: 'center', justifyContent: 'center',
                }}>
                  {agreements[item.key] && <Ionicons name="checkmark" size={13} color={RETRO_COLORS.neonGreen} />}
                </View>
                <Text style={{ flex: 1, color: RETRO_COLORS.textPrimary, fontSize: 13, lineHeight: 19 }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
              You must complete ID + background verification before being eligible for matching.
            </Text>
          </View>
        );

      case 'verify':
        return (
          <View>
            <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 17, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>
              SAFETY &amp; VERIFICATION
            </Text>
            <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, marginBottom: 16 }}>
              These steps protect everyone in the group.
            </Text>
            {!allAgreementsChecked && (
              <NeonPanel variant="warning" style={{ marginBottom: 16 }}>
                <Text style={{ color: RETRO_COLORS.neonOrange, fontSize: 12, fontWeight: '700' }}>
                  ⚠ Please go back and accept all agreements before completing verification.
                </Text>
              </NeonPanel>
            )}
            {[
              { type: 'id' as const, icon: 'id-card-outline', label: 'Government ID + Selfie', sub: 'Powered by Persona. Takes ~2 minutes.', verified: idVerified, btnLabel: idVerified ? '✓ VERIFIED' : 'START ID VERIFICATION' },
              { type: 'bg' as const, icon: 'shield-checkmark-outline', label: 'Background Check', sub: 'Powered by Checkr. Standard criminal + sex offender check.', verified: bgVerified, btnLabel: bgVerified ? '✓ CLEAR' : 'RUN BACKGROUND CHECK' },
            ].map((item) => (
              <NeonCard key={item.type} variant={item.verified ? 'cyan' : 'magenta'} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name={item.icon as any} size={20} color={item.verified ? RETRO_COLORS.neonGreen : RETRO_COLORS.neonCyan} />
                  <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '700', fontSize: 14, marginLeft: 10 }}>{item.label}</Text>
                </View>
                <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 11, marginBottom: 12, marginLeft: 30 }}>{item.sub}</Text>
                {verifying === item.type ? (
                  <ActivityIndicator color={RETRO_COLORS.neonCyan} style={{ alignSelf: 'flex-start', marginLeft: 30 }} />
                ) : (
                  <NeonButton
                    label={item.btnLabel}
                    onPress={() => !item.verified && simulateVerify(item.type)}
                    variant={item.verified ? 'cyan' : 'magenta'}
                    size="sm"
                    disabled={item.verified}
                    style={{ alignSelf: 'flex-start', marginLeft: 30 }}
                  />
                )}
              </NeonCard>
            ))}
            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
              You will not be matched into any group until both verifications are complete and clear.
            </Text>
          </View>
        );

      case 'complete':
        return (
          <View style={{ alignItems: 'center', paddingHorizontal: 4 }}>
            {!completed ? (
              <>
                <View style={{
                  width: 72, height: 72, borderRadius: 36,
                  borderWidth: 2, borderColor: RETRO_COLORS.neonCyan,
                  backgroundColor: RETRO_COLORS.keepBg,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <Ionicons name="checkmark-circle" size={48} color={RETRO_COLORS.neonCyan} />
                </View>
                <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 22, fontWeight: '900', letterSpacing: 2, marginBottom: 6 }}>
                  YOU'RE ALMOST IN.
                </Text>
                <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
                  Review your info and finish onboarding.
                </Text>
                <NeonCard variant="cyan" style={{ width: '100%', marginBottom: 20 }}>
                  <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 13, marginBottom: 4 }}>
                    <Text style={{ color: RETRO_COLORS.textMuted }}>Name: </Text>{name}
                  </Text>
                  <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 13, marginBottom: 4 }}>
                    <Text style={{ color: RETRO_COLORS.textMuted }}>Gender: </Text>{gender}
                    {'  '}
                    <Text style={{ color: RETRO_COLORS.textMuted }}>Age: </Text>{age}
                  </Text>
                  <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 13, marginBottom: 8 }}>
                    <Text style={{ color: RETRO_COLORS.textMuted }}>Home city: </Text>{preferredCity}
                  </Text>
                  <Text style={{ color: RETRO_COLORS.neonGreen, fontSize: 11 }}>All agreements accepted · ID + BG verified</Text>
                </NeonCard>
                {completing ? (
                  <ActivityIndicator color={RETRO_COLORS.neonCyan} style={{ padding: 14 }} />
                ) : (
                  <NeonButton
                    label="JOIN LUMINA"
                    onPress={handleComplete}
                    variant="cyan"
                    size="lg"
                    fullWidth
                    disabled={completing || !allAgreementsChecked || !idVerified || !bgVerified}
                  />
                )}
              </>
            ) : (
              <>
                <View style={{
                  width: 80, height: 80, borderRadius: 40,
                  borderWidth: 2, borderColor: RETRO_COLORS.neonGreen,
                  backgroundColor: 'rgba(0,60,20,0.5)',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <Ionicons name="checkmark-done" size={48} color={RETRO_COLORS.neonGreen} />
                </View>
                <Text style={{ color: RETRO_COLORS.neonGreen, fontSize: 22, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 6 }}>
                  WELCOME, {name.split(' ')[0].toUpperCase()}.
                </Text>
                <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
                  Onboarding complete. Next step: activate your membership to get placed in the matching queue.
                </Text>
                <NeonButton
                  label="CONTINUE TO MEMBERSHIP"
                  onPress={goToSubscribe}
                  variant="cyan"
                  size="lg"
                  fullWidth
                  style={{ marginBottom: 14 }}
                />
                <Pressable onPress={goBackToApp}>
                  <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 13 }}>Back to app (you can subscribe later)</Text>
                </Pressable>
              </>
            )}
          </View>
        );
    }
  };

  return (
    <SynthwaveBackground>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12,
          borderBottomWidth: 1.5, borderBottomColor: RETRO_COLORS.neonCyan,
          backgroundColor: 'rgba(10,0,32,0.85)',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Pressable onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={RETRO_COLORS.neonCyan} />
            </Pressable>
            <Text style={{ color: RETRO_COLORS.neonCyan, fontWeight: '800', fontSize: 13, letterSpacing: 2 }}>
              LUMINA ONBOARDING
            </Text>
            <View style={{ width: 22 }} />
          </View>
          {/* Progress bar */}
          <View style={{
            height: 6, backgroundColor: 'rgba(10,0,32,0.8)',
            borderRadius: 3, overflow: 'hidden',
            borderWidth: 1, borderColor: RETRO_COLORS.neonCyan,
            marginBottom: 4,
          }}>
            <View style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: RETRO_COLORS.neonCyan,
              borderRadius: 3,
            }} />
          </View>
          <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700', textAlign: 'right' }}>
            {stepIndex + 1} / {STEPS.length}
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {renderRetroStep()}
        </ScrollView>

        {currentStep !== 'complete' && (
          <View style={{
            paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12,
            borderTopWidth: 1.5, borderTopColor: RETRO_COLORS.neonCyan,
            backgroundColor: 'rgba(10,0,32,0.9)',
            flexDirection: 'row', gap: 10,
          }}>
            {stepIndex > 0 && (
              <NeonButton
                label="BACK"
                onPress={back}
                variant="dark"
                size="md"
                style={{ flex: 1 }}
              />
            )}
            <NeonButton
              label={currentStep === 'verify' ? 'FINISH & REVIEW' : 'CONTINUE'}
              onPress={next}
              variant="cyan"
              size="md"
              disabled={!canGoNext()}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </View>
    </SynthwaveBackground>
  );
}
