import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { userService, Gender } from '../services/userService';

/**
 * Onboarding flow for Lumina.
 * Multi-step: Welcome → Profile (name, age, gender, city) → Agreements (explicit 4M/7F disclosure) → Verify (stubs) → Complete.
 * Persists via userService. Matches app styling (blues, clean cards, ✦, NativeWind).
 * Critical: clearly states the co-ed small-group weekend trip format with fixed 4 men + 7 women composition.
 */

const STEPS = ['welcome', 'profile', 'agreements', 'verify', 'complete'] as const;
type Step = typeof STEPS[number];

const CITIES = ['Chicago', 'New York', 'Atlanta'] as const;

const REQUIRED_AGREEMENTS = [
  { key: 'coedTrip', label: 'I understand this is a co-ed group weekend getaway (4 men + 7 women + 1-2 handlers) at a shared vacation rental with other members (strangers).' },
  { key: 'conduct', label: 'I have read and agree to the Code of Conduct, house rules, and consent policies.' },
  { key: 'safety', label: 'I consent to ID verification (Persona) and background check (Checkr). I understand I cannot be matched until both clear.' },
  { key: 'noRecording', label: 'I understand there is no filming, recording, or streaming of members in v1. Any future media requires explicit per-trip opt-in.' },
  { key: 'privacy', label: 'I agree to the privacy policy and photo/release guidelines for the trip.' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [stepIndex, setStepIndex] = useState(0);

  // Profile fields
  const [name, setName] = useState('Alex Rivera');
  const [age, setAge] = useState('28');
  const [gender, setGender] = useState<Gender>('MALE');
  const [preferredCity, setPreferredCity] = useState<'Chicago' | 'New York' | 'Atlanta'>('Chicago');

  // Agreements
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});

  // Verify state
  const [idVerified, setIdVerified] = useState(false);
  const [bgVerified, setBgVerified] = useState(false);
  const [verifying, setVerifying] = useState<'id' | 'bg' | null>(null);

  // Complete state
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const goToStep = (idx: number) => {
    const nextStep = STEPS[idx];
    setStepIndex(idx);
    setCurrentStep(nextStep);
  };

  const next = () => {
    const nextIdx = Math.min(stepIndex + 1, STEPS.length - 1);
    goToStep(nextIdx);
  };

  const back = () => {
    const prevIdx = Math.max(stepIndex - 1, 0);
    goToStep(prevIdx);
  };

  // Load any existing draft
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

  const simulateVerify = async (type: 'id' | 'bg') => {
    setVerifying(type);
    // Fake network delay
    await new Promise((r) => setTimeout(r, 850));
    if (type === 'id') setIdVerified(true);
    else setBgVerified(true);
    setVerifying(null);
  };

  const handleComplete = async () => {
    if (!allAgreementsChecked || !idVerified || !bgVerified) return;
    setCompleting(true);
    try {
      await userService.completeOnboarding({
        name: name.trim() || 'New Member',
        gender,
        age: parseInt(age, 10) || 28,
        preferredCity,
      });
      setCompleted(true);
      // Small delay then allow continue
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setCompleting(false);
    }
  };

  const goToSubscribe = () => {
    router.push('/subscribe' as any);
  };

  const goBackToApp = () => {
    router.back(); // or router.replace('/(tabs)') but since flat, back is fine
    // In practice user can also use tabs
  };

  // Render current step content
  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <View className="flex-1 px-4">
            <View className="items-center mt-6">
              <View className="flex-row items-center">
                <Text className="text-4xl font-semibold text-[#1E40AF]">Lumina</Text>
                <Text className="text-[#F4C95F] text-2xl ml-1 -mt-1">✦</Text>
              </View>
              <Text className="text-retro-dark mt-1">Social travel, reimagined.</Text>
            </View>

            <Text className="mt-8 text-xl font-semibold text-[#0F172A] text-center">
              Real friendships.{'\n'}Real weekends.{'\n'}In real life.
            </Text>

            <View className="mt-6 bg-[#DBEAFE] rounded-2xl p-4">
              <Text className="text-[#0C4A6E] text-[13px] leading-relaxed">
                Lumina is a paid membership social club that organizes small-group weekend getaways.
                Members are matched into curated groups of <Text className="font-semibold">exactly 4 men + 7 women (11 total)</Text> plus 1-2 handlers,
                and travel together to a booked vacation rental for the weekend.
              </Text>
              <Text className="text-[#0C4A6E] text-[12px] mt-2 font-medium">
                Every member must clearly understand they are joining a co-ed, in-person group trip with other members (strangers) at a shared rental home.
              </Text>
            </View>

            <Text className="mt-6 text-center text-retro-dark text-xs">
              3 cities to start • Chicago, New York, Atlanta
            </Text>
          </View>
        );

      case 'profile':
        return (
          <View className="flex-1 px-4">
            <Text className="text-lg font-semibold text-[#0F172A]">Tell us about you</Text>
            <Text className="text-retro-dark text-sm mt-1">This helps us match you into the right group composition.</Text>

            <View className="mt-5">
              <Text className="text-xs uppercase tracking-widest text-retro-dark mb-1.5">YOUR NAME</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                className="bg-retro-cream border-4 border-black shadow-retro border border-gray-200 rounded-none border-4 border-black px-4 py-3 text-base"
                placeholder="Alex Rivera"
              />
            </View>

            <View className="mt-4">
              <Text className="text-xs uppercase tracking-widest text-retro-dark mb-1.5">AGE</Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                className="bg-retro-cream border-4 border-black shadow-retro border border-gray-200 rounded-none border-4 border-black px-4 py-3 text-base w-24"
              />
            </View>

            <View className="mt-4">
              <Text className="text-xs uppercase tracking-widest text-retro-dark mb-2">GENDER (required for matching)</Text>
              <View className="flex-row gap-2">
                {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGender(g)}
                    className={`flex-1 py-3 rounded-2xl border items-center ${gender === g ? 'bg-[#0284C8] border-[#0284C8]' : 'bg-retro-cream border-4 border-black shadow-retro border-gray-200'}`}
                  >
                    <Text className={`font-semibold ${gender === g ? 'text-white' : 'text-gray-700'}`}>
                      {g === 'MALE' ? 'Man' : g === 'FEMALE' ? 'Woman' : 'Other'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="text-[11px] text-gray-400 mt-1.5">
                Groups are formed as exactly 4 men + 7 women. Other may be counted toward the 7 or not eligible for fixed-ratio trips (disclosed at signup).
              </Text>
            </View>

            <View className="mt-4">
              <Text className="text-xs uppercase tracking-widest text-retro-dark mb-2">PREFERRED CITY</Text>
              <View className="flex-row gap-2">
                {CITIES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setPreferredCity(c)}
                    className={`flex-1 py-3 rounded-full items-center ${preferredCity === c ? 'bg-[#0284C8]' : 'bg-gray-100'}`}
                  >
                    <Text className={`text-sm font-medium ${preferredCity === c ? 'text-white' : 'text-gray-700'}`}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        );

      case 'agreements':
        return (
          <View className="flex-1 px-4">
            <Text className="text-lg font-semibold text-[#0F172A]">Important agreements</Text>
            <Text className="text-sm text-retro-dark mt-1">Please read and check every box. This is a real co-ed group trip experience.</Text>

            <ScrollView className="mt-4" style={{ maxHeight: 380 }}>
              {REQUIRED_AGREEMENTS.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => toggleAgreement(item.key)}
                  className="flex-row items-start bg-retro-cream border-4 border-black shadow-retro border border-gray-100 rounded-2xl p-3 mb-2.5"
                >
                  <View className={`w-5 h-5 mt-0.5 rounded border mr-3 items-center justify-center ${agreements[item.key] ? 'bg-[#0284C8] border-[#0284C8]' : 'border-gray-300'}`}>
                    {agreements[item.key] && <Ionicons name="checkmark" size={14} color="white" />}
                  </View>
                  <Text className="flex-1 text-[13px] text-gray-700 leading-snug">{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text className="text-[11px] text-center text-gray-400 mt-3">
              You must complete ID + background verification before being eligible for matching.
            </Text>
          </View>
        );

      case 'verify':
        return (
          <View className="flex-1 px-4">
            <Text className="text-lg font-semibold text-[#0F172A]">Safety &amp; verification</Text>
            <Text className="text-sm text-retro-dark mt-1">These steps protect everyone in the group.</Text>

            <View className="mt-6 space-y-3">
              {/* ID Verify */}
              <View className="bg-retro-cream border-4 border-black shadow-retro border border-gray-100 rounded-2xl p-4">
                <View className="flex-row items-center">
                  <Ionicons name="id-card-outline" size={22} color="#0284C8" />
                  <Text className="ml-2 font-semibold">Government ID + Selfie Verification</Text>
                </View>
                <Text className="text-xs text-retro-dark mt-1 ml-7">Powered by Persona. Takes ~2 minutes.</Text>

                <Pressable
                  onPress={() => !idVerified && simulateVerify('id')}
                  disabled={idVerified || verifying === 'id'}
                  className={`mt-3 ml-7 self-start px-4 py-2 rounded-full ${idVerified ? 'bg-emerald-100' : 'bg-[#0284C8]'}`}
                >
                  {verifying === 'id' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className={idVerified ? 'text-emerald-700 text-xs font-medium' : 'text-white text-xs font-semibold'}>
                      {idVerified ? '✓ Verified' : 'Start ID Verification'}
                    </Text>
                  )}
                </Pressable>
              </View>

              {/* Background */}
              <View className="bg-retro-cream border-4 border-black shadow-retro border border-gray-100 rounded-2xl p-4">
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark-outline" size={22} color="#0284C8" />
                  <Text className="ml-2 font-semibold">Background Check</Text>
                </View>
                <Text className="text-xs text-retro-dark mt-1 ml-7">Powered by Checkr. Standard criminal + sex offender check.</Text>

                <Pressable
                  onPress={() => !bgVerified && simulateVerify('bg')}
                  disabled={bgVerified || verifying === 'bg'}
                  className={`mt-3 ml-7 self-start px-4 py-2 rounded-full ${bgVerified ? 'bg-emerald-100' : 'bg-[#0284C8]'}`}
                >
                  {verifying === 'bg' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className={bgVerified ? 'text-emerald-700 text-xs font-medium' : 'text-white text-xs font-semibold'}>
                      {bgVerified ? '✓ Clear' : 'Run Background Check'}
                    </Text>
                  )}
                </Pressable>
              </View>
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
                <Text className="mt-4 text-2xl font-semibold text-[#0F172A]">You're almost in.</Text>
                <Text className="text-center text-gray-600 mt-2">Review your info and finish onboarding.</Text>

                <View className="mt-6 w-full bg-gray-50 rounded-2xl p-4">
                  <Text className="text-sm"><Text className="text-retro-dark">Name:</Text> {name}</Text>
                  <Text className="text-sm mt-1"><Text className="text-retro-dark">Gender:</Text> {gender} • <Text className="text-retro-dark">Age:</Text> {age}</Text>
                  <Text className="text-sm mt-1"><Text className="text-retro-dark">Home city:</Text> {preferredCity}</Text>
                  <Text className="text-[11px] text-gray-400 mt-3">All agreements accepted • ID + BG verified</Text>
                </View>

                <Pressable
                  onPress={handleComplete}
                  disabled={completing || !allAgreementsChecked || !idVerified || !bgVerified}
                  className="mt-6 bg-[#1E40AF] w-full py-3.5 rounded-2xl items-center"
                >
                  {completing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold text-base">Join Lumina</Text>
                  )}
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

                <Pressable onPress={goToSubscribe} className="mt-8 bg-[#0284C8] w-full py-3.5 rounded-2xl items-center">
                  <Text className="text-white font-semibold">Continue to Membership</Text>
                </Pressable>

                <Pressable onPress={goBackToApp} className="mt-3">
                  <Text className="text-[#0284C8] text-sm">Back to app (you can subscribe later)</Text>
                </Pressable>
              </>
            )}
          </View>
        );
    }
  };

  const canGoNext = () => {
    if (currentStep === 'profile') return name.trim().length > 1 && age.length > 0;
    if (currentStep === 'agreements') return allAgreementsChecked;
    if (currentStep === 'verify') return idVerified && bgVerified;
    return true;
  };

  return (
    <View className="flex-1 bg-retro-cream border-4 border-black shadow-retro">
      <View className="pt-12 pb-3 px-4 bg-retro-cream border-4 border-black shadow-retro border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-1 -ml-1">
            <Ionicons name="chevron-back" size={22} color="#64748B" />
          </Pressable>
          <Text className="font-semibold text-[#1E40AF]">Lumina Onboarding</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Progress */}
        <View className="mt-3 h-1 bg-gray-100 rounded">
          <View className="h-1 bg-[#0284C8] rounded" style={{ width: `${progress}%` }} />
        </View>
        <Text className="text-[10px] text-gray-400 mt-1 text-right">{stepIndex + 1} / {STEPS.length}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {renderStep()}
      </ScrollView>

      {/* Bottom nav */}
      {currentStep !== 'complete' && (
        <View className="px-4 pb-6 pt-2 border-t border-gray-100 bg-retro-cream border-4 border-black shadow-retro flex-row">
          {stepIndex > 0 && (
            <Pressable onPress={back} className="flex-1 mr-2 py-3 rounded-2xl border border-gray-200 items-center">
              <Text className="font-medium text-gray-600">Back</Text>
            </Pressable>
          )}
          <Pressable
            onPress={next}
            disabled={!canGoNext()}
            className={`flex-1 py-3 rounded-2xl items-center ${canGoNext() ? 'bg-[#1E40AF]' : 'bg-gray-200'}`}
          >
            <Text className={`font-semibold ${canGoNext() ? 'text-white' : 'text-gray-400'}`}>
              {currentStep === 'verify' ? 'Finish & Review' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
