import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create context
const AppContext = createContext();

// Storage keys
const STORAGE_KEYS = {
  GESTURE_MODE: 'gesture_mode',
  VOICE_MODE: 'voice_mode',
  GESTURES_CONFIGURED: 'gestures_configured',
  VOICE_ENROLLED: 'voice_enrolled',
  DARK_MODE: 'dark_mode',
  FIRST_TIME: 'first_time'
};

export const AppProvider = ({ children }) => {
  // App state
  const [gestureMode, setGestureMode] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [gesturesConfigured, setGesturesConfigured] = useState(false);
  const [voiceEnrolled, setVoiceEnrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [firstTime, setFirstTime] = useState(true);
  const [lastCommand, setLastCommand] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved settings on app start
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedGestureMode = await AsyncStorage.getItem(STORAGE_KEYS.GESTURE_MODE);
        const storedVoiceMode = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_MODE);
        const storedGesturesConfigured = await AsyncStorage.getItem(STORAGE_KEYS.GESTURES_CONFIGURED);
        const storedVoiceEnrolled = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_ENROLLED);
        const storedDarkMode = await AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE);
        const storedFirstTime = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_TIME);
        
        if (storedGestureMode !== null) setGestureMode(JSON.parse(storedGestureMode));
        if (storedVoiceMode !== null) setVoiceMode(JSON.parse(storedVoiceMode));
        if (storedGesturesConfigured !== null) setGesturesConfigured(JSON.parse(storedGesturesConfigured));
        if (storedVoiceEnrolled !== null) setVoiceEnrolled(JSON.parse(storedVoiceEnrolled));
        if (storedDarkMode !== null) setDarkMode(JSON.parse(storedDarkMode));
        if (storedFirstTime !== null) setFirstTime(JSON.parse(storedFirstTime));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading settings:', error);
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Save settings when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.GESTURE_MODE, JSON.stringify(gestureMode));
        await AsyncStorage.setItem(STORAGE_KEYS.VOICE_MODE, JSON.stringify(voiceMode));
        await AsyncStorage.setItem(STORAGE_KEYS.GESTURES_CONFIGURED, JSON.stringify(gesturesConfigured));
        await AsyncStorage.setItem(STORAGE_KEYS.VOICE_ENROLLED, JSON.stringify(voiceEnrolled));
        await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(darkMode));
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_TIME, JSON.stringify(firstTime));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };
    
    // Only save if app has finished loading
    if (!isLoading) {
      saveSettings();
    }
  }, [gestureMode, voiceMode, gesturesConfigured, voiceEnrolled, darkMode, firstTime, isLoading]);

  // Toggle functions
  const toggleGestureMode = () => setGestureMode(prev => !prev);
  const toggleVoiceMode = () => setVoiceMode(prev => !prev);
  const toggleDarkMode = () => setDarkMode(prev => !prev);
  
  // Set functions
  const markGesturesConfigured = (value = true) => setGesturesConfigured(value);
  const markVoiceEnrolled = (value = true) => setVoiceEnrolled(value);
  const completeFirstTimeSetup = () => setFirstTime(false);
  const recordCommand = (command) => setLastCommand(command);

  // Provide context value
  const contextValue = {
    gestureMode,
    voiceMode,
    gesturesConfigured,
    voiceEnrolled,
    darkMode,
    firstTime,
    lastCommand,
    isLoading,
    toggleGestureMode,
    toggleVoiceMode,
    toggleDarkMode,
    markGesturesConfigured,
    markVoiceEnrolled,
    completeFirstTimeSetup,
    recordCommand
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
