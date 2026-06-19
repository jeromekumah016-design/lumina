import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';
import { cycleService } from '../services/cycleService';
import { Cycle } from '../types/cycle';

/**
 * Alumni Lumina Cycles — the past-cycle gallery.
 *
 * Gating: hasCompletedCycle is an ACCESS GATE ONLY. The gallery content is always
 * the full alumni set (getAllCycles), never filtered by the current user.
 *   - Not completed → elegant teaser + a discreet demo unlock.
 *   - Completed     → scrollable list of every alumni cycle.
 */
export default function Cycles() {
  const { hasCompletedCycle, completeCycle } = useLuminaState();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const all = await cycleService.getAllCycles();
      if (alive) { setCycles(all); setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <ScrollView className="flex-1 bg-retro-cream px-4 pt-12">
      <View className="flex-row items-center mb-1">
        <Pressable onPress={() => router.back()} className="mr-2 -ml-1">
          <Ionicons name="chevron-back" size={24} color="#1A1612" />
        </Pressable>
        <Text className="text-2xl font-extrabold tracking-tight text-retro-ink">Alumni Cycles</Text>
        <Text className="text-retro-amber ml-1 text-lg -mt-0.5">✦</Text>
      </View>
      <View className="flex-row items-center">
        <View className="bg-retro-ink px-2 py-0.5 rounded-full">
          <Text className="text-[9px] font-bold uppercase tracking-widest text-retro-cream">Alumni only</Text>
        </View>
        <Text className="text-retro-dark text-xs ml-2">Where past groups went together</Text>
      </View>

      {loading ? (
        <View className="mt-20 items-center">
          <ActivityIndicator color="#0284C8" />
        </View>
      ) : hasCompletedCycle ? (
        <UnlockedGallery cycles={cycles} />
      ) : (
        <Teaser cycles={cycles} onUnlock={() => cycles[0] && completeCycle(cycles[0].id)} />
      )}

      <View className="h-20" />
    </ScrollView>
  );
}

function AvatarRow({ cycle }: { cycle: Cycle }) {
  const shown = cycle.participants.slice(0, 4);
  const extra = cycle.groupSize - shown.length;
  return (
    <View className="flex-row items-center">
      {shown.map((p, i) => (
        <Image
          key={p.id}
          source={{ uri: p.avatarUrl }}
          className="w-7 h-7 rounded-full border-2 border-black"
          style={{ marginLeft: i === 0 ? 0 : -10 }}
        />
      ))}
      {extra > 0 && (
        <View className="bg-retro-blue border-2 border-black rounded-full w-7 h-7 items-center justify-center" style={{ marginLeft: -10 }}>
          <Text className="text-[9px] font-bold text-white">+{extra}</Text>
        </View>
      )}
    </View>
  );
}

function CycleCard({ cycle }: { cycle: Cycle }) {
  return (
    <Pressable
      onPress={() => router.push(`/cycle-detail?id=${cycle.id}` as any)}
      className="mt-4 bg-retro-paper border-2 border-black shadow-retro rounded-2xl overflow-hidden"
    >
      <View>
        <Image source={{ uri: cycle.winner.imageUrl }} className="w-full h-44" />
        <View className="absolute top-2 left-2 bg-retro-cream border-2 border-black rounded-full px-2.5 py-0.5">
          <Text className="text-[11px] font-extrabold text-retro-ink">{cycle.city}</Text>
        </View>
        {cycle.averageRating != null && (
          <View className="absolute top-2 right-2 bg-retro-cream border-2 border-black rounded-full px-2 py-0.5 flex-row items-center">
            <Text className="text-retro-amber text-[11px] mr-0.5">★</Text>
            <Text className="text-[11px] font-extrabold text-retro-ink">{cycle.averageRating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="font-extrabold text-retro-ink text-base" numberOfLines={1}>{cycle.winner.title}</Text>
        <Text className="text-retro-dark text-xs mt-0.5">{cycle.startDate} – {cycle.endDate}</Text>
        <View className="flex-row items-center justify-between mt-3">
          <AvatarRow cycle={cycle} />
          <View className="bg-retro-blue border-2 border-black rounded-full px-3 py-1 flex-row items-center">
            <Text className="text-white text-xs font-bold mr-1">View cycle</Text>
            <Ionicons name="arrow-forward" size={12} color="#fff" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function UnlockedGallery({ cycles }: { cycles: Cycle[] }) {
  return (
    <View className="mt-2">
      <Text className="text-retro-dark text-[13px] mt-3">
        {cycles.length} completed cycles from the Lumina community. Tap any to relive the trip.
      </Text>
      {cycles.map((c) => <CycleCard key={c.id} cycle={c} />)}
    </View>
  );
}

function Teaser({ cycles, onUnlock }: { cycles: Cycle[]; onUnlock: () => void }) {
  const sample = cycles.slice(0, 2);
  return (
    <View className="mt-4">
      <View className="bg-retro-paper border-2 border-black shadow-retro rounded-2xl p-4 items-center">
        <View className="bg-retro-amber border-2 border-black rounded-2xl p-3 mb-3">
          <Ionicons name="lock-closed" size={24} color="#1A1612" />
        </View>
        <Text className="text-retro-ink font-extrabold text-lg text-center">Unlock the alumni gallery</Text>
        <Text className="text-retro-dark text-sm text-center mt-1.5 leading-5">
          See where other groups went, the homes they chose, and the memories they made — once you&apos;ve completed your first Lumina cycle.
        </Text>
      </View>

      {/* Blurred / partial peek at real cycles */}
      <Text className="text-xs uppercase tracking-widest font-bold text-retro-dark mt-6 mb-1">A peek inside</Text>
      {sample.map((c) => (
        <View key={c.id} className="mt-3 bg-retro-paper border-2 border-black shadow-retro-sm rounded-2xl overflow-hidden">
          <View>
            <Image source={{ uri: c.winner.imageUrl }} className="w-full h-32 opacity-40" blurRadius={8} />
            <View className="absolute inset-0 items-center justify-center">
              <View className="bg-retro-cream border-2 border-black rounded-full px-3 py-1 flex-row items-center">
                <Ionicons name="lock-closed" size={12} color="#1A1612" />
                <Text className="text-[11px] font-extrabold text-retro-ink ml-1">{c.city} cycle</Text>
              </View>
            </View>
          </View>
        </View>
      ))}

      {/* Discreet demo unlock — stands in for "you finished a trip" */}
      <Pressable onPress={onUnlock} className="mt-6 bg-white border-2 border-black py-2.5 rounded-xl items-center">
        <Text className="text-xs text-retro-ink font-bold">Demo: mark a cycle completed to unlock</Text>
      </Pressable>
    </View>
  );
}
