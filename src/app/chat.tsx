import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Chat() {
  const messages = [
    { from: 'Emma', text: 'Loving the Chicago lofts so far!' },
    { from: 'Liam', text: 'The Gold Coast one has great views' },
    { from: 'Group', text: 'Vote ends soon — choose wisely' },
  ];
  return (
    <ScrollView className="flex-1 bg-retro-cream border-4 border-black shadow-retro px-4 pt-12">
      <View className="flex-row items-center mb-4">
        <Text className="text-xl font-semibold text-[#1E40AF]">Group Chat</Text>
        <Text className="text-[#F4C95F] ml-1 text-lg -mt-0.5">✦</Text>
      </View>
      {messages.map((m, i) => (
        <View key={i} className="mb-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
          <View className="flex-row items-center mb-1">
            <Ionicons name="person-circle-outline" size={16} color="#64748B" />
            <Text className="font-medium text-sm ml-1 text-[#0F172A]">{m.from}</Text>
          </View>
          <Text className="text-gray-700">{m.text}</Text>
        </View>
      ))}
      <View className="mt-2 bg-[#DBEAFE] rounded-none border-4 border-black p-3">
        <Text className="text-[11px] text-[#0C4A6E] text-center">Real-time messaging + per-property threads coming in full build.</Text>
      </View>
      <View className="h-16" />
    </ScrollView>
  );
}
