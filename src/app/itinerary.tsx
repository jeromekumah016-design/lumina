import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLuminaState } from '../context/LuminaContext';

export default function Trips() {
  const { isMatched, currentTripCity, matchedGroup } = useLuminaState();

  // Tiny Trip Wall state (task 4) - local for demo, lightweight
  const [wallPosts, setWallPosts] = useState([
    { id: 1, author: 'Emma', text: 'Excited for the Chicago trip! Anyone have restaurant recs?', time: '2h ago' },
    { id: 2, author: 'Liam', text: 'The property voting is going well so far 👍', time: '1h ago' },
  ]);
  const [newPostText, setNewPostText] = useState('');

  const addPost = () => {
    if (!newPostText.trim()) return;
    const post = {
      id: Date.now(),
      author: 'You',
      text: newPostText.trim(),
      time: 'just now',
    };
    setWallPosts([post, ...wallPosts]);
    setNewPostText('');
  };

  const sampleItineraries = [
    { city: 'Chicago', day: 'Day 1', activity: 'Arrival & Wicker Park walk', time: 'Evening' },
    { city: 'Chicago', day: 'Day 2', activity: 'Property voting + group dinner', time: 'Afternoon' },
    { city: 'New York', day: 'Day 1', activity: 'Brooklyn exploration', time: 'Morning' },
    { city: 'Atlanta', day: 'Day 3', activity: 'Decatur market & close', time: 'All day' },
  ];

  // Use matched group or fallback to standard 11
  const groupMembers = matchedGroup || [
    { name: 'Emma', gender: 'FEMALE' },
    { name: 'Olivia', gender: 'FEMALE' },
    { name: 'Sophia', gender: 'FEMALE' },
    { name: 'Isabella', gender: 'FEMALE' },
    { name: 'Mia', gender: 'FEMALE' },
    { name: 'Ava', gender: 'FEMALE' },
    { name: 'Charlotte', gender: 'FEMALE' },
    { name: 'Liam', gender: 'MALE' },
    { name: 'Noah', gender: 'MALE' },
    { name: 'Oliver', gender: 'MALE' },
    { name: 'James', gender: 'MALE' },
  ];

  return (
    <ScrollView className="flex-1 bg-retro-cream border-4 border-black shadow-retro px-4 pt-12">
      <View className="flex-row items-center mb-1">
        <Text className="text-2xl font-semibold text-[#1E40AF]">Your Trips</Text>
        <Text className="text-[#F4C95F] ml-1 text-lg -mt-0.5">✦</Text>
      </View>
      <Text className="text-retro-dark">Planned small-group getaways</Text>

      {/* Matched trip - task 3 upgrade */}
      {isMatched ? (
        <View className="mt-4 bg-retro-cream border-4 border-black shadow-retro border-2 border-[#0284C8] rounded-2xl p-4 shadow-sm">
          <View className="flex-row items-center mb-2">
            <View className="bg-[#0284C8] rounded-none border-4 border-black p-2 mr-3">
              <Ionicons name="calendar" size={20} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-[#0F172A] text-lg">Your Current Matched Trip</Text>
              <Text className="text-sm text-[#0284C8]">{currentTripCity || 'Your City'} • This Weekend • 11 members</Text>
            </View>
            <Pressable onPress={() => router.push('/game' as any)} className="bg-[#0284C8] px-3 py-1.5 rounded-full">
              <Text className="text-white text-xs font-semibold">Go to Game</Text>
            </Pressable>
          </View>

          {/* Group members preview */}
          <View className="mt-2">
            <Text className="text-xs uppercase tracking-widest text-retro-dark mb-1">Your Group (4 men + 7 women)</Text>
            <View className="flex-row flex-wrap">
              {groupMembers.map((m, i) => (
                <View key={i} className="bg-gray-100 rounded-full px-2 py-0.5 mr-1 mb-1 flex-row items-center">
                  <Ionicons name={m.gender === 'MALE' ? 'man' : 'woman'} size={10} color={m.gender === 'MALE' ? '#1E40AF' : '#be185d'} />
                  <Text className="ml-1 text-xs">{m.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sample activities for the trip */}
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-xs uppercase tracking-widest text-retro-dark mb-1">Sample Itinerary</Text>
            {sampleItineraries.filter(i => i.city === (currentTripCity || 'Chicago')).slice(0, 2).map((item, i) => (
              <View key={i} className="flex-row items-center mb-1">
                <Text className="text-sm font-medium flex-1">{item.day}: {item.activity}</Text>
                <Text className="text-xs text-gray-400">{item.time}</Text>
              </View>
            ))}
          </View>

          {/* Task 4: Tiny Trip Wall / Activity Wall integrated here */}
          <View className="mt-4 pt-3 border-t border-gray-100">
            <View className="flex-row items-center mb-2">
              <Ionicons name="chatbubbles-outline" size={14} color="#0284C8" />
              <Text className="ml-1 text-xs uppercase tracking-widest text-[#0284C8] font-medium">Group Wall</Text>
            </View>

            {/* Posts list */}
            {wallPosts.map((post) => (
              <View key={post.id} className="bg-gray-50 rounded-lg p-2 mb-1.5">
                <View className="flex-row justify-between">
                  <Text className="text-xs font-semibold">{post.author}</Text>
                  <Text className="text-[10px] text-gray-400">{post.time}</Text>
                </View>
                <Text className="text-sm text-gray-700 mt-0.5">{post.text}</Text>
              </View>
            ))}

            {/* Add post input */}
            <View className="flex-row mt-1">
              <TextInput
                value={newPostText}
                onChangeText={setNewPostText}
                placeholder="Share an update with the group..."
                className="flex-1 bg-retro-cream border-4 border-black shadow-retro border border-gray-200 rounded-lg px-3 py-1.5 text-sm mr-2"
                onSubmitEditing={addPost}
              />
              <Pressable onPress={addPost} className="bg-[#0284C8] px-3 py-1 rounded-lg items-center justify-center">
                <Text className="text-white text-xs font-semibold">Post</Text>
              </Pressable>
            </View>
            <Text className="text-[9px] text-gray-400 mt-1 text-center">Visible only to your matched group</Text>
          </View>
        </View>
      ) : (
        <View className="mt-2 bg-[#DBEAFE] rounded-none border-4 border-black p-3">
          <Text className="text-[12px] text-[#0C4A6E] text-center">Full itineraries unlock after group matching.</Text>
        </View>
      )}

      {/* Other / sample experiences */}
      <Text className="text-sm font-semibold mt-6 mb-2 text-gray-600">Other Experiences</Text>
      {sampleItineraries.map((item, i) => (
        <View key={i} className="mt-2 bg-gray-50 border border-gray-100 rounded-2xl p-3 flex-row items-start">
          <View className="mr-3 mt-0.5">
            <Ionicons name="calendar-outline" size={18} color="#64748B" />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-sm">{item.city} • {item.day}</Text>
            <Text className="text-gray-600 text-xs">{item.activity} • {item.time}</Text>
          </View>
        </View>
      ))}

      <View className="h-20" />
    </ScrollView>
  );
}
