import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AppProvider, useAppContext } from './src/context/AppContext';
import Navigation from './src/components/Navigation';
import GestureDetector from './src/components/GestureDetector';
import VoiceDetector from './src/components/VoiceDetector';
import FeedbackOverlay from './src/components/FeedbackOverlay';
import { initTensorFlow } from './src/utils/gestureRecognition';
import { colors } from './src/styles/globalStyles';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Initialize TensorFlow and other libraries
initTensorFlow().catch(error => {
  console.warn('Failed to initialize TensorFlow:', error);
});

function Main() {
  const { darkMode } = useAppContext();
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: darkMode ? colors.backgroundDark : colors.background }
    ]}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Navigation />
      <GestureDetector />
      <VoiceDetector />
      <FeedbackOverlay />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <Main />
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
