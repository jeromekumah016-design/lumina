import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RETRO_THEME_ENABLED, RETRO_COLORS, RETRO_FONT } from '../theme/retro';
import { SynthwaveBackground } from '../components/retro/SynthwaveBackground';
import { NeonPanel } from '../components/retro/NeonPanel';
import { NeonHeader } from '../components/retro/NeonHeader';

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

  if (!RETRO_THEME_ENABLED) {
    return (
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 bg-retro-cream">
          <ScrollView className="flex-1 px-4 pt-12" contentContainerStyle={{ paddingBottom: 16 }}>
            <View className="flex-row items-center mb-4">
              <Text className="text-2xl font-extrabold tracking-tight text-retro-ink">Group Chat</Text>
              <Text className="text-retro-amber ml-1 text-lg -mt-0.5">✦</Text>
            </View>
            {messages.map((m) => (
              <View
                key={m.id}
                className={`mb-3 rounded-xl p-3 border-2 border-black shadow-retro-sm ${m.from === 'You' ? 'bg-sky-100 self-end max-w-[80%]' : 'bg-retro-paper'}`}
              >
                {m.from !== 'You' && (
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="person-circle-outline" size={16} color="#1A1612" />
                    <Text className="font-bold text-sm ml-1 text-retro-ink">{m.from}</Text>
                  </View>
                )}
                <Text className="text-retro-ink">{m.text}</Text>
              </View>
            ))}
            <View className="mt-2 bg-sky-100 border-2 border-black rounded-xl p-3">
              <Text className="text-[11px] font-semibold text-retro-ink text-center">Real-time messaging + per-property threads coming in full build.</Text>
            </View>
          </ScrollView>

          <View className="flex-row px-4 py-3 border-t-2 border-black bg-retro-cream items-center">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message the group..."
              className="flex-1 bg-white border-2 border-black rounded-xl px-4 py-2 mr-2 text-sm"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <Pressable
              onPress={sendMessage}
              className="bg-retro-blue w-9 h-9 rounded-full items-center justify-center border-2 border-black"
            >
              <Ionicons name="send" size={16} color="white" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Retro synthwave render ──────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SynthwaveBackground>
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 52, paddingBottom: 20 }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <NeonHeader title="GROUP CHAT" />
              <Text style={{ color: RETRO_COLORS.neonMagenta, fontSize: 20, marginLeft: 6 }}>✦</Text>
            </View>

            {/* Messages */}
            {messages.map((m) => {
              const isMe = m.from === 'You';
              return (
                <View
                  key={m.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    marginBottom: 12,
                    backgroundColor: isMe ? 'rgba(0,30,60,0.7)' : RETRO_COLORS.cardBg,
                    borderWidth: 1.5,
                    borderColor: isMe ? RETRO_COLORS.neonCyan : RETRO_COLORS.neonMagenta,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  {!isMe && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons name="person-circle-outline" size={14} color={RETRO_COLORS.neonMagenta} />
                      <Text style={{ color: RETRO_COLORS.neonMagenta, fontWeight: '700', fontSize: 12, marginLeft: 4 }}>
                        {m.from}
                      </Text>
                    </View>
                  )}
                  <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 14 }}>{m.text}</Text>
                </View>
              );
            })}

            <NeonPanel variant="info" style={{ marginTop: 8 }}>
              <Text style={{ color: RETRO_COLORS.textSecondary, fontSize: 11, textAlign: 'center' }}>
                Real-time messaging + per-property threads coming in full build.
              </Text>
            </NeonPanel>
          </ScrollView>

          {/* Compose bar */}
          <View style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1.5,
            borderTopColor: RETRO_COLORS.neonCyan,
            backgroundColor: 'rgba(10,0,32,0.95)',
            alignItems: 'center',
          }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message the group..."
              placeholderTextColor={RETRO_COLORS.textMuted}
              style={{
                flex: 1,
                backgroundColor: 'rgba(10,0,32,0.8)',
                borderWidth: 1.5,
                borderColor: RETRO_COLORS.neonCyan,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 8,
                color: RETRO_COLORS.textPrimary,
                fontSize: 14,
                marginRight: 10,
              }}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <Pressable
              onPress={sendMessage}
              style={{
                width: 38, height: 38,
                borderRadius: 19,
                backgroundColor: RETRO_COLORS.keepBg,
                borderWidth: 2,
                borderColor: RETRO_COLORS.neonCyan,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="send" size={16} color={RETRO_COLORS.neonCyan} />
            </Pressable>
          </View>
        </View>
      </SynthwaveBackground>
    </KeyboardAvoidingView>
  );
}
