import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';
import { RETRO_THEME_ENABLED, RETRO_COLORS, RETRO_FONT } from '../theme/retro';
import { SynthwaveBackground } from '../components/retro/SynthwaveBackground';
import { NeonCard } from '../components/retro/NeonCard';
import { NeonButton } from '../components/retro/NeonButton';
import { NeonPanel } from '../components/retro/NeonPanel';
import { NeonHeader } from '../components/retro/NeonHeader';

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.';
  const idx = email.indexOf('@');
  if (idx < 1) return 'Enter a valid email address.';
  const domain = email.slice(idx + 1);
  if (!domain.includes('.') || domain.length < 3) return 'Enter a valid email address.';
  return null;
}

function validateName(name: string): string | null {
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
  return null;
}

export default function SignupScreen() {
  const router = useRouter();
  const { saveAccountStub } = useLuminaState();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (nameError) setNameError(validateName(val));
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailError) setEmailError(validateEmail(val));
  };

  const canSubmit = name.trim().length >= 2 && !validateEmail(email) && !saving;

  const handleCreateAccount = async () => {
    const ne = validateName(name);
    const ee = validateEmail(email);
    setNameError(ne);
    setEmailError(ee);
    if (ne || ee) return;
    setSaving(true);
    try {
      await saveAccountStub({ name: name.trim(), email: email.trim().toLowerCase(), createdAt: new Date().toISOString() });
      router.replace('/user-agreement' as any);
    } finally {
      setSaving(false);
    }
  };

  const retroInputStyle = {
    backgroundColor: 'rgba(10,0,32,0.8)',
    borderWidth: 1.5,
    borderColor: RETRO_COLORS.neonCyan,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: RETRO_COLORS.textPrimary,
    fontSize: 15,
    marginBottom: 4,
  };

  if (!RETRO_THEME_ENABLED) {
    return (
      <KeyboardAvoidingView className="flex-1 bg-retro-cream" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="pt-12 pb-3 px-4 bg-retro-cream border-b-2 border-black">
          <Pressable onPress={() => router.back()} className="p-1 -ml-1 mb-2">
            <Ionicons name="chevron-back" size={22} color="#64748B" />
          </Pressable>
          <Text className="font-extrabold text-retro-ink text-xl">Create Account</Text>
          <Text className="text-retro-dark text-sm mt-1">Step 1 of 3 · Sign up</Text>
        </View>
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}>
          <Text className="text-xs uppercase tracking-widest text-retro-dark mb-1.5">FULL NAME</Text>
          <TextInput
            value={name} onChangeText={handleNameChange}
            placeholder="Your full name"
            className="bg-white border-2 border-black rounded-xl px-4 py-3 text-base mb-1"
            autoCapitalize="words" autoCorrect={false}
          />
          {nameError ? <Text className="text-red-500 text-xs mb-3">{nameError}</Text> : <View className="mb-3" />}
          <Text className="text-xs uppercase tracking-widest text-retro-dark mb-1.5">EMAIL ADDRESS</Text>
          <TextInput
            value={email} onChangeText={handleEmailChange}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none" autoCorrect={false}
            className="bg-white border-2 border-black rounded-xl px-4 py-3 text-base mb-1"
          />
          {emailError ? <Text className="text-red-500 text-xs mb-3">{emailError}</Text> : <View className="mb-3" />}
          <View className="bg-sky-50 border-2 border-black rounded-2xl p-4 mb-6">
            <Text className="text-retro-dark text-[12px] leading-relaxed">
              No password required for this demo. Your account is stored locally on this device. You'll set up ID verification during onboarding.
            </Text>
          </View>
          <Pressable onPress={handleCreateAccount} disabled={!canSubmit}
            className={`py-3.5 rounded-xl border-2 items-center ${canSubmit ? 'bg-retro-blue border-black' : 'bg-gray-200 border-gray-300'}`}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <Text className={`font-bold ${canSubmit ? 'text-white' : 'text-gray-400'}`}>Create Account →</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Retro synthwave render ──────────────────────────────────────────────────
  return (
    <SynthwaveBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={{
          paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12,
          borderBottomWidth: 1.5, borderBottomColor: RETRO_COLORS.neonCyan,
          backgroundColor: 'rgba(10,0,32,0.9)',
        }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 10 }}>
            <Ionicons name="chevron-back" size={22} color={RETRO_COLORS.neonCyan} />
          </Pressable>
          <NeonHeader title="CREATE ACCOUNT" subtitle="Step 1 of 3 · Sign up" />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* Name field */}
          <Text style={{
            color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700',
            letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6,
          }}>
            Full Name
          </Text>
          <TextInput
            value={name}
            onChangeText={handleNameChange}
            placeholder="Your full name"
            placeholderTextColor={RETRO_COLORS.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            style={[retroInputStyle, nameError ? { borderColor: RETRO_COLORS.neonOrange } : {}]}
          />
          {nameError ? (
            <Text style={{ color: RETRO_COLORS.neonOrange, fontSize: 11, marginBottom: 14 }}>{nameError}</Text>
          ) : <View style={{ height: 14 }} />}

          {/* Email field */}
          <Text style={{
            color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700',
            letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6,
          }}>
            Email Address
          </Text>
          <TextInput
            value={email}
            onChangeText={handleEmailChange}
            placeholder="you@example.com"
            placeholderTextColor={RETRO_COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={[retroInputStyle, emailError ? { borderColor: RETRO_COLORS.neonOrange } : {}]}
          />
          {emailError ? (
            <Text style={{ color: RETRO_COLORS.neonOrange, fontSize: 11, marginBottom: 14 }}>{emailError}</Text>
          ) : <View style={{ height: 14 }} />}

          {/* Info panel */}
          <NeonPanel variant="info" style={{ marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="lock-closed-outline" size={14} color={RETRO_COLORS.neonCyan} style={{ marginTop: 2, marginRight: 8 }} />
              <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, lineHeight: 18, flex: 1 }}>
                No password required for this demo. Your account is stored locally on this device. ID verification happens during onboarding.
              </Text>
            </View>
          </NeonPanel>

          {/* Submit */}
          {saving ? (
            <ActivityIndicator color={RETRO_COLORS.neonCyan} style={{ padding: 14 }} />
          ) : (
            <NeonButton
              label="CREATE ACCOUNT →"
              onPress={handleCreateAccount}
              variant="cyan"
              size="lg"
              fullWidth
              disabled={!canSubmit}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SynthwaveBackground>
  );
}
