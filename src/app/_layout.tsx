import "../../global.css";
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { LuminaProvider } from '../context/LuminaContext';
import { RETRO_THEME_ENABLED, RETRO_COLORS } from '../theme/retro';

const INK = '#1A1612';
const CREAM = '#F5F1E9';
const INACTIVE = '#8A7A6E';
const BLUE = '#0284C8';

export default function TabLayout() {
  return (
    <LuminaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: RETRO_THEME_ENABLED ? RETRO_COLORS.neonMagenta : INK,
          tabBarInactiveTintColor: RETRO_THEME_ENABLED ? RETRO_COLORS.textMuted : INACTIVE,
          tabBarLabelStyle: { fontWeight: '700', fontSize: 10, letterSpacing: RETRO_THEME_ENABLED ? 0.5 : 0 },
          tabBarStyle: RETRO_THEME_ENABLED
            ? {
                backgroundColor: 'rgba(10,0,32,0.97)',
                borderTopWidth: 2,
                borderTopColor: RETRO_COLORS.neonMagenta,
              }
            : {
                backgroundColor: CREAM,
                borderTopWidth: 2,
                borderTopColor: '#000',
              },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Feed',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="itinerary"
          options={{
            title: 'Trips',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="game"
          options={{
            title: 'Game',
            tabBarIcon: ({ color, focused }) => (
              <View
                style={
                  RETRO_THEME_ENABLED
                    ? {
                        backgroundColor: focused ? 'rgba(255,0,255,0.18)' : 'transparent',
                        borderRadius: 20,
                        borderWidth: focused ? 2 : 0,
                        borderColor: RETRO_COLORS.neonMagenta,
                        padding: 4,
                        shadowColor: RETRO_COLORS.neonMagenta,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: focused ? 1 : 0,
                        shadowRadius: 12,
                        elevation: focused ? 12 : 0,
                      }
                    : {
                        backgroundColor: focused ? BLUE : 'transparent',
                        borderRadius: 20,
                        borderWidth: focused ? 2 : 0,
                        borderColor: '#000',
                        padding: 4,
                      }
                }>
                <Ionicons
                  name="game-controller"
                  size={22}
                  color={RETRO_THEME_ENABLED ? (focused ? RETRO_COLORS.neonMagenta : color) : (focused ? '#fff' : color)}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        {/* Non-tab screens — kept in same layout group so router.push() works,
            but hidden from the tab bar via href:null */}
        <Tabs.Screen name="onboarding" options={{ href: null }} />
        <Tabs.Screen name="subscribe" options={{ href: null }} />
        <Tabs.Screen name="matching" options={{ href: null }} />
        <Tabs.Screen name="trip-room" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="cycles" options={{ href: null }} />
        <Tabs.Screen name="cycle-detail" options={{ href: null }} />
      </Tabs>
    </LuminaProvider>
  );
}
