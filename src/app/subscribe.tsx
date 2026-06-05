import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';

/**
 * Membership / Subscription screen for Lumina.
 * Mock Stripe-style checkout.
 * Sets hasActiveMembership = true on "subscribe".
 * Clear disclosure of what the membership actually is (small-group co-ed travel club).
 */

const PRICE = 39;
const PLAN = 'Monthly';

const BENEFITS = [
  'Access to curated 4M + 7F weekend trips',
  'Priority matching in your preferred city',
  'All lodging + activities included in trip fee',
  'Safety team (handlers + safety person) on every trip',
  'Post-trip reviews and incident support',
  'Community of members building real friendships',
];

export default function SubscribeScreen() {
  const router = useRouter();
  const { membership, subscribe: sharedSubscribe, refresh } = useLuminaState();
  const [loading, setLoading] = useState(false);

  const subscribed = membership?.hasActiveMembership;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Simulate Stripe Checkout + webhook success
      await new Promise((r) => setTimeout(r, 900));
      await sharedSubscribe();
    } finally {
      setLoading(false);
    }
  };

  const handleGoToMatching = () => {
    router.push('/matching' as any);
  };

  const handleCancel = async () => {
    // For demo we can expose cancel later; for now just refresh after a direct call isn't in hook yet
    await refresh();
  };

  return (
    <View className="flex-1 bg-retro-cream border-4 border-black shadow-retro">
      <View className="pt-12 px-4 pb-4 bg-retro-cream border-4 border-black shadow-retro border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-1 -ml-1 mr-2">
            <Ionicons name="chevron-back" size={22} color="#64748B" />
          </Pressable>
          <View>
            <View className="flex-row items-center">
              <Text className="text-2xl font-semibold text-[#1E40AF]">Lumina</Text>
              <Text className="text-[#F4C95F] text-lg ml-0.5 -mt-0.5">✦</Text>
            </View>
            <Text className="text-sm text-retro-dark -mt-0.5">Membership</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 60 }}>
        {!subscribed ? (
          <>
            <Text className="text-3xl font-semibold text-[#0F172A]">One membership.{'\n'}Real weekends.</Text>
            <Text className="mt-2 text-gray-600">Join the club that gets you out of the house and into curated small-group travel with 10 other members.</Text>

            {/* Pricing card */}
            <View className="mt-6 bg-retro-cream border-4 border-black shadow-retro border border-gray-200 rounded-3xl p-5 shadow-sm">
              <View className="flex-row items-baseline">
                <Text className="text-5xl font-semibold text-[#1E40AF]">${PRICE}</Text>
                <Text className="text-retro-dark ml-1">/mo</Text>
              </View>
              <Text className="text-sm text-retro-dark mt-0.5">Billed monthly. Cancel anytime.</Text>

              <View className="mt-5 pt-4 border-t border-gray-100">
                {BENEFITS.map((b, i) => (
                  <View key={i} className="flex-row items-center mb-2.5">
                    <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                    <Text className="ml-2 text-gray-700 text-[13px]">{b}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={handleSubscribe}
                disabled={loading}
                className="mt-6 bg-[#1E40AF] py-3.5 rounded-2xl items-center flex-row justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Subscribe for ${PRICE}/mo</Text>
                )}
              </Pressable>

              <Text className="text-[10px] text-center text-gray-400 mt-3">
                After subscribing you can join the matching queue for your city.
              </Text>
            </View>

            <View className="mt-5 bg-[#DBEAFE] rounded-2xl p-4">
              <Text className="text-xs text-[#0C4A6E]">
                <Text className="font-semibold">Important:</Text> Your membership gives you access to be matched into groups of exactly 4 men + 7 women for weekend trips at shared rentals. This is a real in-person social experience with strangers.
              </Text>
            </View>
          </>
        ) : (
          // Subscribed success state
          <View className="items-center mt-4">
            <View className="bg-emerald-100 rounded-full p-4">
              <Ionicons name="wallet" size={42} color="#10b981" />
            </View>
            <Text className="mt-4 text-2xl font-semibold text-emerald-700">You're a Lumina member.</Text>
            <Text className="text-center text-gray-600 mt-1">Membership active since {membership?.subscribedAt ? new Date(membership.subscribedAt).toLocaleDateString() : 'today'}.</Text>

            <View className="mt-6 w-full bg-retro-cream border-4 border-black shadow-retro border border-gray-100 rounded-2xl p-4">
              <Text className="font-semibold">What's next?</Text>
              <Text className="text-sm text-gray-600 mt-1">Join the queue for your city and get placed into a forming 4M + 7F group.</Text>
            </View>

            <Pressable onPress={handleGoToMatching} className="mt-4 w-full bg-[#0284C8] py-3.5 rounded-2xl items-center">
              <Text className="text-white font-semibold">Go to Matching &amp; Queue</Text>
            </Pressable>

            <Pressable onPress={handleCancel} className="mt-3">
              <Text className="text-red-500 text-sm">Cancel membership (demo)</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {!subscribed && (
        <View className="px-4 pb-6">
          <Pressable onPress={() => router.back()} className="py-3 items-center">
            <Text className="text-retro-dark text-sm">Maybe later</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
