import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, from: 'Emma', text: 'Loving the Chicago lofts so far!' },
    { id: 2, from: 'Liam', text: 'The Gold Coast one has great views' },
    { id: 3, from: 'Group', text: 'Vote ends soon — choose wisely' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: Date.now(), from: 'You', text }]);
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 bg-retro-cream border-4 border-black shadow-retro">
        <ScrollView className="flex-1 px-4 pt-12" contentContainerStyle={{ paddingBottom: 16 }}>
          <View className="flex-row items-center mb-4">
            <Text className="text-xl font-semibold text-[#1E40AF]">Group Chat</Text>
            <Text className="text-[#F4C95F] ml-1 text-lg -mt-0.5">✦</Text>
          </View>
          {messages.map((m) => (
            <View
              key={m.id}
              className={`mb-3 rounded-2xl p-3 ${m.from === 'You' ? 'bg-[#DBEAFE] self-end max-w-[80%]' : 'bg-gray-50 border border-gray-100'}`}
            >
              {m.from !== 'You' && (
                <View className="flex-row items-center mb-1">
                  <Ionicons name="person-circle-outline" size={16} color="#64748B" />
                  <Text className="font-medium text-sm ml-1 text-[#0F172A]">{m.from}</Text>
                </View>
              )}
              <Text className="text-gray-700">{m.text}</Text>
            </View>
          ))}
          <View className="mt-2 bg-[#DBEAFE] rounded-none border-4 border-black p-3">
            <Text className="text-[11px] text-[#0C4A6E] text-center">Real-time messaging + per-property threads coming in full build.</Text>
          </View>
        </ScrollView>

        {/* Compose bar */}
        <View className="flex-row px-4 py-3 border-t border-gray-200 bg-retro-cream items-center">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Message the group..."
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2 mr-2 text-sm"
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Pressable
            onPress={sendMessage}
            className="bg-[#0284C8] w-9 h-9 rounded-full items-center justify-center"
          >
            <Ionicons name="send" size={16} color="white" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
