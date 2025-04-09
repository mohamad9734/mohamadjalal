import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, SafeAreaView } from 'react-native';
import { Audio } from 'expo-av';
import { useAppContext } from '../context/AppContext';
import { colors, typography, layout, spacing, buttons } from '../styles/globalStyles';
import {
  checkVoiceEnrollment,
  startVoiceEnrollment,
  enrollVoice,
  clearVoiceEnrollment,
  getEnrollmentPhrases,
  speakVerificationPhrase,
} from '../utils/voiceAuthentication';

export default function VoiceEnrollmentScreen() {
  const { 
    darkMode, 
    markVoiceEnrolled 
  } = useAppContext();
  
  const [hasPermission, setHasPermission] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState(0);
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [recording, setRecording] = useState(null);
  const [enrollmentPhrases] = useState(getEnrollmentPhrases());
  const [currentPhrase, setCurrentPhrase] = useState(enrollmentPhrases[0]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get theme colors based on dark mode
  const getThemeColor = (lightColor, darkColor) => {
    return darkMode ? darkColor : lightColor;
  };
  
  // Request audio permissions and check enrollment status
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        try {
          const enrolled = await checkVoiceEnrollment();
          setIsEnrolled(enrolled);
          
          // If enrolled, mark in context
          if (enrolled) {
            markVoiceEnrolled(true);
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error checking enrollment:', error);
          Alert.alert('Error', 'Failed to check voice enrollment status');
          setIsLoading(false);
        }
      }
    })();
  }, []);
  
  const startRecording = async () => {
    try {
      // Configure audio recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      
      // In real app, this would speak the phrase
      speakVerificationPhrase(currentPhrase);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };
  
  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      // Stop recording
      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      
      // Get recording URI
      const uri = recording.getURI();
      setRecording(null);
      
      // Process the recording
      await processRecording(uri);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to process recording');
      setIsRecording(false);
      setRecording(null);
    }
  };
  
  const processRecording = async (uri) => {
    try {
      // If this is the first step, start enrollment
      if (enrollmentStep === 0) {
        await startVoiceEnrollment();
      }
      
      // Enroll the recording
      const currentStep = enrollmentStep + 1;
      const result = await enrollVoice(uri, currentStep);
      
      // Update progress
      setEnrollmentProgress(result.progress);
      
      // If completed, mark as enrolled
      if (result.completed) {
        setIsEnrolled(true);
        markVoiceEnrolled(true);
        setEnrollmentStep(0);
        Alert.alert('Success', 'Voice enrollment completed!');
      } else {
        // Move to next step
        setEnrollmentStep(currentStep);
        setCurrentPhrase(enrollmentPhrases[currentStep % enrollmentPhrases.length]);
      }
      
    } catch (error) {
      console.error('Error in voice enrollment:', error);
      Alert.alert('Error', 'Failed to process voice enrollment');
    }
  };
  
  const handleClearEnrollment = async () => {
    Alert.alert(
      'Clear Voice Enrollment',
      'Are you sure you want to delete your voice enrollment data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearVoiceEnrollment();
              setIsEnrolled(false);
              setEnrollmentStep(0);
              setEnrollmentProgress(0);
              markVoiceEnrolled(false);
              Alert.alert('Success', 'Voice enrollment cleared');
            } catch (error) {
              console.error('Error clearing enrollment:', error);
              Alert.alert('Error', 'Failed to clear voice enrollment');
            }
          }
        }
      ]
    );
  };
  
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
          Requesting microphone permission...
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
          Microphone permission denied. Please enable microphone access in your device settings.
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
          Loading voice authentication...
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
          Voice Enrollment
        </Text>
        
        <Text style={[
          typography.body, 
          { color: getThemeColor(colors.text, colors.textDark), marginBottom: spacing.md }
        ]}>
          Enroll your voice to enable secure voice commands. You'll need to record yourself saying 3 different phrases.
        </Text>
        
        <View style={[
          styles.enrollmentPanel, 
          { backgroundColor: getThemeColor(colors.card, colors.cardDark) }
        ]}>
          <Text style={[
            typography.h3, 
            { color: getThemeColor(colors.text, colors.textDark) }
          ]}>
            {isEnrolled ? 'Voice Enrolled' : 'Enrollment Status'}
          </Text>
          
          {isEnrolled ? (
            <View style={styles.enrolledContainer}>
              <View style={styles.statusIcon}>
                <Text style={styles.statusIconText}>✓</Text>
              </View>
              
              <Text style={[
                typography.body, 
                { color: getThemeColor(colors.text, colors.textDark), textAlign: 'center', marginTop: spacing.md }
              ]}>
                Your voice is successfully enrolled. You can now use voice commands.
              </Text>
              
              <TouchableOpacity
                style={[
                  buttons.outline,
                  { 
                    marginTop: spacing.md,
                    borderColor: colors.error
                  }
                ]}
                onPress={handleClearEnrollment}
              >
                <Text style={[buttons.outlineText, { color: colors.error }]}>
                  Clear Enrollment
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${enrollmentProgress * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={[
                  typography.bodySmall, 
                  { color: getThemeColor(colors.textLight, colors.textLightDark) }
                ]}>
                  Step {enrollmentStep} of 3
                </Text>
              </View>
              
              <View style={styles.phraseContainer}>
                <Text style={[
                  typography.h4, 
                  { 
                    color: getThemeColor(colors.text, colors.textDark),
                    textAlign: 'center',
                    marginBottom: spacing.sm
                  }
                ]}>
                  {enrollmentStep === 0 ? 'Ready to start' : 'Please say:'}
                </Text>
                
                {enrollmentStep > 0 && (
                  <View style={[
                    styles.phraseBox,
                    { backgroundColor: getThemeColor(colors.background, colors.backgroundDark) }
                  ]}>
                    <Text style={[
                      typography.body, 
                      { 
                        color: colors.primary,
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }
                    ]}>
                      "{currentPhrase}"
                    </Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity
                style={[
                  isRecording ? buttons.secondary : buttons.primary,
                  { marginTop: spacing.md }
                ]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Text style={buttons.buttonText}>
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        <View style={[
          styles.infoPanel, 
          { backgroundColor: getThemeColor(colors.card, colors.cardDark) }
        ]}>
          <Text style={[
            typography.h3, 
            { color: getThemeColor(colors.text, colors.textDark) }
          ]}>
            About Voice Enrollment
          </Text>
          
          <Text style={[
            typography.body, 
            { color: getThemeColor(colors.text, colors.textDark), marginVertical: spacing.sm }
          ]}>
            Voice enrollment creates a unique voice profile that helps authenticate your voice commands.
          </Text>
          
          <Text style={[
            typography.body, 
            { color: getThemeColor(colors.text, colors.textDark) }
          ]}>
            Benefits:
          </Text>
          
          <View style={styles.bulletPoint}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              • Enhanced security for voice commands
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              • Prevents others from using voice commands on your device
            </Text>
          </View>
          
          <View style={styles.bulletPoint}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              • Improves voice recognition accuracy
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  enrollmentPanel: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  phraseContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  phraseBox: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    width: '100%',
    marginTop: spacing.sm,
  },
  enrolledContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  infoPanel: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bulletPoint: {
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
});
