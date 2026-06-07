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

interface Props {
  city: string;
  propId: string;
}

export default function TripRoomScreen({ city, propId }: Props) {
  const [winner, setWinner] = useState<Property | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [memberCount] = useState(11);

  // Add-itinerary form state
  const [showItinForm, setShowItinForm] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDay, setNewDay] = useState('1');

  // Add-cost form state
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

  return (
    <View className="flex-1 bg-retro-cream">
      {/* Header */}
      <View className="pt-12 px-4 pb-3 bg-[#0F172A]">
        <Pressable onPress={() => router.back()} className="flex-row items-center mb-2">
          <Ionicons name="arrow-back" size={20} color="#94A3B8" />
          <Text className="ml-2 text-[#94A3B8] text-sm">Back to Game</Text>
        </Pressable>
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold text-white">Trip Room</Text>
          <Text className="ml-2 text-xl">🏠</Text>
        </View>
        {winner && (
          <Text className="text-[#0284C8] text-sm mt-0.5">Winner: {winner.title}</Text>
        )}
        <Text className="text-[#64748B] text-xs mt-0.5">{city} · {memberCount} members</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Winner card */}
        {winner && (
          <View className="mx-4 mt-4 bg-amber-50 border border-amber-300 rounded-2xl p-3">
            <View className="flex-row items-center mb-1">
              <Text className="text-amber-600 font-bold text-base">🏆 {winner.title}</Text>
            </View>
            <Text className="text-xs text-amber-700">{winner.location.city} · ${winner.pricePerPerson}/person/night</Text>
            <View className="flex-row mt-1 gap-3">
              <Text className="text-xs text-emerald-700">👍 {winner.keepVotes} keeps</Text>
              <Text className="text-xs text-rose-600">👎 {winner.eliminateVotes} elims</Text>
            </View>
          </View>
        )}

        {/* Itinerary */}
        <View className="mx-4 mt-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-bold text-[#0F172A]">📅 Itinerary</Text>
            <Pressable onPress={() => setShowItinForm(v => !v)} className="bg-[#0284C8] px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">+ Add</Text>
            </Pressable>
          </View>

          {showItinForm && (
            <View className="mb-3 bg-white border border-gray-200 rounded-xl p-3">
              <TextInput
                value={newActivity}
                onChangeText={setNewActivity}
                placeholder="Activity name"
                className="border border-gray-300 rounded px-3 py-2 mb-2 text-sm"
              />
              <TextInput
                value={newLocation}
                onChangeText={setNewLocation}
                placeholder="Location (optional)"
                className="border border-gray-300 rounded px-3 py-2 mb-2 text-sm"
              />
              <TextInput
                value={newDay}
                onChangeText={setNewDay}
                placeholder="Day (1, 2, 3...)"
                keyboardType="numeric"
                className="border border-gray-300 rounded px-3 py-2 mb-2 text-sm"
              />
              <View className="flex-row gap-2">
                <Pressable onPress={handleAddItinerary} className="flex-1 bg-[#0284C8] py-2 rounded-lg items-center">
                  <Text className="text-white text-sm font-semibold">Add</Text>
                </Pressable>
                <Pressable onPress={() => setShowItinForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 items-center">
                  <Text className="text-sm text-gray-600">Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {itinerary.map(item => (
            <View key={item.id} className="mb-2 flex-row items-start bg-white border border-gray-100 rounded-xl p-3">
              <View className="bg-[#DBEAFE] px-2 py-0.5 rounded-full mr-3">
                <Text className="text-[10px] font-bold text-[#0284C8]">Day {item.day}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#0F172A]">{item.time} · {item.activity}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">{item.location}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Cost Split */}
        <View className="mx-4 mt-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-bold text-[#0F172A]">💰 Cost Split</Text>
            <Pressable onPress={() => setShowCostForm(v => !v)} className="bg-[#0284C8] px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">+ Add</Text>
            </Pressable>
          </View>

          {showCostForm && (
            <View className="mb-3 bg-white border border-gray-200 rounded-xl p-3">
              <TextInput
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder="Description"
                className="border border-gray-300 rounded px-3 py-2 mb-2 text-sm"
              />
              <TextInput
                value={newAmount}
                onChangeText={setNewAmount}
                placeholder="Amount ($)"
                keyboardType="numeric"
                className="border border-gray-300 rounded px-3 py-2 mb-2 text-sm"
              />
              <TextInput
                value={newPaidBy}
                onChangeText={setNewPaidBy}
                placeholder="Paid by (name)"
                className="border border-gray-300 rounded px-3 py-2 mb-2 text-sm"
              />
              <View className="flex-row gap-2">
                <Pressable onPress={handleAddCost} className="flex-1 bg-[#0284C8] py-2 rounded-lg items-center">
                  <Text className="text-white text-sm font-semibold">Add</Text>
                </Pressable>
                <Pressable onPress={() => setShowCostForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 items-center">
                  <Text className="text-sm text-gray-600">Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {costs.map(c => (
            <View key={c.id} className="mb-2 flex-row items-center justify-between bg-white border border-gray-100 rounded-xl p-3">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#0F172A]">{c.description}</Text>
                <Text className="text-xs text-gray-500">Paid by {c.paidBy}</Text>
              </View>
              <Text className="text-sm font-bold text-[#0F172A]">${c.amount.toLocaleString()}</Text>
            </View>
          ))}

          {costs.length > 0 && (
            <View className="mt-2 bg-[#0F172A] rounded-xl p-3 flex-row items-center justify-between">
              <Text className="text-white text-sm font-semibold">Each person owes</Text>
              <Text className="text-emerald-400 text-lg font-bold">${perPerson.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Chat link */}
        <View className="mx-4 mt-5">
          <Pressable
            onPress={() => router.push('/chat' as any)}
            className="bg-[#0284C8] py-3 rounded-2xl items-center flex-row justify-center gap-2"
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="white" />
            <Text className="text-white font-semibold">Chat with the Group</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
