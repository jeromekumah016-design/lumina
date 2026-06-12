import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Chat() {
  const messages = [
    { from: 'Emma', text: 'Loving the Chicago lofts so far!' },
    { from: 'Liam', text: 'The Gold Coast one has great views' },
    { from: 'Group', text: 'Vote ends soon — choose wisely' },
  ];
  return (
    <ScrollView className="flex-1 bg-retro-cream px-4 pt-12">
      <View className="flex-row items-center mb-4">
        <Text className="text-2xl font-extrabold tracking-tight text-retro-ink">Group Chat</Text>
        <Text className="text-retro-amber ml-1 text-lg -mt-0.5">✦</Text>
      </View>
      {messages.map((m, i) => (
        <View key={i} className="mb-3 bg-retro-paper border-2 border-black shadow-retro-sm rounded-xl p-3">
          <View className="flex-row items-center mb-1">
            <Ionicons name="person-circle-outline" size={16} color="#1A1612" />
            <Text className="font-bold text-sm ml-1 text-retro-ink">{m.from}</Text>
          </View>
          <Text className="text-retro-ink">{m.text}</Text>
        </View>
      ))}
      <View className="mt-2 bg-sky-100 border-2 border-black rounded-xl p-3">
        <Text className="text-[11px] font-semibold text-retro-ink text-center">Real-time messaging + per-property threads coming in full build.</Text>
      </View>
      <View className="h-16" />
    </ScrollView>
  );
}
