import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';
import { RETRO_THEME_ENABLED, RETRO_COLORS, RETRO_FONT } from '../theme/retro';
import { SynthwaveBackground } from '../components/retro/SynthwaveBackground';
import { NeonCard } from '../components/retro/NeonCard';
import { NeonButton } from '../components/retro/NeonButton';
import { NeonPanel } from '../components/retro/NeonPanel';
import { NeonHeader } from '../components/retro/NeonHeader';

const SAMPLE_ITINERARIES = [
  { city: 'Chicago', day: 'Day 1', activity: 'Arrival & Wicker Park walk', time: 'Evening' },
  { city: 'Chicago', day: 'Day 2', activity: 'Property voting + group dinner', time: 'Afternoon' },
  { city: 'New York', day: 'Day 1', activity: 'Brooklyn exploration', time: 'Morning' },
  { city: 'Atlanta', day: 'Day 3', activity: 'Decatur market & close', time: 'All day' },
];

const FALLBACK_GROUP = [
  { name: 'Emma', gender: 'FEMALE' },
  { name: 'Olivia', gender: 'FEMALE' },
  { name: 'Sophia', gender: 'FEMALE' },
  { name: 'Isabella', gender: 'FEMALE' },
  { name: 'Mia', gender: 'FEMALE' },
  { name: 'Liam', gender: 'MALE' },
  { name: 'Noah', gender: 'MALE' },
  { name: 'Oliver', gender: 'MALE' },
  { name: 'James', gender: 'MALE' },
  { name: 'Lucas', gender: 'MALE' },
];

