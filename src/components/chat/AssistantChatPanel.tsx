import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { RETRO_COLORS, RETRO_GLOW, RETRO_BORDERS, RETRO_FONT, RETRO_SIZE, RETRO_THEME_ENABLED } from '../../theme/retro';
import { getAssistantReply } from '../../lib/assistant';
import { SUGGESTED_QUESTIONS } from '../../lib/assistant/knowledgeBase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  followUps?: string[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let msgIdCounter = 0;
function nextId() { return String(++msgIdCounter); }

const WELCOME: Message = {
  id: '0',
  role: 'assistant',
  text: 'Hey! I\'m your Lumina guide. Ask me anything about how the app works — the Game, matching, trips, membership, or anything else.',
  followUps: SUGGESTED_QUESTIONS.slice(0, 3),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserBubble({ text }: { text: string }) {
  if (!RETRO_THEME_ENABLED) {
    return (
      <View style={{ alignSelf: 'flex-end', marginVertical: 4, maxWidth: '80%' }}>
        <View style={{ backgroundColor: '#0284C8', borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>{text}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={{ alignSelf: 'flex-end', marginVertical: 5, maxWidth: '82%' }}>
      <View
        style={{
          backgroundColor: 'rgba(0,20,60,0.9)',
          borderRadius: 14,
          borderBottomRightRadius: 2,
          borderWidth: 1.5,
          borderColor: RETRO_COLORS.neonCyan,
          paddingHorizontal: 14,
          paddingVertical: 9,
          ...RETRO_GLOW.cyan,
        }}
      >
        <Text style={{ color: RETRO_COLORS.neonCyan, fontSize: 14, fontWeight: '500' }}>{text}</Text>
      </View>
    </View>
  );
}

function BotBubble({ text, followUps, onFollowUp }: { text: string; followUps?: string[]; onFollowUp: (q: string) => void }) {
  if (!RETRO_THEME_ENABLED) {
    return (
      <View style={{ alignSelf: 'flex-start', marginVertical: 4, maxWidth: '85%' }}>
        <View style={{ backgroundColor: '#F3F4F6', borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: '#111', fontSize: 14 }}>{text}</Text>
        </View>
        {followUps && followUps.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 }}>
            {followUps.map(q => (
              <Pressable key={q} onPress={() => onFollowUp(q)} style={{ backgroundColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ fontSize: 12, color: '#374151' }}>{q}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }
  return (
    <View style={{ alignSelf: 'flex-start', marginVertical: 5, maxWidth: '85%' }}>
      <View
        style={{
          backgroundColor: 'rgba(30,0,60,0.85)',
          borderRadius: 14,
          borderBottomLeftRadius: 2,
          borderWidth: 1.5,
          borderColor: RETRO_COLORS.neonMagenta,
          paddingHorizontal: 14,
          paddingVertical: 9,
          ...RETRO_GLOW.magenta,
        }}
      >
        <Text style={{ color: RETRO_COLORS.textPrimary, fontSize: 14, lineHeight: 20 }}>{text}</Text>
      </View>
      {followUps && followUps.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 }}>
          {followUps.map(q => (
            <Pressable
              key={q}
              onPress={() => onFollowUp(q)}
              style={{
                backgroundColor: 'rgba(255,0,255,0.08)',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: RETRO_COLORS.neonMagenta,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Text style={{ fontSize: 11, color: RETRO_COLORS.neonMagenta, letterSpacing: 0.3 }}>{q}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ]),
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 200);
    const a3 = anim(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  const dotColor = RETRO_THEME_ENABLED ? RETRO_COLORS.neonMagenta : '#9CA3AF';
  const bgColor = RETRO_THEME_ENABLED ? 'rgba(30,0,60,0.85)' : '#F3F4F6';
  const borderStyle = RETRO_THEME_ENABLED
    ? { borderWidth: 1.5, borderColor: RETRO_COLORS.neonMagenta }
    : {};

  return (
    <View style={{ alignSelf: 'flex-start', marginVertical: 5 }}>
      <View style={[{ backgroundColor: bgColor, borderRadius: 14, borderBottomLeftRadius: 2, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 5 }, borderStyle]}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dotColor, opacity: dot }}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function AssistantChatPanel({ visible, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible, slideAnim]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = { id: nextId(), role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const reply = await getAssistantReply(trimmed);
      const botMsg: Message = {
        id: nextId(),
        role: 'assistant',
        text: reply.text,
        followUps: reply.followUps,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: nextId(), role: 'assistant', text: 'Something went wrong. Please try again!', followUps: [] },
      ]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  }, [isTyping, scrollToBottom]);

  const retro = RETRO_THEME_ENABLED;

  const panelBg = retro ? 'rgba(4,0,15,0.98)' : '#FFFFFF';
  const headerBg = retro ? 'rgba(8,0,24,1)' : '#F9FAFB';
  const headerBorder = retro ? RETRO_COLORS.neonCyan : '#E5E7EB';
  const inputBg = retro ? 'rgba(8,0,32,0.95)' : '#F3F4F6';
  const inputBorder = retro ? RETRO_COLORS.neonMagenta : '#D1D5DB';
  const inputText_ = retro ? RETRO_COLORS.textPrimary : '#111827';
  const inputPlaceholder = retro ? RETRO_COLORS.textMuted : '#9CA3AF';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '85%',
              backgroundColor: panelBg,
              borderLeftWidth: retro ? 2 : 1,
              borderLeftColor: headerBorder,
              transform: [{ translateX: slideAnim }],
              height: '100%',
              ...(retro ? RETRO_GLOW.cyan : {}),
            }}
          >
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Header */}
              <View
                style={{
                  paddingTop: 56,
                  paddingBottom: 14,
                  paddingHorizontal: 18,
                  backgroundColor: headerBg,
                  borderBottomWidth: retro ? 2 : 1,
                  borderBottomColor: headerBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <Text
                    style={
                      retro
                        ? {
                            color: RETRO_COLORS.neonCyan,
                            fontSize: RETRO_FONT.subheaderSize,
                            fontWeight: '900',
                            letterSpacing: RETRO_FONT.letterSpacing,
                            textShadowColor: RETRO_COLORS.neonCyan,
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 12,
                          }
                        : { color: '#111827', fontSize: 18, fontWeight: '700' }
                    }
                  >
                    LUMINA GUIDE
                  </Text>
                  <Text
                    style={
                      retro
                        ? { color: RETRO_COLORS.textSecondary, fontSize: RETRO_FONT.labelSize, marginTop: 2 }
                        : { color: '#6B7280', fontSize: 12, marginTop: 2 }
                    }
                  >
                    Ask me anything about the app
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  style={
                    retro
                      ? {
                          backgroundColor: 'rgba(255,0,255,0.1)',
                          borderWidth: 1.5,
                          borderColor: RETRO_COLORS.neonMagenta,
                          borderRadius: RETRO_SIZE.buttonBorderRadius,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                        }
                      : {
                          backgroundColor: '#F3F4F6',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                        }
                  }
                >
                  <Text
                    style={
                      retro
                        ? { color: RETRO_COLORS.neonMagenta, fontWeight: '700', fontSize: 13 }
                        : { color: '#374151', fontWeight: '600', fontSize: 13 }
                    }
                  >
                    CLOSE
                  </Text>
                </Pressable>
              </View>

              {/* Message list */}
              <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                onContentSizeChange={scrollToBottom}
                showsVerticalScrollIndicator={false}
              >
                {messages.map(msg =>
                  msg.role === 'user' ? (
                    <UserBubble key={msg.id} text={msg.text} />
                  ) : (
                    <BotBubble
                      key={msg.id}
                      text={msg.text}
                      followUps={msg.followUps}
                      onFollowUp={sendMessage}
                    />
                  ),
                )}
                {isTyping && <TypingIndicator />}
              </ScrollView>

              {/* Suggested chips (empty state / initial) */}
              {messages.length <= 1 && !isTyping && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                  <Text
                    style={
                      retro
                        ? { color: RETRO_COLORS.textMuted, fontSize: 11, letterSpacing: 0.5, marginBottom: 6 }
                        : { color: '#9CA3AF', fontSize: 11, marginBottom: 6 }
                    }
                  >
                    SUGGESTED
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {SUGGESTED_QUESTIONS.map(q => (
                      <Pressable
                        key={q}
                        onPress={() => sendMessage(q)}
                        style={
                          retro
                            ? {
                                backgroundColor: 'rgba(0,255,255,0.06)',
                                borderWidth: 1,
                                borderColor: RETRO_COLORS.neonCyan,
                                borderRadius: 10,
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                              }
                            : {
                                backgroundColor: '#EFF6FF',
                                borderRadius: 10,
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                              }
                        }
                      >
                        <Text
                          style={
                            retro
                              ? { color: RETRO_COLORS.neonCyan, fontSize: 11, letterSpacing: 0.2 }
                              : { color: '#1D4ED8', fontSize: 11 }
                          }
                        >
                          {q}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Input bar */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  paddingBottom: Platform.OS === 'ios' ? 24 : 12,
                  backgroundColor: headerBg,
                  borderTopWidth: retro ? 2 : 1,
                  borderTopColor: retro ? RETRO_COLORS.neonMagenta : '#E5E7EB',
                  ...(retro ? {
                    shadowColor: RETRO_COLORS.neonMagenta,
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                  } : {}),
                }}
              >
                <TextInput
                  style={[
                    {
                      flex: 1,
                      backgroundColor: inputBg,
                      color: inputText_,
                      borderRadius: RETRO_SIZE.buttonBorderRadius,
                      borderWidth: retro ? 1.5 : 1,
                      borderColor: inputBorder,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 14,
                      marginRight: 8,
                    },
                  ]}
                  placeholder="Ask anything..."
                  placeholderTextColor={inputPlaceholder}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => sendMessage(inputText)}
                  returnKeyType="send"
                  editable={!isTyping}
                  multiline={false}
                />
                <Pressable
                  onPress={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || isTyping}
                  style={[
                    {
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    retro
                      ? {
                          backgroundColor: 'rgba(0,0,30,0.9)',
                          borderWidth: 2,
                          borderColor: RETRO_COLORS.neonCyan,
                          opacity: !inputText.trim() || isTyping ? 0.4 : 1,
                          ...RETRO_GLOW.cyan,
                        }
                      : {
                          backgroundColor: '#0284C8',
                          opacity: !inputText.trim() || isTyping ? 0.4 : 1,
                        },
                  ]}
                >
                  {isTyping ? (
                    <ActivityIndicator size="small" color={retro ? RETRO_COLORS.neonCyan : '#fff'} />
                  ) : (
                    <Text
                      style={{
                        color: retro ? RETRO_COLORS.neonCyan : '#fff',
                        fontSize: 16,
                        fontWeight: '700',
                      }}
                    >
                      ↑
                    </Text>
                  )}
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
