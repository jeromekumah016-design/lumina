import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { cycleService } from '../services/cycleService';
import { Cycle } from '../types/cycle';

const { width } = Dimensions.get('window');
const PHOTO_W = Math.round(width * 0.7);

export default function CycleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [c, isSaved] = await Promise.all([
        cycleService.getCycleById(id || ''),
        cycleService.isSaved(id || ''),
      ]);
      if (alive) { setCycle(c); setSaved(isSaved); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id]);

  const toggleSave = async () => {
    if (!cycle) return;
    const next = await cycleService.toggleSaved(cycle.id);
    setSaved(next);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-retro-cream items-center justify-center">
        <ActivityIndicator color="#0284C8" />
      </View>
    );
  }

  if (!cycle) {
    return (
      <View className="flex-1 bg-retro-cream items-center justify-center px-6">
        <Text className="text-retro-ink font-extrabold text-lg">Cycle not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 bg-retro-blue border-2 border-black px-4 py-2 rounded-full">
          <Text className="text-white font-bold text-sm">Back to gallery</Text>
        </Pressable>
      </View>
    );
  }

  const women = cycle.participants.filter((p) => p.gender === 'FEMALE');
  const men = cycle.participants.filter((p) => p.gender === 'MALE');

  return (
    <ScrollView className="flex-1 bg-retro-cream">
      {/* Hero */}
      <View>
        <Image source={{ uri: cycle.winner.imageUrl }} className="w-full h-64" />
        <Pressable
          onPress={() => router.back()}
          className="absolute top-12 left-4 bg-retro-cream border-2 border-black rounded-full w-9 h-9 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} color="#1A1612" />
        </Pressable>
        <View className="absolute top-12 right-4 bg-retro-cream border-2 border-black rounded-full px-2.5 py-1 flex-row items-center">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-retro-ink">{cycle.city}</Text>
        </View>
      </View>

      <View className="px-4 -mt-6">
        <View className="bg-retro-paper border-2 border-black shadow-retro rounded-2xl p-4">
          <Text className="font-extrabold text-retro-ink text-xl">{cycle.winner.title}</Text>
          <Text className="text-retro-dark text-sm mt-0.5">{cycle.winner.location}</Text>
          <View className="flex-row items-center flex-wrap gap-2 mt-3">
            <View className="bg-white border border-black rounded-full px-2.5 py-1 flex-row items-center">
              <Ionicons name="calendar-outline" size={12} color="#6F6256" />
              <Text className="text-[11px] font-semibold text-retro-ink ml-1">{cycle.startDate} – {cycle.endDate}</Text>
            </View>
            <View className="bg-white border border-black rounded-full px-2.5 py-1 flex-row items-center">
              <Ionicons name="people-outline" size={12} color="#6F6256" />
              <Text className="text-[11px] font-semibold text-retro-ink ml-1">{cycle.groupSize} travelers</Text>
            </View>
            <View className="bg-white border border-black rounded-full px-2.5 py-1 flex-row items-center">
              <Text className="text-[11px] font-semibold text-retro-ink">${cycle.winner.pricePerPerson}/person</Text>
            </View>
            {cycle.averageRating != null && (
              <View className="bg-white border border-black rounded-full px-2.5 py-1 flex-row items-center">
                <Text className="text-retro-amber text-[11px] mr-0.5">★</Text>
                <Text className="text-[11px] font-extrabold text-retro-ink">{cycle.averageRating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Photo gallery */}
      <Text className="text-xs uppercase tracking-widest font-bold text-retro-dark mt-6 mb-2 px-4">Trip photos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4" contentContainerStyle={{ paddingRight: 16 }}>
        {cycle.photos.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            className="rounded-2xl border-2 border-black mr-3"
            style={{ width: PHOTO_W, height: Math.round(PHOTO_W * 0.66) }}
          />
        ))}
      </ScrollView>

      {/* The group */}
      <View className="px-4 mt-6">
        <Text className="text-xs uppercase tracking-widest font-bold text-retro-dark mb-2">The group · {men.length} men + {women.length} women</Text>
        <View className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-3">
          <View className="flex-row flex-wrap">
            {cycle.participants.map((p) => (
              <View key={p.id} className="bg-white border border-black rounded-full px-2 py-0.5 mr-1.5 mb-1.5 flex-row items-center">
                <Image source={{ uri: p.avatarUrl }} className="w-5 h-5 rounded-full mr-1.5 border border-black" />
                <Ionicons name={p.gender === 'MALE' ? 'man' : 'woman'} size={10} color={p.gender === 'MALE' ? '#1E40AF' : '#be185d'} />
                <Text className="ml-1 text-xs font-semibold text-retro-ink">{p.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Highlights */}
      <View className="px-4 mt-6">
        <Text className="text-xs uppercase tracking-widest font-bold text-retro-dark mb-2">Memorable moments</Text>
        {cycle.highlights.map((h, i) => (
          <View key={i} className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-xl p-3 mb-2 flex-row items-start">
            <Text className="text-retro-amber mr-2">✦</Text>
            <Text className="flex-1 text-sm text-retro-ink">{h}</Text>
          </View>
        ))}
      </View>

      {/* Itinerary */}
      <View className="px-4 mt-4">
        <Text className="text-xs uppercase tracking-widest font-bold text-retro-dark mb-2">What they did</Text>
        <View className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-3">
          {cycle.itinerarySummary.map((item, i) => (
            <View key={i} className={`flex-row items-center ${i > 0 ? 'mt-2 pt-2 border-t border-black/10' : ''}`}>
              <View className="bg-retro-blue border border-black rounded-full w-5 h-5 items-center justify-center mr-2">
                <Text className="text-[10px] font-bold text-white">{i + 1}</Text>
              </View>
              <Text className="flex-1 text-sm text-retro-ink">{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Save to inspiration */}
      <View className="px-4 mt-6">
        <Pressable
          onPress={toggleSave}
          className={`border-2 border-black shadow-retro-sm py-3 rounded-xl items-center flex-row justify-center ${saved ? 'bg-retro-amber' : 'bg-retro-paper'}`}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color="#1A1612" />
          <Text className="text-sm font-bold text-retro-ink ml-2">{saved ? 'Saved to your inspiration' : 'Save to my inspiration'}</Text>
        </Pressable>
      </View>

      <View className="h-16" />
    </ScrollView>
  );
}
