import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RETRO_THEME_ENABLED, RETRO_COLORS, RETRO_GLOW, RETRO_FONT } from '../theme/retro';
import { SynthwaveBackground } from '../components/retro/SynthwaveBackground';
import { NeonCard } from '../components/retro/NeonCard';
import { NeonButton } from '../components/retro/NeonButton';
import { NeonPanel } from '../components/retro/NeonPanel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'planet-outline' as const,
    accent: RETRO_COLORS.neonCyan,
    title: 'WELCOME TO\nLUMINA',
    subtitle: 'Social travel, reimagined.',
    body: 'Lumina is a curated membership club that brings people together for real weekend getaways — not filters, not swipes. Just you, 9 others, and a house for the weekend.',
    detail: 'Groups of 5 men + 5 women travel to a shared vacation rental in Chicago, New York, or Atlanta for a co-ed platonic friendship experience.',
  },
  {
    icon: 'game-controller-outline' as const,
    accent: RETRO_COLORS.neonMagenta,
    title: 'THE GAME',
    subtitle: 'Your group. Your vote.',
    body: 'Before your trip, your matched group of 10 votes together on where to stay. You get 2 votes — Keep or Eliminate — on the properties your city coordinator curates.',
    detail: 'The property with the most Keep votes wins. The process is transparent, democratic, and designed to build group chemistry before you even arrive.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    accent: RETRO_COLORS.neonGreen,
    title: 'TRUST &\nCOMMUNITY',
    subtitle: 'Safety first. Always.',
    body: 'Every Lumina member is ID-verified and background-checked. We exist to build genuine platonic friendships through shared experiences in safe, managed environments.',
    detail: 'You will complete a user agreement and a conduct pledge before joining. These protect everyone in your group — including you.',
  },
] as const;

export default function IntroScreen() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (idx: number) => {
    setSlide(idx);
    scrollRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: true });
  };

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      goTo(slide + 1);
    } else {
      router.replace('/signup' as any);
    }
  };

  const handleScroll = (e: any) => {
    const newSlide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newSlide !== slide) setSlide(newSlide);
  };

  if (!RETRO_THEME_ENABLED) {
    const s = SLIDES[slide];
    return (
      <View className="flex-1 bg-retro-cream">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {SLIDES.map((sl, i) => (
            <View key={i} style={{ width: SCREEN_WIDTH }} className="flex-1 px-6 pt-16 pb-6 justify-center">
              <View className="items-center mb-6">
                <Ionicons name={sl.icon} size={56} color="#0284C8" />
              </View>
              <Text className="text-2xl font-extrabold text-retro-ink text-center mb-2">{sl.title}</Text>
              <Text className="text-retro-blue text-center font-semibold mb-4">{sl.subtitle}</Text>
              <View className="bg-sky-50 border-2 border-black rounded-2xl p-4 mb-3">
                <Text className="text-retro-ink text-[14px] leading-relaxed">{sl.body}</Text>
              </View>
              <Text className="text-[12px] text-retro-dark text-center leading-relaxed">{sl.detail}</Text>
            </View>
          ))}
        </ScrollView>
        <View className="flex-row justify-center mb-4 gap-2">
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)}
              className={`h-2 rounded-full ${i === slide ? 'w-6 bg-retro-blue' : 'w-2 bg-gray-300'}`} />
          ))}
        </View>
        <View className="px-6 pb-8 flex-row">
          {slide > 0 && (
            <Pressable onPress={() => goTo(slide - 1)}
              className="flex-1 mr-2 py-3 rounded-xl bg-retro-paper border-2 border-black items-center">
              <Text className="font-bold text-retro-ink">Back</Text>
            </Pressable>
          )}
          <Pressable onPress={handleNext}
            className="flex-1 py-3 rounded-xl bg-retro-blue border-2 border-black items-center">
            <Text className="text-white font-bold">{slide === SLIDES.length - 1 ? 'Get Started' : 'Next'}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.replace('/signup' as any)} className="pb-4 items-center">
          <Text className="text-retro-blue text-sm">Skip intro</Text>
        </Pressable>
      </View>
    );
  }

  // ── Retro synthwave render ──────────────────────────────────────────────────
  const sl = SLIDES[slide];
  return (
    <SynthwaveBackground>
      <View style={{ flex: 1 }}>
        {/* Slide pager */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={{ width: SCREEN_WIDTH, flex: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, justifyContent: 'center' }}>
              {/* Icon badge */}
              <View style={{
                alignSelf: 'center',
                width: 88, height: 88, borderRadius: 44,
                borderWidth: 2.5, borderColor: s.accent,
                backgroundColor: 'rgba(10,0,32,0.8)',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
                shadowColor: s.accent, shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1, shadowRadius: 20, elevation: 14,
              }}>
                <Ionicons name={s.icon} size={44} color={s.accent} />
              </View>

              {/* Title */}
              <Text style={{
                color: s.accent, fontSize: 28, fontWeight: '900',
                letterSpacing: RETRO_FONT.letterSpacing, textAlign: 'center',
                textShadowColor: s.accent, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14,
                marginBottom: 6,
              }}>
                {s.title}
              </Text>
              <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
                {s.subtitle}
              </Text>

              {/* Body card */}
              <NeonCard variant={i === 0 ? 'cyan' : i === 1 ? 'magenta' : 'gold'} style={{ marginBottom: 14 }}>
                <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 14, lineHeight: 22 }}>
                  {s.body}
                </Text>
              </NeonCard>

              {/* Detail panel */}
              <NeonPanel variant={i === 2 ? 'success' : 'info'}>
                <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, lineHeight: 18 }}>
                  {s.detail}
                </Text>
              </NeonPanel>
            </View>
          ))}
        </ScrollView>

        {/* Dot indicators */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, gap: 8 }}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)}>
              <View style={{
                height: 6, borderRadius: 3,
                width: i === slide ? 24 : 6,
                backgroundColor: i === slide ? SLIDES[i].accent : RETRO_COLORS.textMuted,
                shadowColor: i === slide ? SLIDES[i].accent : 'transparent',
                shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6,
              }} />
            </Pressable>
          ))}
        </View>

        {/* Navigation buttons */}
        <View style={{
          paddingHorizontal: 16, paddingBottom: 28, paddingTop: 8,
          borderTopWidth: 1.5, borderTopColor: RETRO_COLORS.neonCyan,
          backgroundColor: 'rgba(10,0,32,0.9)',
          flexDirection: 'row', gap: 10,
        }}>
          {slide > 0 && (
            <NeonButton label="BACK" onPress={() => goTo(slide - 1)} variant="dark" size="md" style={{ flex: 1 }} />
          )}
          <NeonButton
            label={slide === SLIDES.length - 1 ? 'GET STARTED' : 'NEXT'}
            onPress={handleNext}
            variant={slide === SLIDES.length - 1 ? 'cyan' : 'magenta'}
            size="md"
            style={{ flex: 1 }}
          />
        </View>

        {/* Skip */}
        <Pressable onPress={() => router.replace('/signup' as any)} style={{ alignItems: 'center', paddingBottom: 10 }}>
          <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 12 }}>Skip intro</Text>
        </Pressable>
      </View>
    </SynthwaveBackground>
  );
}
