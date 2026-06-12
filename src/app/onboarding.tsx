import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { userService, Gender } from '../services/userService';

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

  const [name, setName] = useState('Alex Rivera');
  const [age, setAge] = useState('28');
  // FIX #3a: track age validation error
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

  // FIX #3a: validate age as a real integer in range
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
    // FIX #3b: guard is now enforced here too (belt-and-suspenders alongside disabled prop)
    if (!allAgreementsChecked || !idVerified || !bgVerified) return;
    const ageVal = parseInt(age, 10);
    if (isNaN(ageVal)) return;

    setCompleting(true);
    try {
      await userService.completeOnboarding({
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

  const renderStep = () => {
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
                <Text className="font-semibold">exactly 4 men + 7 women (11 total)</Text> plus 1-2
                handlers, and travel together to a booked vacation rental for the weekend.
              </Text>
              <Text className="text-retro-ink text-[12px] mt-2 font-semibold">
                Every member must clearly understand they are joining a co-ed, in-person group trip
                with other members (strangers) at a shared rental home.
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
            <Text className="text-lg font-extrabold text-retro-ink">Tell us about you</Text>
            <Text className="text-retro-dark text-sm mt-1">
              This helps us match you into the right group composition.
            </Text>

            <View className="mt-5">
              <Text className="text-xs uppercase tracking-widest text-retro-dark mb-1.5">YOUR NAME</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                className="bg-white border-2 border-black rounded-xl shadow-retro-sm px-4 py-3 text-base"
                placeholder="Alex Rivera"
              />
            </View>

            {/* FIX #3a: age field with inline validation error */}
            <View className="mt-4">
              <Text className="text-xs uppercase tracking-widest text-retro-dark mb-1.5">AGE</Text>
              <TextInput
                value={age}
                onChangeText={handleAgeChange}
                keyboardType="number-pad"
                className="bg-white border-2 border-black rounded-xl shadow-retro-sm px-4 py-3 text-base w-24"
              />
              {ageError ? (
                <Text className="text-xs text-red-500 mt-1">{ageError}</Text>
              ) : null}
            </View>

            <View className="mt-4">
              <Text className="text-xs uppercase tracking-widest text-retro-dark mb-2">
                GENDER (required for matching)
              </Text>
              <View className="flex-row gap-2">
                {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGender(g)}
                    className={`flex-1 py-3 rounded-xl border-2 border-black items-center ${
                      gender === g ? 'bg-retro-blue shadow-retro-sm' : 'bg-retro-paper'
                    }`}
                  >
                    <Text className={`font-bold ${gender === g ? 'text-white' : 'text-retro-ink'}`}>
                      {g === 'MALE' ? 'Man' : g === 'FEMALE' ? 'Woman' : 'Other'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="text-[11px] text-gray-400 mt-1.5">
                Groups are formed as exactly 4 men + 7 women. Other may be counted toward the 7 or
                not eligible for fixed-ratio trips (disclosed at signup).
              </Text>
            </View>

            <View className="mt-4">
              <Text className="text-xs uppercase tracking-widest text-retro-dark mb-2">
                PREFERRED CITY
              </Text>
              <View className="flex-row gap-2">
                {CITIES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setPreferredCity(c)}
                    className={`flex-1 py-3 rounded-full border-2 border-black items-center ${
                      preferredCity === c ? 'bg-retro-blue shadow-retro-sm' : 'bg-retro-paper'
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        preferredCity === c ? 'text-white' : 'text-retro-ink'
                      }`}
                    >
                      {c}
                    </Text>
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
            <Text className="text-sm text-retro-dark mt-1">
              Please read and check every box. This is a real co-ed group trip experience.
            </Text>

            <ScrollView className="mt-4" style={{ maxHeight: 380 }}>
              {REQUIRED_AGREEMENTS.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => toggleAgreement(item.key)}
                  className="flex-row items-start bg-retro-paper border-2 border-black shadow-retro-sm rounded-xl p-3 mb-2.5"
                >
                  <View
                    className={`w-5 h-5 mt-0.5 rounded border-2 border-black mr-3 items-center justify-center ${
                      agreements[item.key] ? 'bg-retro-blue' : 'bg-white'
                    }`}
                  >
                    {agreements[item.key] && <Ionicons name="checkmark" size={14} color="white" />}
                  </View>
                  <Text className="flex-1 text-[13px] text-retro-ink leading-snug">{item.label}</Text>
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
            <Text className="text-lg font-extrabold text-retro-ink">Safety &amp; verification</Text>
            <Text className="text-sm text-retro-dark mt-1">These steps protect everyone in the group.</Text>

            {/* FIX #3b: show a warning if agreements weren't all checked before reaching this step */}
            {!allAgreementsChecked ? (
              <View className="mt-3 bg-amber-100 border-2 border-black rounded-xl p-3">
                <Text className="text-xs text-retro-ink font-bold">
                  ⚠ Please go back and accept all agreements before completing verification.
                </Text>
              </View>
            ) : null}

            <View className="mt-6 space-y-3">
              <View className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-4">
                <View className="flex-row items-center">
                  <Ionicons name="id-card-outline" size={22} color="#0284C8" />
                  <Text className="ml-2 font-semibold">Government ID + Selfie Verification</Text>
                </View>
                <Text className="text-xs text-retro-dark mt-1 ml-7">Powered by Persona. Takes ~2 minutes.</Text>
                <Pressable
                  onPress={() => !idVerified && simulateVerify('id')}
                  disabled={idVerified || verifying === 'id'}
                  className={`mt-3 ml-7 self-start px-4 py-2 rounded-full border-2 border-black ${
                    idVerified ? 'bg-emerald-100' : 'bg-retro-blue'
                  }`}
                >
                  {verifying === 'id' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      className={
                        idVerified ? 'text-emerald-800 text-xs font-bold' : 'text-white text-xs font-bold'
                      }
                    >
                      {idVerified ? '✓ Verified' : 'Start ID Verification'}
                    </Text>
                  )}
                </Pressable>
              </View>

              <View className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-4">
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark-outline" size={22} color="#0284C8" />
                  <Text className="ml-2 font-semibold">Background Check</Text>
                </View>
                <Text className="text-xs text-retro-dark mt-1 ml-7">
                  Powered by Checkr. Standard criminal + sex offender check.
                </Text>
                <Pressable
                  onPress={() => !bgVerified && simulateVerify('bg')}
                  disabled={bgVerified || verifying === 'bg'}
                  className={`mt-3 ml-7 self-start px-4 py-2 rounded-full border-2 border-black ${
                    bgVerified ? 'bg-emerald-100' : 'bg-retro-blue'
                  }`}
                >
                  {verifying === 'bg' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      className={
                        bgVerified ? 'text-emerald-800 text-xs font-bold' : 'text-white text-xs font-bold'
                      }
                    >
                      {bgVerified ? '✓ Clear' : 'Run Background Check'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>

            <Text className="text-center text-[11px] text-gray-400 mt-6">
              You will not be matched into any group until both verifications are complete and clear.
            </Text>
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
                  <Text className="text-sm">
                    <Text className="text-retro-dark">Name:</Text> {name}
                  </Text>
                  <Text className="text-sm mt-1">
                    <Text className="text-retro-dark">Gender:</Text> {gender} •{' '}
                    <Text className="text-retro-dark">Age:</Text> {age}
                  </Text>
                  <Text className="text-sm mt-1">
                    <Text className="text-retro-dark">Home city:</Text> {preferredCity}
                  </Text>
                  <Text className="text-[11px] text-gray-400 mt-3">
                    All agreements accepted • ID + BG verified
                  </Text>
                </View>

                <Pressable
                  onPress={handleComplete}
                  disabled={completing || !allAgreementsChecked || !idVerified || !bgVerified}
                  className="mt-6 bg-retro-ink w-full py-3.5 rounded-xl border-2 border-black shadow-retro items-center"
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
                  <Text className="mt-4 text-2xl font-semibold">
                    Welcome to Lumina, {name.split(' ')[0]}.
                  </Text>
                  <Text className="text-center text-gray-600 mt-2">
                    Onboarding complete. Next step: activate your membership to get placed in the
                    matching queue.
                  </Text>
                </View>

                <Pressable
                  onPress={goToSubscribe}
                  className="mt-8 bg-retro-blue w-full py-3.5 rounded-xl border-2 border-black shadow-retro items-center"
                >
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

  // FIX #3b: verify step requires agreements to be done too before proceeding
  const canGoNext = () => {
    if (currentStep === 'profile') return name.trim().length > 1 && age.length > 0 && !ageError;
    if (currentStep === 'agreements') return allAgreementsChecked;
    if (currentStep === 'verify') return idVerified && bgVerified && allAgreementsChecked;
    return true;
  };

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
        <Text className="text-[10px] font-bold text-retro-dark mt-1 text-right">
          {stepIndex + 1} / {STEPS.length}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {renderStep()}
      </ScrollView>

      {currentStep !== 'complete' && (
        <View className="px-4 pb-6 pt-2 border-t-2 border-black bg-retro-cream flex-row">
          {stepIndex > 0 && (
            <Pressable
              onPress={back}
              className="flex-1 mr-2 py-3 rounded-xl bg-retro-paper border-2 border-black items-center"
            >
              <Text className="font-bold text-retro-ink">Back</Text>
            </Pressable>
          )}
          <Pressable
            onPress={next}
            disabled={!canGoNext()}
            className={`flex-1 py-3 rounded-xl border-2 items-center ${
              canGoNext() ? 'bg-retro-blue border-black shadow-retro-sm' : 'bg-gray-200 border-gray-300'
            }`}
          >
            <Text className={`font-bold ${canGoNext() ? 'text-white' : 'text-gray-400'}`}>
              {currentStep === 'verify' ? 'Finish & Review' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
