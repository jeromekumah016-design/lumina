import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { introBotService, IntroBotState } from '../services/introBotService';
import { userService } from '../services/userService';
import { RETRO_COLORS, RETRO_THEME_ENABLED } from '../theme/retro';

export default function IntroBotScreen() {
  const router = useRouter();
  const [state, setState] = useState<IntroBotState | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const existing = await userService.getMatchingProfile();
      setState(introBotService.createInitialState(existing.introProfile));
    })();
  }, []);

  const done = state?.step === 'done';
  const title = useMemo(
    () => (RETRO_THEME_ENABLED ? 'LUMINA INTRO BOT' : 'Lumina Intro Bot'),
    []
  );

  const submitAnswer = async () => {
    if (!state || !input.trim()) return;
    const result = introBotService.applyAnswer(state, input);
    setState(result.nextState);
    setInput('');
    setError(result.error || null);
    if (!result.error && result.nextState.step === 'done') {
      setSaving(true);
      try {
        await userService.saveIntroProfile(result.nextState.profile);
      } finally {
        setSaving(false);
      }
    }
  };

  if (!state) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }}>
        <Text style={{ color: '#fff' }}>Loading intro bot...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: RETRO_THEME_ENABLED ? '#090021' : '#F5F1E9' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 8 }}>
          <Text style={{ color: RETRO_THEME_ENABLED ? RETRO_COLORS.neonCyan : '#1A1612' }}>Back</Text>
        </Pressable>
        <Text style={{ color: RETRO_THEME_ENABLED ? RETRO_COLORS.neonMagenta : '#1A1612', fontSize: 20, fontWeight: '800' }}>
          {title}
        </Text>
        <Text style={{ color: RETRO_THEME_ENABLED ? RETRO_COLORS.textSecondary : '#6F6256', marginTop: 4 }}>
          Signup bot for interests + social style matching.
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {state.transcript.map((line, index) => (
          <View
            key={`${line.from}-${index}`}
            style={{
              alignSelf: line.from === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              marginBottom: 10,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: line.from === 'user' ? RETRO_COLORS.neonCyan : RETRO_COLORS.neonMagenta,
              backgroundColor: line.from === 'user' ? 'rgba(0,40,80,0.7)' : 'rgba(44,0,77,0.7)',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13 }}>{line.text}</Text>
          </View>
        ))}

        {error ? <Text style={{ color: '#ff9da6', marginTop: 4 }}>{error}</Text> : null}
        {done ? (
          <View style={{ marginTop: 8, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: RETRO_COLORS.neonGreen }}>
            <Text style={{ color: RETRO_COLORS.neonGreen, fontWeight: '700' }}>
              Intro profile saved.
            </Text>
            <Text style={{ color: '#fff', marginTop: 4 }}>
              Interests: {state.profile.interests.join(', ')}
            </Text>
            <Text style={{ color: '#fff', marginTop: 2 }}>
              Style: introversion {Math.round(state.profile.socialStyle.introversion * 10)}/10, adventurousness {Math.round(state.profile.socialStyle.adventurousness * 10)}/10
            </Text>
            <Pressable
              onPress={() => router.push('/onboarding' as any)}
              style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: RETRO_COLORS.neonCyan }}
            >
              <Text style={{ color: RETRO_COLORS.neonCyan, fontWeight: '700' }}>
                Continue onboarding
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {!done && (
        <View style={{ flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            editable={!saving}
            placeholder="Type your answer..."
            placeholderTextColor="#8A8A9A"
            style={{
              flex: 1,
              color: '#fff',
              borderWidth: 1.5,
              borderColor: RETRO_COLORS.neonCyan,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginRight: 10,
            }}
            onSubmitEditing={submitAnswer}
            returnKeyType="send"
          />
          <Pressable
            onPress={submitAnswer}
            disabled={saving}
            style={{
              backgroundColor: RETRO_COLORS.keepBg,
              borderWidth: 1.5,
              borderColor: RETRO_COLORS.neonCyan,
              borderRadius: 10,
              paddingHorizontal: 14,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: RETRO_COLORS.neonCyan, fontWeight: '700' }}>{saving ? '...' : 'Send'}</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
