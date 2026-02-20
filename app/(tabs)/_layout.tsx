import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ChatbotModal from '@/components/ChatbotModal';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: false, // Hide text labels
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#A0A0A0',
        }}>

        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            title: 'Add',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.addIconContainer}>
                <Ionicons name="add" size={28} color={color} />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="jobs"
          options={{
            title: 'Jobs',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Floating Chatbot Button */}
      <View style={styles.chatbotContainer} pointerEvents="box-none">
        <TouchableOpacity style={styles.chatbotButton} onPress={() => setIsChatOpen(true)}>
          <Ionicons name="chatbubbles" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Chatbot Modal */}
      <ChatbotModal visible={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 0 : 10, // Moved down from 30/20 respectively
    left: 20,
    right: 20,
    backgroundColor: '#1E1E24', // Dark pill background
    borderRadius: 35, // Rounded pill shape
    height: 70,
    borderTopWidth: 0, // Remove default border
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    paddingTop: 15, // Pushed icons down inside the container
    paddingBottom: 0,
  },
  addIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#A0A0A0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatbotContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 75 : 100, // Above tab bar
    right: 20,
    zIndex: 100,
  },
  chatbotButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1D9BF0', // Accent blue color
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
