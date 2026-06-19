import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';

export default function Feed() {
  const { onboarded, membership, matching, isLoading } = useLuminaState();

  const cities = [
    { name: 'Chicago', desc: 'Midwest charm, urban adventures', members: 11 },
    { name: 'New York', desc: 'Big city energy, iconic views', members: 11 },
    { name: 'Atlanta', desc: 'Southern hospitality, green escapes', members: 11 },
  ];

  const member = membership?.hasActiveMembership;
  const matched = matching?.status === 'matched';

  return (
    <ScrollView className="flex-1 bg-retro-cream px-4 pt-12">
      <View className="flex-row items-center">
        <Text className="text-3xl font-extrabold tracking-tight text-retro-ink">Lumina</Text>
        <Text className="text-retro-amber text-lg ml-0.5 -mt-0.5">✦</Text>
      </View>
      <Text className="text-retro-dark mt-1">Curated small-group travel for platonic friendships.</Text>

      {/* Quick status / entry to new flows */}
      <View className="mt-4 bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-3 flex-row items-center">
        <View className="flex-1">
          <Text className="text-sm font-bold text-retro-ink">{matched ? 'You\'re matched for a trip!' : member ? 'Member • Ready to match' : 'Complete onboarding & subscribe to get matched'}</Text>
          <Text className="text-xs text-retro-dark">5 men + 5 women groups • weekend getaways</Text>
        </View>
        <Pressable onPress={() => router.push((matched ? '/matching' : '/onboarding') as any)} className="bg-retro-blue border-2 border-black px-3 py-1.5 rounded-full">
          <Text className="text-white text-xs font-bold">{matched ? 'View matching' : 'Get started'}</Text>
        </Pressable>
      </View>

      {/* Prominent gate prompt if not ready (task 2 gating) */}
      {!onboarded || !member ? (
        <View className="mt-3 bg-amber-100 border-2 border-black shadow-retro-sm rounded-2xl p-4">
          <Text className="font-extrabold text-retro-ink">Unlock the full Lumina experience</Text>
          <Text className="text-sm text-retro-dark mt-1">Onboard + subscribe to join the matching queue and vote in the Game with your group.</Text>
          <Pressable onPress={() => router.push('/onboarding' as any)} className="mt-3 bg-retro-ink border-2 border-black self-start px-4 py-1.5 rounded-full">
            <Text className="text-white text-xs font-bold">Start Onboarding</Text>
          </Pressable>
        </View>
      ) : null}

      <Text className="text-xs uppercase tracking-widest font-bold text-retro-dark mt-6 mb-3">Upcoming City Experiences</Text>
      {cities.map((c, i) => (
        <View key={i} className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-4 mb-3 flex-row items-center">
          <View className="flex-1">
            <Text className="font-extrabold text-lg text-retro-ink">{c.name}</Text>
            <Text className="text-retro-dark text-sm mt-0.5">{c.desc}</Text>
            <View className="flex-row items-center mt-1.5">
              <Ionicons name="people-outline" size={12} color="#6F6256" />
              <Text className="text-xs text-retro-dark ml-1">{c.members} friends • 3 days</Text>
            </View>
          </View>
          <View className="bg-retro-blue border-2 border-black rounded-full p-2">
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </View>
        </View>
      ))}

      <View className="mt-2 bg-sky-100 border-2 border-black rounded-xl p-3">
        <Text className="text-[12px] font-semibold text-retro-ink text-center">Tap the <Text className="font-extrabold">Game</Text> tab to vote on properties for the next trip.</Text>
      </View>
      <View className="h-20" />
    </ScrollView>
  );
}
