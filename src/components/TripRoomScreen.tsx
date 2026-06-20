import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { propertyService } from '../services/propertyService';
import { tripService, ItineraryItem, CostItem } from '../services/tripService';
import { Property } from '../types/property';
import { RETRO_THEME_ENABLED, RETRO_COLORS } from '../theme/retro';
import { SynthwaveBackground } from './retro/SynthwaveBackground';
import { NeonCard } from './retro/NeonCard';
import { NeonButton } from './retro/NeonButton';
import { NeonPanel } from './retro/NeonPanel';
import { NeonHeader } from './retro/NeonHeader';

interface Props {
  city: string;
  propId: string;
}

export default function TripRoomScreen({ city, propId }: Props) {
  const [winner, setWinner] = useState<Property | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [memberCount] = useState(11);

  const [showItinForm, setShowItinForm] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDay, setNewDay] = useState('1');

  const [showCostForm, setShowCostForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPaidBy, setNewPaidBy] = useState('');

  useEffect(() => {
    const load = async () => {
      const [props, itin, costList] = await Promise.all([
        propertyService.getProperties(),
        tripService.getTripItinerary(city),
        tripService.getTripCosts(city),
      ]);
      const prop = props.find(p => p.id === propId) || tripService.getWinningProperty(props);
      setWinner(prop);
      setItinerary(itin);
      setCosts(costList);
    };
    load();
  }, [city, propId]);

  const handleAddItinerary = async () => {
    if (!newActivity.trim()) return;
    const item = await tripService.addItineraryItem(city, {
      day: parseInt(newDay, 10) || 1,
      time: '12:00',
      activity: newActivity.trim(),
      location: newLocation.trim() || 'TBD',
    });
    setItinerary(prev => [...prev, item].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)));
    setNewActivity(''); setNewLocation(''); setShowItinForm(false);
  };

  const handleAddCost = async () => {
    const amount = parseFloat(newAmount);
    if (!newDesc.trim() || isNaN(amount)) return;
    const item = await tripService.addCostItem(city, {
      description: newDesc.trim(),
      amount,
      paidBy: newPaidBy.trim() || 'You',
    });
    setCosts(prev => [...prev, item]);
    setNewDesc(''); setNewAmount(''); setNewPaidBy(''); setShowCostForm(false);
  };

  const perPerson = tripService.getTotalPerPerson(costs, memberCount);

  if (!RETRO_THEME_ENABLED) {
    return (
      <View className="flex-1 bg-retro-cream">
        <View className="pt-12 px-4 pb-3 bg-retro-ink border-b-2 border-black">
          <Pressable onPress={() => router.back()} className="flex-row items-center mb-2">
            <Ionicons name="arrow-back" size={20} color="#D7CCC0" />
            <Text className="ml-2 text-[#D7CCC0] text-sm font-semibold">Back to Game</Text>
          </Pressable>
          <View className="flex-row items-center">
            <Text className="text-2xl font-extrabold tracking-tight text-retro-cream">Trip Room</Text>
            <Text className="ml-2 text-xl">🏠</Text>
          </View>
          {winner && (
            <Text className="text-retro-amber text-sm font-bold mt-0.5">Winner: {winner.title}</Text>
          )}
          <Text className="text-[#A89A8C] text-xs mt-0.5">{city} · {memberCount} members</Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
          {winner && (
            <View className="mx-4 mt-4 bg-retro-amber border-2 border-black shadow-retro rounded-2xl p-3">
              <View className="flex-row items-center mb-1">
                <Text className="text-retro-ink font-extrabold text-base">🏆 {winner.title}</Text>
              </View>
              <Text className="text-xs text-retro-ink">{winner.location.city} · ${winner.pricePerPerson}/person/night</Text>
              <View className="flex-row mt-1 gap-3">
                <Text className="text-xs font-bold text-emerald-800">👍 {winner.keepVotes} keeps</Text>
                <Text className="text-xs font-bold text-rose-700">👎 {winner.eliminateVotes} elims</Text>
              </View>
            </View>
          )}

          <View className="mx-4 mt-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-extrabold text-retro-ink">📅 Itinerary</Text>
              <Pressable onPress={() => setShowItinForm(v => !v)} className="bg-retro-blue px-3 py-1 rounded-full border-2 border-black shadow-retro-sm">
                <Text className="text-white text-xs font-bold">+ Add</Text>
              </Pressable>
            </View>

            {showItinForm && (
              <View className="mb-3 bg-retro-paper border-2 border-black shadow-retro-sm rounded-xl p-3">
                <TextInput value={newActivity} onChangeText={setNewActivity} placeholder="Activity name" className="bg-white border-2 border-black rounded-lg px-3 py-2 mb-2 text-sm" />
                <TextInput value={newLocation} onChangeText={setNewLocation} placeholder="Location (optional)" className="bg-white border-2 border-black rounded-lg px-3 py-2 mb-2 text-sm" />
                <TextInput value={newDay} onChangeText={setNewDay} placeholder="Day (1, 2, 3...)" keyboardType="numeric" className="bg-white border-2 border-black rounded-lg px-3 py-2 mb-2 text-sm" />
                <View className="flex-row gap-2">
                  <Pressable onPress={handleAddItinerary} className="flex-1 bg-retro-blue py-2 rounded-lg border-2 border-black items-center">
                    <Text className="text-white text-sm font-bold">Add</Text>
                  </Pressable>
                  <Pressable onPress={() => setShowItinForm(false)} className="px-4 py-2 rounded-lg bg-white border-2 border-black items-center">
                    <Text className="text-sm font-semibold text-retro-ink">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {itinerary.map(item => (
              <View key={item.id} className="mb-2 flex-row items-start bg-retro-paper border-2 border-black shadow-retro-sm rounded-xl p-3">
                <View className="bg-retro-blue border border-black px-2 py-0.5 rounded-full mr-3">
                  <Text className="text-[10px] font-bold text-white">Day {item.day}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-retro-ink">{item.time} · {item.activity}</Text>
                  <Text className="text-xs text-retro-dark mt-0.5">{item.location}</Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mx-4 mt-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-extrabold text-retro-ink">💰 Cost Split</Text>
              <Pressable onPress={() => setShowCostForm(v => !v)} className="bg-retro-blue px-3 py-1 rounded-full border-2 border-black shadow-retro-sm">
                <Text className="text-white text-xs font-bold">+ Add</Text>
              </Pressable>
            </View>

            {showCostForm && (
              <View className="mb-3 bg-retro-paper border-2 border-black shadow-retro-sm rounded-xl p-3">
                <TextInput value={newDesc} onChangeText={setNewDesc} placeholder="Description" className="bg-white border-2 border-black rounded-lg px-3 py-2 mb-2 text-sm" />
                <TextInput value={newAmount} onChangeText={setNewAmount} placeholder="Amount ($)" keyboardType="numeric" className="bg-white border-2 border-black rounded-lg px-3 py-2 mb-2 text-sm" />
                <TextInput value={newPaidBy} onChangeText={setNewPaidBy} placeholder="Paid by (name)" className="bg-white border-2 border-black rounded-lg px-3 py-2 mb-2 text-sm" />
                <View className="flex-row gap-2">
                  <Pressable onPress={handleAddCost} className="flex-1 bg-retro-blue py-2 rounded-lg border-2 border-black items-center">
                    <Text className="text-white text-sm font-bold">Add</Text>
                  </Pressable>
                  <Pressable onPress={() => setShowCostForm(false)} className="px-4 py-2 rounded-lg bg-white border-2 border-black items-center">
                    <Text className="text-sm font-semibold text-retro-ink">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {costs.map(c => (
              <View key={c.id} className="mb-2 flex-row items-center justify-between bg-retro-paper border-2 border-black shadow-retro-sm rounded-xl p-3">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-retro-ink">{c.description}</Text>
                  <Text className="text-xs text-retro-dark">Paid by {c.paidBy}</Text>
                </View>
                <Text className="text-sm font-extrabold text-retro-ink">${c.amount.toLocaleString()}</Text>
              </View>
            ))}

            {costs.length > 0 && (
              <View className="mt-2 bg-retro-ink border-2 border-black shadow-retro-sm rounded-xl p-3 flex-row items-center justify-between">
                <Text className="text-retro-cream text-sm font-bold">Each person owes</Text>
                <Text className="text-retro-amber text-lg font-extrabold">${perPerson.toFixed(2)}</Text>
              </View>
            )}
          </View>

          <View className="mx-4 mt-5">
            <Pressable
              onPress={() => router.push('/chat' as any)}
              className="bg-retro-blue py-3 rounded-xl border-2 border-black shadow-retro items-center flex-row justify-center gap-2"
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="white" />
              <Text className="text-white font-bold">Chat with the Group</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Retro synthwave render ──────────────────────────────────────────────────
  const neonInput = {
    backgroundColor: 'rgba(10,0,32,0.8)',
    borderWidth: 1.5,
    borderColor: RETRO_COLORS.neonCyan,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: RETRO_COLORS.textPrimary,
    fontSize: 13,
    marginBottom: 8,
  };

  return (
    <SynthwaveBackground>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingTop: 52, paddingHorizontal: 16, paddingBottom: 14,
          borderBottomWidth: 1.5, borderBottomColor: RETRO_COLORS.neonCyan,
          backgroundColor: 'rgba(10,0,32,0.9)',
        }}>
          <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="arrow-back" size={18} color={RETRO_COLORS.neonCyan} />
            <Text style={{ marginLeft: 6, color: RETRO_COLORS.neonCyan, fontSize: 13, fontWeight: '600' }}>Back to Game</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NeonHeader title="TRIP ROOM" />
            <Text style={{ marginLeft: 10, fontSize: 20 }}>🏠</Text>
          </View>
          {winner && (
            <Text style={{ color: RETRO_COLORS.neonYellow, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
              Winner: {winner.title}
            </Text>
          )}
          <Text style={{ color: RETRO_COLORS.textMuted, fontSize: 11, marginTop: 2 }}>
            {city} · {memberCount} members
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          {/* Winner card */}
          {winner && (
            <NeonCard variant="gold" style={{ marginBottom: 16 }}>
              <Text style={{ color: RETRO_COLORS.neonYellow, fontWeight: '800', fontSize: 15, marginBottom: 6 }}>
                🏆 {winner.title}
              </Text>
              <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 12, marginBottom: 8 }}>
                {winner.location.city} · ${winner.pricePerPerson}/person/night
              </Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Text style={{ color: RETRO_COLORS.neonGreen, fontSize: 12, fontWeight: '700' }}>
                  👍 {winner.keepVotes} keeps
                </Text>
                <Text style={{ color: RETRO_COLORS.neonMagenta, fontSize: 12, fontWeight: '700' }}>
                  👎 {winner.eliminateVotes} elims
                </Text>
              </View>
            </NeonCard>
          )}

          {/* Itinerary section */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 15, fontWeight: '800', letterSpacing: 1 }}>
              📅 ITINERARY
            </Text>
            <NeonButton
              label="+ ADD"
              onPress={() => setShowItinForm(v => !v)}
              variant="cyan"
              size="sm"
            />
          </View>

          {showItinForm && (
            <NeonCard variant="cyan" style={{ marginBottom: 12 }}>
              <TextInput value={newActivity} onChangeText={setNewActivity} placeholder="Activity name" placeholderTextColor={RETRO_COLORS.textMuted} style={neonInput} />
              <TextInput value={newLocation} onChangeText={setNewLocation} placeholder="Location (optional)" placeholderTextColor={RETRO_COLORS.textMuted} style={neonInput} />
              <TextInput value={newDay} onChangeText={setNewDay} placeholder="Day (1, 2, 3...)" keyboardType="numeric" placeholderTextColor={RETRO_COLORS.textMuted} style={[neonInput, { marginBottom: 12 }]} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <NeonButton label="ADD" onPress={handleAddItinerary} variant="cyan" size="sm" style={{ flex: 1 }} />
                <NeonButton label="CANCEL" onPress={() => setShowItinForm(false)} variant="magenta" size="sm" />
              </View>
            </NeonCard>
          )}

          {itinerary.map(item => (
            <NeonCard key={item.id} variant="cyan" style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                backgroundColor: RETRO_COLORS.keepBg,
                borderWidth: 1.5, borderColor: RETRO_COLORS.neonCyan,
                paddingHorizontal: 8, paddingVertical: 3,
                borderRadius: 999, marginRight: 12, marginTop: 2,
              }}>
                <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 10, fontWeight: '700' }}>Day {item.day}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>
                  {item.time} · {item.activity}
                </Text>
                <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 11, marginTop: 2 }}>{item.location}</Text>
              </View>
            </NeonCard>
          ))}

          {/* Cost split section */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 8 }}>
            <Text style={{ color: RETRO_COLORS.neonYellow, fontSize: 15, fontWeight: '800', letterSpacing: 1 }}>
              💰 COST SPLIT
            </Text>
            <NeonButton
              label="+ ADD"
              onPress={() => setShowCostForm(v => !v)}
              variant="magenta"
              size="sm"
            />
          </View>

          {showCostForm && (
            <NeonCard variant="magenta" style={{ marginBottom: 12 }}>
              <TextInput value={newDesc} onChangeText={setNewDesc} placeholder="Description" placeholderTextColor={RETRO_COLORS.textMuted} style={[neonInput, { borderColor: RETRO_COLORS.neonMagenta }]} />
              <TextInput value={newAmount} onChangeText={setNewAmount} placeholder="Amount ($)" keyboardType="numeric" placeholderTextColor={RETRO_COLORS.textMuted} style={[neonInput, { borderColor: RETRO_COLORS.neonMagenta }]} />
              <TextInput value={newPaidBy} onChangeText={setNewPaidBy} placeholder="Paid by (name)" placeholderTextColor={RETRO_COLORS.textMuted} style={[neonInput, { borderColor: RETRO_COLORS.neonMagenta, marginBottom: 12 }]} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <NeonButton label="ADD" onPress={handleAddCost} variant="magenta" size="sm" style={{ flex: 1 }} />
                <NeonButton label="CANCEL" onPress={() => setShowCostForm(false)} variant="cyan" size="sm" />
              </View>
            </NeonCard>
          )}

          {costs.map(c => (
            <NeonCard key={c.id} variant="magenta" style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: RETRO_COLORS.textPrimary, fontWeight: '700', fontSize: 13 }}>{c.description}</Text>
                <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 11, marginTop: 2 }}>Paid by {c.paidBy}</Text>
              </View>
              <Text style={{ color: RETRO_COLORS.neonYellow, fontSize: 14, fontWeight: '800' }}>
                ${c.amount.toLocaleString()}
              </Text>
            </NeonCard>
          ))}

          {costs.length > 0 && (
            <NeonPanel variant="success" style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>Each person owes</Text>
              <Text style={{ color: RETRO_COLORS.neonGreen, fontSize: 18, fontWeight: '900' }}>${perPerson.toFixed(2)}</Text>
            </NeonPanel>
          )}

          {/* Chat link */}
          <NeonButton
            label="CHAT WITH THE GROUP"
            onPress={() => router.push('/chat' as any)}
            variant="cyan"
            size="lg"
            fullWidth
          />
        </ScrollView>
      </View>
    </SynthwaveBackground>
  );
}
