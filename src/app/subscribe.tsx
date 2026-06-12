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
    <View className="flex-1 bg-retro-cream">
      <View className="pt-12 px-4 pb-3 bg-retro-cream border-b-2 border-black">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-1 -ml-1 mr-2">
            <Ionicons name="chevron-back" size={22} color="#1A1612" />
          </Pressable>
          <View>
            <View className="flex-row items-center">
              <Text className="text-2xl font-extrabold tracking-tight text-retro-ink">Lumina</Text>
              <Text className="text-retro-amber text-lg ml-0.5 -mt-0.5">✦</Text>
            </View>
            <Text className="text-sm text-retro-dark -mt-0.5">Membership</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 60 }}>
        {!subscribed ? (
          <>
            <Text className="text-3xl font-extrabold tracking-tight text-retro-ink">One membership.{'\n'}Real weekends.</Text>
            <Text className="mt-2 text-retro-dark">Join the club that gets you out of the house and into curated small-group travel with 10 other members.</Text>

            {/* Pricing card */}
            <View className="mt-6 bg-retro-paper border-2 border-black shadow-retro rounded-2xl p-5">
              <View className="flex-row items-baseline">
                <Text className="text-5xl font-extrabold text-retro-ink">${PRICE}</Text>
                <Text className="text-retro-dark ml-1">/mo</Text>
              </View>
              <Text className="text-sm text-retro-dark mt-0.5">Billed monthly. Cancel anytime.</Text>

              <View className="mt-5 pt-4 border-t-2 border-black">
                {BENEFITS.map((b, i) => (
                  <View key={i} className="flex-row items-center mb-2.5">
                    <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                    <Text className="ml-2 text-retro-ink text-[13px] font-medium">{b}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={handleSubscribe}
                disabled={loading}
                className="mt-6 bg-retro-blue py-3.5 rounded-xl border-2 border-black shadow-retro-sm items-center flex-row justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Subscribe for ${PRICE}/mo</Text>
                )}
              </Pressable>

              <Text className="text-[10px] text-center text-retro-dark mt-3">
                After subscribing you can join the matching queue for your city.
              </Text>
            </View>

            <View className="mt-5 bg-sky-100 border-2 border-black rounded-2xl p-4">
              <Text className="text-xs text-retro-ink">
                <Text className="font-extrabold">Important:</Text> Your membership gives you access to be matched into groups of exactly 4 men + 7 women for weekend trips at shared rentals. This is a real in-person social experience with strangers.
              </Text>
            </View>
          </>
        ) : (
          // Subscribed success state
          <View className="items-center mt-4">
            <View className="bg-emerald-100 border-2 border-black rounded-full p-4">
              <Ionicons name="wallet" size={42} color="#10b981" />
            </View>
            <Text className="mt-4 text-2xl font-extrabold text-retro-ink">You're a Lumina member.</Text>
            <Text className="text-center text-retro-dark mt-1">Membership active since {membership?.subscribedAt ? new Date(membership.subscribedAt).toLocaleDateString() : 'today'}.</Text>

            <View className="mt-6 w-full bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl p-4">
              <Text className="font-extrabold text-retro-ink">What's next?</Text>
              <Text className="text-sm text-retro-dark mt-1">Join the queue for your city and get placed into a forming 4M + 7F group.</Text>
            </View>

            <Pressable onPress={handleGoToMatching} className="mt-4 w-full bg-retro-blue py-3.5 rounded-xl border-2 border-black shadow-retro items-center">
              <Text className="text-white font-bold">Go to Matching &amp; Queue</Text>
            </Pressable>

            <Pressable onPress={handleCancel} className="mt-3">
              <Text className="text-rose-600 text-sm font-semibold">Cancel membership (demo)</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {!subscribed && (
        <View className="px-4 pb-6">
          <Pressable onPress={() => router.back()} className="py-3 items-center">
            <Text className="text-retro-dark text-sm font-semibold">Maybe later</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
