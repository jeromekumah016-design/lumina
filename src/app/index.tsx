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
    <ScrollView className="flex-1 bg-retro-cream border-4 border-black shadow-retro px-4 pt-12">
      <View className="flex-row items-center">
        <Text className="text-3xl font-semibold text-[#1E40AF]">Lumina</Text>
        <Text className="text-[#F4C95F] text-lg ml-0.5 -mt-0.5">✦</Text>
      </View>
      <Text className="text-gray-600 mt-1">Curated small-group travel for platonic friendships.</Text>

      {/* Quick status / entry to new flows */}
      <View className="mt-4 bg-retro-cream border-4 border-black shadow-retro border border-gray-100 rounded-2xl p-3 flex-row items-center">
        <View className="flex-1">
          <Text className="text-sm font-medium">{matched ? 'You\'re matched for a trip!' : member ? 'Member • Ready to match' : 'Complete onboarding & subscribe to get matched'}</Text>
          <Text className="text-xs text-retro-dark">4 men + 7 women groups • weekend getaways</Text>
        </View>
        <Pressable onPress={() => router.push((matched ? '/matching' : '/onboarding') as any)} className="bg-[#0284C8] px-3 py-1.5 rounded-full">
          <Text className="text-white text-xs font-semibold">{matched ? 'View matching' : 'Get started'}</Text>
        </Pressable>
      </View>

      {/* Prominent gate prompt if not ready (task 2 gating) */}
      {!onboarded || !member ? (
        <View className="mt-3 bg-[#FEF3C7] border border-[#F59E0B] rounded-2xl p-4">
          <Text className="font-semibold text-[#92400E]">Unlock the full Lumina experience</Text>
          <Text className="text-sm text-[#92400E] mt-1">Onboard + subscribe to join the matching queue and vote in the Game with your group.</Text>
          <Pressable onPress={() => router.push('/onboarding' as any)} className="mt-3 bg-[#92400E] self-start px-4 py-1.5 rounded-full">
            <Text className="text-white text-xs font-semibold">Start Onboarding</Text>
          </Pressable>
        </View>
      ) : null}

      <Text className="text-lg font-semibold mt-6 mb-3 text-[#0F172A]">Upcoming City Experiences</Text>
      {cities.map((c, i) => (
        <Pressable
          key={i}
          onPress={() => router.push('/game' as any)}
          className="bg-gray-50 rounded-2xl p-4 mb-3 flex-row items-center border border-gray-100"
        >
          <View className="flex-1">
            <Text className="font-semibold text-lg text-[#0F172A]">{c.name}</Text>
            <Text className="text-gray-600 text-sm mt-0.5">{c.desc}</Text>
            <View className="flex-row items-center mt-1.5">
              <Ionicons name="people-outline" size={12} color="#64748B" />
              <Text className="text-xs text-retro-dark ml-1">{c.members} friends • 3 days</Text>
            </View>
          </View>
          <View className="bg-[#0284C8]/10 rounded-full p-2">
            <Ionicons name="chevron-forward" size={18} color="#0284C8" />
          </View>
        </Pressable>
      ))}

      <View className="mt-2 bg-[#DBEAFE] rounded-none border-4 border-black p-3">
        <Text className="text-[12px] text-[#0C4A6E] text-center">Tap the <Text className="font-semibold">Game</Text> tab to vote on properties for the next trip.</Text>
      </View>
      <View className="h-20" />
    </ScrollView>
  );
}
