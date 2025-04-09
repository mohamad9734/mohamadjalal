import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import HomeScreen from '../screens/HomeScreen';
import GestureTrainingScreen from '../screens/GestureTrainingScreen';
import VoiceEnrollmentScreen from '../screens/VoiceEnrollmentScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useAppContext } from '../context/AppContext';
import { colors } from '../styles/globalStyles';
import OnboardingTutorial from './OnboardingTutorial';

// Custom Tab Icons
const HomeIcon = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
);

const GestureIcon = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    <Path d="M6 2v1" />
    <Path d="M6 11v1" />
    <Path d="M11 6H10" />
    <Path d="M2 6H1" />
    <Path d="M16 12l2 2" />
    <Path d="M8 18H9" />
    <Path d="M12 12a4 4 0 0 1 8 0v8" />
    <Path d="M20 12a4 4 0 0 0-8 0v8" />
    <Path d="M12 16H8v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2" />
  </Svg>
);

const VoiceIcon = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Path d="M12 19v4" />
    <Path d="M8 23h8" />
  </Svg>
);

const SettingsIcon = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { darkMode } = useAppContext();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: darkMode ? '#6B7280' : '#9CA3AF',
        tabBarStyle: {
          backgroundColor: darkMode ? colors.backgroundDark : colors.background,
          borderTopColor: darkMode ? colors.borderDark : colors.border,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Gestures" 
        component={GestureTrainingScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <GestureIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Voice" 
        component={VoiceEnrollmentScreen}
        options={{
          tabBarIcon: ({ color, size }) => <VoiceIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { firstTime, darkMode, isLoading } = useAppContext();
  
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: darkMode ? colors.backgroundDark : colors.background
      }}>
        <Text style={{ color: darkMode ? colors.textDark : colors.text }}>
          Loading...
        </Text>
      </View>
    );
  }
  
  return (
    <NavigationContainer
      theme={{
        dark: darkMode,
        colors: {
          primary: colors.primary,
          background: darkMode ? colors.backgroundDark : colors.background,
          card: darkMode ? colors.cardDark : colors.card,
          text: darkMode ? colors.textDark : colors.text,
          border: darkMode ? colors.borderDark : colors.border,
          notification: colors.error,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {firstTime ? (
          <Stack.Screen name="Onboarding" component={OnboardingTutorial} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
