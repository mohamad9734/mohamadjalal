import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../styles/globalStyles';
import { useAppContext } from '../context/AppContext';

const FeedbackOverlay = () => {
  const { lastCommand } = useAppContext();
  const [visible, setVisible] = useState(false);
  const fadeAnim = new Animated.Value(0);
  
  // Show feedback when a command is executed
  useEffect(() => {
    if (lastCommand) {
      setVisible(true);
      
      // Start fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Set timeout to hide feedback
      const timer = setTimeout(() => {
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
        });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [lastCommand]);
  
  if (!visible) {
    return null;
  }
  
  // Format the command for display
  const formattedCommand = lastCommand ? 
    lastCommand.replace(/_/g, ' ').toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') : '';
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.overlay}>
        <View style={styles.commandContainer}>
          <Text style={styles.commandText}>{formattedCommand}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    maxWidth: '80%',
  },
  commandContainer: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  commandText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default FeedbackOverlay;
