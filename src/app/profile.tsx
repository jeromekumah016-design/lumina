import React from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';

export default function Profile() {
  const { onboarded, membership, matching, resetAllDemoData, isLoading } = useLuminaState();

  const group = [
    { name: 'Emma', role: 'Woman', avatar: 'https://i.pravatar.cc/32?img=28' },
    { name: 'Olivia', role: 'Woman', avatar: 'https://i.pravatar.cc/32?img=29' },
    { name: 'Liam', role: 'Man', avatar: 'https://i.pravatar.cc/32?img=12' },
    // ... abbreviated, full 11 in Game
  ];

  const member = membership?.hasActiveMembership;
  const matchStatus = matching?.status;

  return (
    <ScrollView className="flex-1 bg-retro-cream px-4 pt-12">
      <View className="flex-row items-center">
        <Text className="text-2xl font-extrabold tracking-tight text-retro-ink">Your Profile</Text>
        <Text className="text-retro-amber ml-1">✦</Text>
      </View>
      <Text className="text-retro-dark">Lumina member • 10 friends in group</Text>

      {/* Journey status - new */}
      <View className="mt-5 mb-2">
        <Text className="text-xs uppercase tracking-widest font-bold text-retro-dark mb-1.5">Your Lumina journey</Text>
        <View className="bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-3 flex-row flex-wrap gap-2">
          <View className={`px-2.5 py-1 rounded-full border border-black ${onboarded ? 'bg-emerald-100' : 'bg-white'}`}>
            <Text className={`text-[10px] font-bold ${onboarded ? 'text-emerald-800' : 'text-retro-dark'}`}>Onboarded {onboarded ? '✓' : ''}</Text>
          </View>
          <View className={`px-2.5 py-1 rounded-full border border-black ${member ? 'bg-emerald-100' : 'bg-white'}`}>
            <Text className={`text-[10px] font-bold ${member ? 'text-emerald-800' : 'text-retro-dark'}`}>Member {member ? '✓' : ''}</Text>
          </View>
          <View className={`px-2.5 py-1 rounded-full border border-black ${matchStatus === 'matched' ? 'bg-emerald-100' : matchStatus === 'queued' ? 'bg-sky-100' : 'bg-white'}`}>
            <Text className={`text-[10px] font-bold ${matchStatus === 'matched' ? 'text-emerald-800' : 'text-retro-dark'}`}>
              {matchStatus === 'matched' ? 'Matched ✓' : matchStatus === 'queued' ? 'In queue' : 'Not queued'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick actions to new screens */}
      <View className="flex-row gap-2 mb-4">
        <Pressable onPress={() => router.push('/onboarding' as any)} className="flex-1 bg-retro-paper border-2 border-black shadow-retro-sm py-2 rounded-xl items-center">
          <Text className="text-xs font-bold text-retro-ink">Complete Onboarding</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/subscribe' as any)} className="flex-1 bg-retro-paper border-2 border-black shadow-retro-sm py-2 rounded-xl items-center">
          <Text className="text-xs font-bold text-retro-ink">Manage Membership</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/matching' as any)} className="flex-1 bg-retro-paper border-2 border-black shadow-retro-sm py-2 rounded-xl items-center">
          <Text className="text-xs font-bold text-retro-ink">Matching Status</Text>
        </Pressable>
      </View>

      <View className="mt-2 mb-3 flex-row items-center justify-between">
        <Text className="font-extrabold text-retro-ink">Your Group (5 women + 5 men)</Text>
        <View className="bg-sky-100 border border-black px-2 py-0.5 rounded-full">
          <Text className="text-[10px] text-retro-ink font-bold">Matched</Text>
        </View>
      </View>
      {group.map((g, i) => (
        <View key={i} className="flex-row items-center mb-2.5 bg-retro-paper border-2 border-black shadow-retro-sm rounded-xl p-2">
          <Image source={{ uri: g.avatar }} className="w-8 h-8 rounded-full mr-3 border border-black" />
          <View className="flex-1">
            <Text className="font-bold text-retro-ink">{g.name}</Text>
            <Text className="text-[11px] text-retro-dark">{g.role}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#6F6256" />
        </View>
      ))}
      <Text className="text-[11px] text-retro-dark mt-3 text-center">Full group + chat in Game. Badges &amp; settings coming soon.</Text>

      {/* Almost-hidden alumni entry point — quiet by design */}
      <Pressable onPress={() => router.push('/cycles' as any)} className="mt-3 flex-row items-center justify-center opacity-60">
        <Text className="text-retro-amber text-[10px] mr-1">✦</Text>
        <Text className="text-[10px] text-retro-dark underline">Alumni Lumina cycles</Text>
        <Ionicons name="chevron-forward" size={11} color="#8A7A6E" />
      </Pressable>

      {/* QoL - Reset for easy demoing (will be expanded in task 5) */}
      <View className="mt-8 mb-4">
        <Pressable
          onPress={async () => {
            await resetAllDemoData();
            // Simple feedback
            alert('Demo data reset. Restart the flow from Feed or Profile.');
          }}
          className="bg-white border-2 border-black py-2.5 rounded-xl items-center"
        >
          <Text className="text-xs text-retro-ink font-bold">Reset All Demo Data (onboard, membership, votes, etc.)</Text>
        </Pressable>
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}
