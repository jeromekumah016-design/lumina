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
    <ScrollView className="flex-1 bg-retro-cream border-4 border-black shadow-retro px-4 pt-12">
      <View className="flex-row items-center">
        <Text className="text-xl font-semibold text-[#1E40AF]">Your Profile</Text>
        <Text className="text-[#F4C95F] ml-1">✦</Text>
      </View>
      <Text className="text-retro-dark">Lumina member • 11 friends in group</Text>

      {/* Journey status - new */}
      <View className="mt-5 mb-2">
        <Text className="text-xs uppercase tracking-widest text-retro-dark mb-1.5">Your Lumina journey</Text>
        <View className="bg-retro-cream border-4 border-black shadow-retro border border-gray-100 rounded-2xl p-3 flex-row flex-wrap gap-2">
          <View className={`px-2.5 py-1 rounded-full ${onboarded ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            <Text className={`text-[10px] ${onboarded ? 'text-emerald-700' : 'text-retro-dark'}`}>Onboarded {onboarded ? '✓' : ''}</Text>
          </View>
          <View className={`px-2.5 py-1 rounded-full ${member ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            <Text className={`text-[10px] ${member ? 'text-emerald-700' : 'text-retro-dark'}`}>Member {member ? '✓' : ''}</Text>
          </View>
          <View className={`px-2.5 py-1 rounded-full ${matchStatus === 'matched' ? 'bg-emerald-100' : matchStatus === 'queued' ? 'bg-[#DBEAFE]' : 'bg-gray-100'}`}>
            <Text className={`text-[10px] ${matchStatus === 'matched' ? 'text-emerald-700' : 'text-retro-dark'}`}>
              {matchStatus === 'matched' ? 'Matched ✓' : matchStatus === 'queued' ? 'In queue' : 'Not queued'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick actions to new screens */}
      <View className="flex-row gap-2 mb-4">
        <Pressable onPress={() => router.push('/onboarding' as any)} className="flex-1 bg-gray-100 py-2 rounded-2xl items-center">
          <Text className="text-xs font-medium text-gray-700">Complete Onboarding</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/subscribe' as any)} className="flex-1 bg-gray-100 py-2 rounded-2xl items-center">
          <Text className="text-xs font-medium text-gray-700">Manage Membership</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/matching' as any)} className="flex-1 bg-gray-100 py-2 rounded-2xl items-center">
          <Text className="text-xs font-medium text-gray-700">Matching Status</Text>
        </Pressable>
      </View>

      <View className="mt-2 mb-3 flex-row items-center justify-between">
        <Text className="font-semibold text-[#0F172A]">Your Group (7 women + 4 men)</Text>
        <View className="bg-[#DBEAFE] px-2 py-0.5 rounded-full">
          <Text className="text-[10px] text-[#0369A1] font-medium">Matched</Text>
        </View>
      </View>
      {group.map((g, i) => (
        <View key={i} className="flex-row items-center mb-2.5 bg-gray-50 rounded-none border-4 border-black p-2">
          <Image source={{ uri: g.avatar }} className="w-8 h-8 rounded-full mr-3 border border-white" />
          <View className="flex-1">
            <Text className="font-medium">{g.name}</Text>
            <Text className="text-[11px] text-retro-dark">{g.role}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </View>
      ))}
      <Text className="text-[11px] text-gray-400 mt-3 text-center">Full group + chat in Game. Badges, past trips &amp; settings coming soon.</Text>

      {/* QoL - Reset for easy demoing (will be expanded in task 5) */}
      <View className="mt-8 mb-4">
        <Pressable 
          onPress={async () => {
            await resetAllDemoData();
            // Simple feedback
            alert('Demo data reset. Restart the flow from Feed or Profile.');
          }} 
          className="bg-gray-200 py-2.5 rounded-2xl items-center"
        >
          <Text className="text-xs text-gray-600 font-medium">Reset All Demo Data (onboard, membership, votes, etc.)</Text>
        </Pressable>
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}
