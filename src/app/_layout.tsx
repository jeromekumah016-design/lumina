import "../../global.css";
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { LuminaProvider } from '../context/LuminaContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <LuminaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FF00AA',
          tabBarInactiveTintColor: '#00AAFF',
          tabBarStyle: {
            backgroundColor: '#1A1A2E',
            borderTopWidth: 3, borderTopColor: '#FFCC00',
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
                style={{
                  backgroundColor: focused ? '#007AFF' : 'transparent',
                  borderRadius: 20,
                  padding: 4,
                }}>
                <Ionicons
                  name="game-controller"
                  size={22}
                  color={focused ? '#fff' : color}
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
      </Tabs>
    </LuminaProvider>
  );
}
