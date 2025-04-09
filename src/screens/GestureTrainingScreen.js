import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, SafeAreaView } from 'react-native';
import { Camera } from 'expo-camera';
import { useAppContext } from '../context/AppContext';
import { colors, typography, layout, spacing, buttons } from '../styles/globalStyles';
import {
  initTensorFlow,
  loadGestures,
  startGestureTraining,
  stopGestureTraining,
  saveGesture,
  deleteGesture,
  clearAllGestures,
} from '../utils/gestureRecognition';

export default function GestureTrainingScreen() {
  const { 
    darkMode, 
    markGesturesConfigured 
  } = useAppContext();
  
  const [hasPermission, setHasPermission] = useState(null);
  const [gestures, setGestures] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [trainingStep, setTrainingStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get theme colors based on dark mode
  const getThemeColor = (lightColor, darkColor) => {
    return darkMode ? darkColor : lightColor;
  };
  
  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Initialize TensorFlow and load gestures
      if (status === 'granted') {
        try {
          await initTensorFlow();
          const savedGestures = await loadGestures();
          setGestures(savedGestures);
          
          // If we have gestures, mark as configured
          if (savedGestures.length > 0) {
            markGesturesConfigured(true);
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error initializing:', error);
          Alert.alert('Error', 'Failed to initialize gesture recognition');
          setIsLoading(false);
        }
      }
    })();
  }, []);
  
  const startTraining = (gestureId) => {
    setIsTraining(true);
    setCurrentGesture(gestureId);
    setTrainingStep(1);
    
    startGestureTraining(
      (frame) => {
        // Handle frame data from camera
        console.log('Training frame received');
      },
      (error) => {
        console.error('Training error:', error);
        Alert.alert('Error', 'Failed to process camera data');
        stopTraining();
      }
    );
  };
  
  const stopTraining = () => {
    stopGestureTraining();
    setIsTraining(false);
    setCurrentGesture(null);
    setTrainingStep(0);
  };
  
  const handleSaveGesture = async () => {
    try {
      // In real app, we'd use actual gesture data
      const mockGestureData = { 
        id: currentGesture,
        timestamp: new Date().toISOString()
      };
      
      await saveGesture(currentGesture, mockGestureData);
      
      // Update gestures list
      const updatedGestures = await loadGestures();
      setGestures(updatedGestures);
      
      // Mark gestures as configured
      markGesturesConfigured(true);
      
      stopTraining();
      Alert.alert('Success', `Gesture "${currentGesture}" saved successfully!`);
    } catch (error) {
      console.error('Error saving gesture:', error);
      Alert.alert('Error', 'Failed to save gesture');
    }
  };
  
  const handleDeleteGesture = async (gestureId) => {
    try {
      await deleteGesture(gestureId);
      
      // Update gestures list
      const updatedGestures = await loadGestures();
      setGestures(updatedGestures);
      
      // If no gestures left, mark as not configured
      if (updatedGestures.length === 0) {
        markGesturesConfigured(false);
      }
      
      Alert.alert('Success', `Gesture "${gestureId}" deleted`);
    } catch (error) {
      console.error('Error deleting gesture:', error);
      Alert.alert('Error', 'Failed to delete gesture');
    }
  };
  
  const handleClearAllGestures = async () => {
    Alert.alert(
      'Clear All Gestures',
      'Are you sure you want to delete all saved gestures?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllGestures();
              setGestures([]);
              markGesturesConfigured(false);
              Alert.alert('Success', 'All gestures cleared');
            } catch (error) {
              console.error('Error clearing gestures:', error);
              Alert.alert('Error', 'Failed to clear gestures');
            }
          }
        }
      ]
    );
  };
  
  // Available gestures to train
  const availableGestures = [
    { id: 'swipe_right', name: 'Swipe Right' },
    { id: 'swipe_left', name: 'Swipe Left' },
    { id: 'thumbs_up', name: 'Thumbs Up' },
    { id: 'palm', name: 'Palm' },
    { id: 'pinch', name: 'Pinch' },
    { id: 'spread', name: 'Spread' }
  ];
  
  if (hasPermission === null) {
    return (
      <View style={[
        layout.container, 
        layout.center,
        { backgroundColor: getThemeColor(colors.background, colors.backgroundDark) }
      ]}>
        <Text style={[
          typography.body, 
          { color: getThemeColor(colors.text, colors.textDark) }
        ]}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={[
        layout.container, 
        layout.center,
        { backgroundColor: getThemeColor(colors.background, colors.backgroundDark) }
      ]}>
        <Text style={[
          typography.body, 
          { color: getThemeColor(colors.text, colors.textDark) }
        ]}>
          Camera permission denied. Please enable camera access in your device settings.
        </Text>
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View style={[
        layout.container, 
        layout.center,
        { backgroundColor: getThemeColor(colors.background, colors.backgroundDark) }
      ]}>
        <Text style={[
          typography.body, 
          { color: getThemeColor(colors.text, colors.textDark) }
        ]}>
          Loading gesture recognition...
        </Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[
      layout.container, 
      { backgroundColor: getThemeColor(colors.background, colors.backgroundDark) }
    ]}>
      <ScrollView>
        <Text style={[
          typography.h1, 
          { color: getThemeColor(colors.text, colors.textDark) }
        ]}>
          Gesture Training
        </Text>
        
        {isTraining ? (
          <View style={styles.trainingContainer}>
            <Text style={[
              typography.h3, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              Training: {currentGesture.replace('_', ' ')}
            </Text>
            
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.placeholderText}>Camera Preview</Text>
              <Text style={styles.placeholderText}>Step {trainingStep} of 3</Text>
            </View>
            
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark), textAlign: 'center' }
            ]}>
              Please perform the gesture multiple times
            </Text>
            
            <View style={styles.stepContainer}>
              {[1, 2, 3].map((step) => (
                <TouchableOpacity
                  key={step}
                  style={[
                    styles.stepButton,
                    { 
                      backgroundColor: step === trainingStep 
                        ? colors.primary 
                        : getThemeColor('#ddd', '#444')
                    }
                  ]}
                  onPress={() => setTrainingStep(step)}
                >
                  <Text style={styles.stepButtonText}>{step}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[buttons.outline, { flex: 1, marginRight: spacing.sm }]}
                onPress={stopTraining}
              >
                <Text style={buttons.outlineText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[buttons.primary, { flex: 1, marginLeft: spacing.sm }]}
                onPress={handleSaveGesture}
              >
                <Text style={buttons.buttonText}>Save Gesture</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark), marginBottom: spacing.md }
            ]}>
              Train your device to recognize your custom gestures. Each gesture requires 3 training steps.
            </Text>
            
            <View style={[
              styles.gesturePanel, 
              { backgroundColor: getThemeColor(colors.card, colors.cardDark) }
            ]}>
              <Text style={[
                typography.h3, 
                { color: getThemeColor(colors.text, colors.textDark) }
              ]}>
                Available Gestures
              </Text>
              
              {availableGestures.map((gesture) => {
                const isTrained = gestures.some(g => g.id === gesture.id);
                
                return (
                  <View key={gesture.id} style={styles.gestureRow}>
                    <View style={styles.gestureInfo}>
                      <Text style={[
                        typography.body, 
                        { color: getThemeColor(colors.text, colors.textDark) }
                      ]}>
                        {gesture.name}
                      </Text>
                      
                      {isTrained && (
                        <Text style={styles.trainedTag}>Trained</Text>
                      )}
                    </View>
                    
                    <View style={styles.gestureActions}>
                      <TouchableOpacity
                        style={[
                          buttons.primary,
                          { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm }
                        ]}
                        onPress={() => startTraining(gesture.id)}
                      >
                        <Text style={[buttons.buttonText, { fontSize: 14 }]}>
                          {isTrained ? 'Retrain' : 'Train'}
                        </Text>
                      </TouchableOpacity>
                      
                      {isTrained && (
                        <TouchableOpacity
                          style={[
                            buttons.outline,
                            { 
                              paddingVertical: spacing.xs, 
                              paddingHorizontal: spacing.sm,
                              marginLeft: spacing.sm,
                              borderColor: colors.error
                            }
                          ]}
                          onPress={() => handleDeleteGesture(gesture.id)}
                        >
                          <Text style={[buttons.outlineText, { color: colors.error, fontSize: 14 }]}>
                            Delete
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
            
            {gestures.length > 0 && (
              <TouchableOpacity
                style={[
                  buttons.outline,
                  { 
                    marginTop: spacing.md,
                    borderColor: colors.error
                  }
                ]}
                onPress={handleClearAllGestures}
              >
                <Text style={[buttons.outlineText, { color: colors.error }]}>
                  Clear All Gestures
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  trainingContainer: {
    padding: spacing.md,
  },
  cameraPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: spacing.md,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  stepButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  gesturePanel: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gestureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gestureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trainedTag: {
    backgroundColor: colors.success,
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  gestureActions: {
    flexDirection: 'row',
  },
});