export default function Trips() {
  const { isMatched, currentTripCity, matchedGroup } = useLuminaState();

  const [wallPosts, setWallPosts] = useState([
    { id: 1, author: 'Emma', text: 'Excited for the Chicago trip! Anyone have restaurant recs?', time: '2h ago' },
    { id: 2, author: 'Liam', text: 'The property voting is going well so far 👍', time: '1h ago' },
  ]);
  const [newPostText, setNewPostText] = useState('');

  const addPost = () => {
    if (!newPostText.trim()) return;
    setWallPosts([
      { id: Date.now(), author: 'You', text: newPostText.trim(), time: 'just now' },
      ...wallPosts,
    ]);
    setNewPostText('');
  };

  const groupMembers = matchedGroup || FALLBACK_GROUP;
  const tripCity = currentTripCity || 'Chicago';

  if (!RETRO_THEME_ENABLED) {
    return (
      <ScrollView className="flex-1 bg-retro-cream px-4 pt-12">
        <View className="flex-row items-center mb-1">
          <Text className="text-2xl font-extrabold tracking-tight text-retro-ink">Your Trips</Text>
          <Text className="text-retro-amber ml-1 text-lg -mt-0.5">✦</Text>
        </View>
        <Text className="text-retro-dark">Planned small-group getaways</Text>

        {isMatched ? (
          <View className="mt-4 bg-retro-paper border-2 border-black shadow-retro rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <View className="bg-retro-blue border-2 border-black rounded-xl p-2 mr-3">
                <Ionicons name="calendar" size={20} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="font-extrabold text-retro-ink text-lg">Your Current Matched Trip</Text>
                <Text className="text-sm font-semibold text-retro-blue">{tripCity} • This Weekend • 10 members</Text>
              </View>
              <Pressable onPress={() => router.push('/game' as any)} className="bg-retro-blue border-2 border-black px-3 py-1.5 rounded-full">
                <Text className="text-white text-xs font-bold">Go to Game</Text>
              </Pressable>
            </View>

            <View className="mt-2">
              <Text className="text-xs uppercase tracking-widest font-bold text-retro-dark mb-1">Your Group (5 men + 5 women)</Text>
              <View className="flex-row flex-wrap">
                {groupMembers.map((m, i) => (
                  <View key={i} className="bg-white border border-black rounded-full px-2 py-0.5 mr-1 mb-1 flex-row items-center">
                    <Ionicons name={m.gender === 'MALE' ? 'man' : 'woman'} size={10} color={m.gender === 'MALE' ? '#1E40AF' : '#be185d'} />
                    <Text className="ml-1 text-xs font-semibold text-retro-ink">{m.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mt-3 pt-3 border-t-2 border-black">
              <Text className="text-xs uppercase tracking-widest font-bold text-retro-dark mb-1">Sample Itinerary</Text>
              {SAMPLE_ITINERARIES.filter(i => i.city === tripCity).slice(0, 2).map((item, i) => (
                <View key={i} className="flex-row items-center mb-1">
                  <Text className="text-sm font-semibold text-retro-ink flex-1">{item.day}: {item.activity}</Text>
                  <Text className="text-xs text-retro-dark">{item.time}</Text>
                </View>
              ))}
            </View>

            <View className="mt-4 pt-3 border-t-2 border-black">
              <View className="flex-row items-center mb-2">
                <Ionicons name="chatbubbles-outline" size={14} color="#0284C8" />
                <Text className="ml-1 text-xs uppercase tracking-widest text-retro-blue font-bold">Group Wall</Text>
              </View>
              {wallPosts.map((post) => (
                <View key={post.id} className="bg-white border border-black rounded-lg p-2 mb-1.5">
                  <View className="flex-row justify-between">
                    <Text className="text-xs font-bold text-retro-ink">{post.author}</Text>
                    <Text className="text-[10px] text-retro-dark">{post.time}</Text>
                  </View>
                  <Text className="text-sm text-retro-ink mt-0.5">{post.text}</Text>
                </View>
              ))}
              <View className="flex-row mt-1">
                <TextInput
                  value={newPostText}
                  onChangeText={setNewPostText}
                  placeholder="Share an update with the group..."
                  className="flex-1 bg-white border-2 border-black rounded-lg px-3 py-1.5 text-sm mr-2"
                  onSubmitEditing={addPost}
                />
                <Pressable onPress={addPost} className="bg-retro-blue border-2 border-black px-3 py-1 rounded-lg items-center justify-center">
                  <Text className="text-white text-xs font-bold">Post</Text>
                </Pressable>
              </View>
              <Text className="text-[9px] text-retro-dark mt-1 text-center">Visible only to your matched group</Text>
            </View>
          </View>
        ) : (
          <View className="mt-4 bg-sky-100 border-2 border-black rounded-xl p-3">
            <Text className="text-[12px] font-semibold text-retro-ink text-center">Full itineraries unlock after group matching.</Text>
          </View>
        )}

        <Text className="text-xs uppercase tracking-widest font-bold text-retro-dark mt-6 mb-2">Other Experiences</Text>
        {SAMPLE_ITINERARIES.map((item, i) => (
          <View key={i} className="mt-2 bg-retro-paper border-2 border-black shadow-retro-sm rounded-xl p-3 flex-row items-start">
            <View className="mr-3 mt-0.5">
              <Ionicons name="calendar-outline" size={18} color="#6F6256" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-sm text-retro-ink">{item.city} • {item.day}</Text>
              <Text className="text-retro-dark text-xs">{item.activity} • {item.time}</Text>
            </View>
          </View>
        ))}
        <View className="h-20" />
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <NeonHeader title="YOUR TRIPS" />
          <Text style={{ color: RETRO_COLORS.neonMagenta, fontSize: 20, marginLeft: 6 }}>✦</Text>
        </View>
        <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: RETRO_FONT.labelSize, marginBottom: 18 }}>
          Planned small-group getaways
        </Text>

        {isMatched ? (
          <NeonCard variant="cyan" style={{ marginBottom: 16 }}>
            {/* Trip title row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: RETRO_COLORS.keepBg,
                borderWidth: 2, borderColor: RETRO_COLORS.neonCyan,
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <Ionicons name="calendar" size={20} color={RETRO_COLORS.neonCyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '800', fontSize: 15 }}>
                  Current Matched Trip
                </Text>
                <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 12, fontWeight: '600' }}>
                  {tripCity} · This Weekend · 10 members
                </Text>
              </View>
              <NeonButton
                label="GAME"
                onPress={() => router.push('/game' as any)}
                variant="cyan"
                size="sm"
              />
            </View>

            {/* Group members */}
            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Your Group (5 men + 5 women)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {groupMembers.map((m, i) => (
                <View key={i} style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 8, paddingVertical: 3,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: m.gender === 'MALE' ? RETRO_COLORS.neonCyan : RETRO_COLORS.neonMagenta,
                  backgroundColor: 'rgba(10,0,32,0.6)',
                }}>
                  <Ionicons
                    name={m.gender === 'MALE' ? 'man' : 'woman'}
                    size={10}
                    color={m.gender === 'MALE' ? RETRO_COLORS.neonCyan : RETRO_COLORS.neonMagenta}
                  />
                  <Text style={{ marginLeft: 4, fontSize: 11, fontWeight: '600', color: RETRO_COLORS.textPrimary }}>
                    {m.name}
                  </Text>
                </View>
              ))}
            </View>

            {/* Itinerary preview */}
            <View style={{ borderTopWidth: 1, borderTopColor: RETRO_COLORS.neonCyan, opacity: 0.4, marginBottom: 12 }} />
            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Sample Itinerary
            </Text>
            {SAMPLE_ITINERARIES.filter(it => it.city === tripCity).slice(0, 2).map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '600', fontSize: 13, flex: 1 }}>
                  {item.day}: {item.activity}
                </Text>
                <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11 }}>{item.time}</Text>
              </View>
            ))}

            {/* Group Wall */}
            <View style={{ borderTopWidth: 1, borderTopColor: RETRO_COLORS.neonCyan, opacity: 0.4, marginVertical: 12 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="chatbubbles-outline" size={14} color={RETRO_COLORS.neonCyan} />
              <Text style={{ marginLeft: 6, color: RETRO_COLORS.neonCyan, fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>
                GROUP WALL
              </Text>
            </View>
            {wallPosts.map((post) => (
              <View key={post.id} style={{
                backgroundColor: 'rgba(10,0,32,0.7)',
                borderWidth: 1,
                borderColor: RETRO_COLORS.neonMagenta,
                borderRadius: 8,
                padding: 8,
                marginBottom: 8,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: RETRO_COLORS.neonMagenta, fontSize: 11, fontWeight: '700' }}>{post.author}</Text>
                  <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10 }}>{post.time}</Text>
                </View>
                <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 13 }}>{post.text}</Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              <TextInput
                value={newPostText}
                onChangeText={setNewPostText}
                placeholder="Share an update..."
                placeholderTextColor={RETRO_COLORS.textMuted}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(10,0,32,0.8)',
                  borderWidth: 1.5,
                  borderColor: RETRO_COLORS.neonCyan,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  color: RETRO_COLORS.textPrimary,
                  fontSize: 13,
                  marginRight: 8,
                }}
                onSubmitEditing={addPost}
              />
              <NeonButton label="POST" onPress={addPost} variant="cyan" size="sm" />
            </View>
            <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 9, textAlign: 'center', marginTop: 6 }}>
              Visible only to your matched group
            </Text>
          </NeonCard>
        ) : (
          <NeonPanel variant="info" style={{ marginBottom: 16 }}>
            <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 13, textAlign: 'center' }}>
              Full itineraries unlock after group matching.
            </Text>
          </NeonPanel>
        )}

        {/* Other experiences */}
        <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
          Other Experiences
        </Text>
        {SAMPLE_ITINERARIES.map((item, i) => (
          <NeonCard
            key={i}
            variant={i % 2 === 0 ? 'cyan' : 'magenta'}
            style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}
          >
            <Ionicons name="calendar-outline" size={18} color={RETRO_COLORS.neonCyan} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>
                {item.city} · {item.day}
              </Text>
              <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 11, marginTop: 2 }}>
                {item.activity} · {item.time}
              </Text>
            </View>
          </NeonCard>
        ))}
      </ScrollView>
    </SynthwaveBackground>
  );
}
