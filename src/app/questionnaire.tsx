import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ARCHETYPE_INFO,
  questionnaireService,
} from '../services/questionnaireService';
import {
  PersistedQuestionnaire,
  QuestionnaireAnswer,
} from '../types/questionnaire';
import { RETRO_COLORS, RETRO_THEME_ENABLED } from '../theme/retro';

const BG = RETRO_THEME_ENABLED ? '#090021' : '#F5F1E9';
const TEXT_PRIMARY = RETRO_THEME_ENABLED ? '#FFFFFF' : '#1A1612';
const TEXT_MUTED = RETRO_THEME_ENABLED ? RETRO_COLORS.textMuted : '#6F6256';
const ACCENT = RETRO_THEME_ENABLED ? RETRO_COLORS.neonCyan : '#0284C8';
const ACCENT_ALT = RETRO_THEME_ENABLED ? RETRO_COLORS.neonMagenta : '#1A1612';
const CARD_BG = RETRO_THEME_ENABLED ? 'rgba(10,0,32,0.7)' : '#FFFFFF';
const ERROR_COLOR = RETRO_THEME_ENABLED ? '#ff9da6' : '#DC2626';

export default function QuestionnaireScreen() {
  const router = useRouter();
  const questions = useMemo(() => questionnaireService.getQuestions(), []);

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<PersistedQuestionnaire | null>(null);
  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>([]);
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const existing = await questionnaireService.getSaved();
        setSaved(existing);
      } catch (e) {
        console.warn('Failed to load saved questionnaire', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async (finalAnswers: QuestionnaireAnswer[]) => {
    setSubmitting(true);
    setError(null);
    try {
      const record = await questionnaireService.submitAnswers(finalAnswers);
      setSaved(record);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const choose = (optionId: 'A' | 'B') => {
    if (submitting) return;
    const question = questions[index];
    const nextAnswers = [
      ...answers.filter((a) => a.questionId !== question.id),
      { questionId: question.id, optionId },
    ];
    setAnswers(nextAnswers);
    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      submit(nextAnswers);
    }
  };

  const back = () => {
    if (index > 0) setIndex(index - 1);
    else router.back();
  };

  const retake = async () => {
    setError(null);
    try {
      await questionnaireService.reset();
      setSaved(null);
      setAnswers([]);
      setIndex(0);
    } catch (e) {
      setError('Could not reset the questionnaire. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  // ── Result view ─────────────────────────────────────────────────────────────
  if (saved) {
    const info = ARCHETYPE_INFO[saved.result.archetype];
    const style = saved.result.socialStyle;
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: BG }}
        contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 48 }}
      >
        <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
          Your profile category
        </Text>
        <Text style={{ color: ACCENT, fontSize: 30, fontWeight: '900', letterSpacing: 1, marginTop: 6 }}>
          {info.title}
        </Text>
        <Text style={{ color: ACCENT_ALT, fontSize: 13, fontWeight: '700', marginTop: 4 }}>{info.tagline}</Text>
        <View style={{ backgroundColor: CARD_BG, borderWidth: 1.5, borderColor: ACCENT, borderRadius: 14, padding: 16, marginTop: 18 }}>
          <Text style={{ color: TEXT_PRIMARY, fontSize: 14, lineHeight: 21 }}>{info.description}</Text>
        </View>

        <View style={{ marginTop: 22 }}>
          {[
            { label: 'Social energy', left: 'Outgoing', right: 'Reflective', value: style.introversion },
            { label: 'Adventure', left: 'Easygoing', right: 'Adventurous', value: style.adventurousness },
          ].map((axis) => (
            <View key={axis.label} style={{ marginBottom: 16 }}>
              <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                {axis.label}
              </Text>
              <View style={{ height: 8, borderRadius: 4, borderWidth: 1, borderColor: ACCENT, overflow: 'hidden', backgroundColor: CARD_BG }}>
                <View style={{ height: '100%', width: `${Math.round(axis.value * 100)}%`, backgroundColor: ACCENT }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                <Text style={{ color: TEXT_MUTED, fontSize: 10 }}>{axis.left}</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 10 }}>{axis.right}</Text>
              </View>
            </View>
          ))}
          <Text style={{ color: TEXT_PRIMARY, fontSize: 13 }}>
            Preferred pace: <Text style={{ color: ACCENT, fontWeight: '800' }}>{saved.result.tripPace}</Text>
          </Text>
        </View>

        {error ? <Text style={{ color: ERROR_COLOR, marginTop: 14, fontSize: 13 }}>{error}</Text> : null}

        <Pressable
          onPress={() => router.push('/onboarding' as any)}
          style={{ marginTop: 28, backgroundColor: RETRO_THEME_ENABLED ? 'rgba(0,40,80,0.7)' : ACCENT, borderWidth: 2, borderColor: ACCENT, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
        >
          <Text style={{ color: RETRO_THEME_ENABLED ? ACCENT : '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 }}>
            CONTINUE ONBOARDING
          </Text>
        </Pressable>
        <Pressable onPress={retake} style={{ marginTop: 14, alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ color: TEXT_MUTED, fontSize: 13, textDecorationLine: 'underline' }}>Retake questionnaire</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── Question view ───────────────────────────────────────────────────────────
  const question = questions[index];
  const progress = ((index + 1) / questions.length) * 100;
  const currentChoice = answers.find((a) => a.questionId === question.id)?.optionId;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14 }}>
        <Pressable onPress={back} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chevron-back" size={18} color={ACCENT} />
          <Text style={{ color: ACCENT, fontSize: 13, marginLeft: 2 }}>Back</Text>
        </Pressable>
        <Text style={{ color: ACCENT_ALT, fontSize: 18, fontWeight: '800', letterSpacing: 1 }}>
          {RETRO_THEME_ENABLED ? 'TRAVEL ARCHETYPE QUIZ' : 'Travel Archetype Quiz'}
        </Text>
        <Text style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 4 }}>
          Pick the option that sounds more like you. No wrong answers.
        </Text>
        <View style={{ height: 6, borderRadius: 3, borderWidth: 1, borderColor: ACCENT, overflow: 'hidden', marginTop: 14, backgroundColor: CARD_BG }}>
          <View style={{ height: '100%', width: `${progress}%`, backgroundColor: ACCENT }} />
        </View>
        <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '700', textAlign: 'right', marginTop: 4 }}>
          {index + 1} / {questions.length}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={{ color: TEXT_PRIMARY, fontSize: 19, fontWeight: '800', lineHeight: 27, marginTop: 8, marginBottom: 22 }}>
          {question.prompt}
        </Text>
        {question.options.map((option) => {
          const selected = currentChoice === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => choose(option.id)}
              disabled={submitting}
              style={{
                backgroundColor: selected ? (RETRO_THEME_ENABLED ? 'rgba(0,40,80,0.7)' : '#E0F2FE') : CARD_BG,
                borderWidth: 2,
                borderColor: selected ? ACCENT : TEXT_MUTED,
                borderRadius: 14,
                padding: 18,
                marginBottom: 14,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text style={{ color: selected ? ACCENT : TEXT_PRIMARY, fontSize: 15, fontWeight: '600', lineHeight: 22 }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
        {submitting ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <ActivityIndicator color={ACCENT} />
            <Text style={{ color: TEXT_MUTED, marginLeft: 10, fontSize: 13 }}>Scoring your archetype…</Text>
          </View>
        ) : null}
        {error ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: ERROR_COLOR, fontSize: 13 }}>{error}</Text>
            <Pressable
              onPress={() => submit(answers)}
              style={{ marginTop: 10, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: ACCENT, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <Text style={{ color: ACCENT, fontWeight: '700', fontSize: 13 }}>Retry save</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
