import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Switch } from 'react-native';
import { Audio } from 'expo-av';
import { colors, typography } from '../styles/globalStyles';
import { 
  startVoiceRecognition, 
  stopVoiceRecognition, 
  getAudioLevel, 
  addEventListener, 
  removeEventListener,
  loadConfiguration,
  setRecognitionContext,
  getSupportedLanguages
} from '../utils/voiceRecognition';
import { 
  authenticateVoice, 
  initialize as initVoiceAuth,
  checkVoiceEnrollment,
  speakVerificationPhrase,
  getEnrollmentPhrases
} from '../utils/voiceAuthentication';
import { executeAction } from '../utils/phoneControl';
import { useAppContext } from '../context/AppContext';
import { VoiceWaveform } from '../../assets/icons';

// Enhanced Voice Detector Component with visualizations and feedback
const VoiceDetector = ({ 
  position = 'left', 
  size = 'medium',
  showTranscription = true,
  authRequired = true,
  autoActivate = true,
  onCommandDetected = null,
  voiceContext = 'global'
}) => {
  // App context
  const { voiceMode, darkMode, recordCommand } = useAppContext();
  
  // State for permissions and status
  const [hasPermission, setHasPermission] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [speechDetected, setSpeechDetected] = useState(false);
  
  // Recognition results
  const [lastCommand, setLastCommand] = useState(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [recognitionConfidence, setRecognitionConfidence] = useState(0);
  const [commandHistory, setCommandHistory] = useState([]);
  
  // Authentication state
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  
  // Configuration
  const [config, setConfig] = useState({
    language: 'en-US',
    confidenceThreshold: 0.7
  });
  
  // Refs for cleanup and animation
  const recognitionProcessor = useRef(null);
  const audioLevelInterval = useRef(null);
  const eventListeners = useRef([]);
  const speechTimer = useRef(null);
  const commandFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Calculate container dimensions based on size prop
  const containerDimensions = useMemo(() => {
    switch (size) {
      case 'small': return { width: 120, height: 80 };
      case 'large': return { width: 220, height: 180 };
      case 'medium':
      default: return { width: 160, height: 140 };
    }
  }, [size]);
  
  // Container positioning based on position prop
  const containerPosition = useMemo(() => {
    switch (position) {
      case 'right': return { right: 16, left: 'auto' };
      case 'bottom': return { bottom: 16, top: 'auto', left: 16 };
      case 'top-right': return { top: 16, right: 16, left: 'auto' };
      case 'bottom-right': return { bottom: 16, right: 16, left: 'auto' };
      case 'center': return { top: '50%', left: '50%', transform: [{ translateX: -containerDimensions.width/2 }, { translateY: -containerDimensions.height/2 }] };
      case 'left':
      default: return { left: 16 };
    }
  }, [position, containerDimensions]);
  
  // Initialize audio permissions and voice authentication
  useEffect(() => {
    (async () => {
      // Request audio permission
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Initialize voice authentication
      if (status === 'granted') {
        const authInit = await initVoiceAuth();
        
        // Check if user is enrolled
        const enrollmentStatus = await checkVoiceEnrollment();
        setIsEnrolled(enrollmentStatus.enrolled);
        
        // Load voice configuration
        const voiceConfig = await loadConfiguration();
        if (voiceConfig) {
          setConfig(voiceConfig);
        }
      }
    })();
    
    // Pulsing animation for active state
    const startPulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 800,
          useNativeDriver: true
        })
      ]).start(() => {
        if (isListening) {
          startPulseAnimation();
        }
      });
    };
    
    if (isListening) {
      startPulseAnimation();
    } else {
      // Reset to default state
      pulseAnim.setValue(1);
    }
    
    return () => {
      pulseAnim.setValue(1);
    };
  }, [isListening]);
  
  // Start/stop voice recognition based on voiceMode
  useEffect(() => {
    let cleanup = () => {};
    
    const startRecognition = async () => {
      try {
        if (recognitionProcessor.current) {
          // Already running
          return;
        }
        
        // Set the recognition context to improve accuracy
        setRecognitionContext(voiceContext);
        
        // Register event listeners
        const listeners = [
          {
            type: 'speechStart',
            callback: () => {
              setSpeechDetected(true);
              // Clear any existing speech end timer
              if (speechTimer.current) {
                clearTimeout(speechTimer.current);
              }
            }
          },
          {
            type: 'speechEnd',
            callback: () => {
              // Add a small delay to prevent flickering
              speechTimer.current = setTimeout(() => {
                setSpeechDetected(false);
              }, 300);
            }
          },
          {
            type: 'interimResult',
            callback: (data) => {
              setCurrentTranscript(data.transcript);
              setRecognitionConfidence(data.confidence);
            }
          },
          {
            type: 'finalResult',
            callback: (data) => {
              // Final transcript available
              setCurrentTranscript(data.transcript);
              setRecognitionConfidence(data.confidence);
              
              // Start command processing animation
              setIsProcessing(true);
            }
          },
          {
            type: 'commandExecuted',
            callback: (data) => {
              handleCommandExecuted(data);
            }
          },
          {
            type: 'unrecognizedCommand',
            callback: (data) => {
              console.log(`Unrecognized command: ${data.transcript}`);
              setIsProcessing(false);
              
              // Clear transcript after a delay
              setTimeout(() => {
                setCurrentTranscript('');
              }, 2000);
            }
          }
        ];
        
        // Register all listeners
        listeners.forEach(listener => {
          const id = addEventListener(listener.type, listener.callback);
          eventListeners.current.push(id);
        });
        
        // Start voice recognition
        const processor = await startVoiceRecognition(
          async (command) => {
            if (authRequired) {
              // Verify user's voice before executing command
              const authResult = await authenticateVoice();
              
              setAuthStatus({
                authenticated: authResult.success,
                confidence: authResult.confidence,
                timestamp: Date.now()
              });
              
              if (!authResult.success) {
                console.log('Voice authentication failed');
                setIsProcessing(false);
                return;
              }
            }
            
            // Execute command
            setLastCommand(command);
            executeAction(command);
            
            // Record in app context history
            if (recordCommand) {
              recordCommand(command);
            }
            
            // Notify parent component if provided
            if (onCommandDetected) {
              onCommandDetected({
                command,
                transcript: currentTranscript,
                confidence: recognitionConfidence,
                timestamp: Date.now()
              });
            }
          },
          (error) => {
            console.error('Voice recognition error:', error);
            setIsListening(false);
          }
        );
        
        recognitionProcessor.current = processor;
        setIsListening(true);
        
        // Monitor audio levels for visualization
        audioLevelInterval.current = setInterval(async () => {
          const level = await getAudioLevel();
          setAudioLevel(level);
        }, 100);
        
        cleanup = async () => {
          // Clean up all event listeners
          eventListeners.current.forEach(id => {
            removeEventListener(id);
          });
          eventListeners.current = [];
          
          // Stop recognition process
          await stopVoiceRecognition();
          recognitionProcessor.current = null;
          
          // Clear intervals
          if (audioLevelInterval.current) {
            clearInterval(audioLevelInterval.current);
            audioLevelInterval.current = null;
          }
          
          // Reset state
          setIsListening(false);
          setSpeechDetected(false);
          setCurrentTranscript('');
        };
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        setIsListening(false);
      }
    };
    
    if (voiceMode && hasPermission && autoActivate) {
      startRecognition();
    } else if (!voiceMode || !autoActivate) {
      if (recognitionProcessor.current) {
        cleanup();
      }
    }
    
    return () => cleanup();
  }, [voiceMode, hasPermission, autoActivate, voiceContext, authRequired]);
  
  // Handle command executed - show feedback and animate
  const handleCommandExecuted = (data) => {
    const { command, transcript, confidence } = data;
    
    // Add command to history
    setCommandHistory(prev => {
      const newHistory = [
        { command: command.action, transcript, confidence, timestamp: Date.now() },
        ...prev
      ].slice(0, 5); // Keep last 5 commands
      
      return newHistory;
    });
    
    // Set as current command
    setLastCommand(command.action);
    
    // Show command feedback with animation
    Animated.sequence([
      Animated.timing(commandFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.delay(2000),
      Animated.timing(commandFadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start(() => {
      setIsProcessing(false);
      setCurrentTranscript('');
    });
  };
  
  // Toggle listening state
  const toggleListening = async () => {
    if (isListening) {
      // Stop listening
      if (recognitionProcessor.current) {
        await stopVoiceRecognition();
        recognitionProcessor.current = null;
      }
      
      // Clear intervals
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
        audioLevelInterval.current = null;
      }
      
      // Clean up all event listeners
      eventListeners.current.forEach(id => {
        removeEventListener(id);
      });
      eventListeners.current = [];
      
      setIsListening(false);
      setSpeechDetected(false);
      setCurrentTranscript('');
    } else {
      // Start listening - reuse the effect logic
      if (hasPermission) {
        const cleanup = () => {};
        cleanup();  // This will clean up any existing instances
        
        // Start recognition - reuse the same logic from the effect
        const { voiceMode } = useAppContext();
        if (voiceMode && hasPermission) {
          startRecognition();
        }
      }
    }
  };
  
  // Render the audio level visualization
  const renderAudioVisualization = () => {
    // Number of bars depends on container size
    const barCount = size === 'small' ? 3 : (size === 'large' ? 7 : 5);
    
    return (
      <View style={styles.audioVisualization}>
        {Array.from({ length: barCount }).map((_, index) => {
          // Calculate dynamic height based on audio level and position in the visualization
          const barIndex = index + 1;
          const maxHeight = size === 'small' ? 16 : (size === 'large' ? 32 : 24);
          const minHeight = 4;
          
          // Create a wave-like pattern
          const centerBar = Math.floor(barCount / 2);
          const distFromCenter = Math.abs(index - centerBar);
          const barPosition = 1 - (distFromCenter / centerBar);
          
          // Combine position and audio level for height
          const heightFactor = (barPosition * 0.5) + (audioLevel * 0.5);
          const height = minHeight + (heightFactor * (maxHeight - minHeight));
          
          // Activate based on audio level
          const isActive = audioLevel > (barIndex / (barCount + 2));
          
          return (
            <View 
              key={index}
              style={[
                styles.audioBar,
                { 
                  height,
                  opacity: isActive ? 1 : 0.3,
                  backgroundColor: speechDetected ? colors.accent : colors.primary
                }
              ]}
            />
          );
        })}
      </View>
    );
  };
  
  // Don't render if voice mode is disabled
  if (!voiceMode) {
    return null;
  }
  
  // Render permission requests
  if (hasPermission === null) {
    return (
      <View style={[
        styles.container, 
        containerPosition,
        { width: containerDimensions.width, height: containerDimensions.height }
      ]}>
        <Text style={[typography.body, styles.permissionText]}>
          Requesting microphone...
        </Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={[
        styles.container, 
        containerPosition,
        { width: containerDimensions.width, height: containerDimensions.height }
      ]}>
        <Text style={[typography.body, styles.permissionText]}>
          Microphone access denied
        </Text>
      </View>
    );
  }
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        containerPosition,
        { 
          width: containerDimensions.width, 
          height: containerDimensions.height,
          transform: [{ scale: pulseAnim }],
          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(0, 0, 0, 0.75)'
        }
      ]}
    >
      {/* Status header */}
      <View style={styles.statusHeader}>
        <View style={[
          styles.statusIndicator, 
          { 
            backgroundColor: isListening 
              ? (speechDetected ? colors.accent : colors.success) 
              : colors.error 
          }
        ]} />
        <Text style={styles.statusText}>
          {isListening 
            ? (speechDetected ? 'Listening...' : 'Ready') 
            : 'Voice inactive'
          }
        </Text>
        
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleListening}
        >
          <Text style={styles.toggleButtonText}>
            {isListening ? 'Stop' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Audio visualization */}
      {isListening && renderAudioVisualization()}
      
      {/* Current transcription */}
      {showTranscription && currentTranscript && (
        <View style={styles.transcriptContainer}>
          <Text 
            style={styles.transcriptText}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {currentTranscript}
          </Text>
        </View>
      )}
      
      {/* Command feedback */}
      {lastCommand && (
        <Animated.View 
          style={[
            styles.commandContainer,
            { opacity: commandFadeAnim }
          ]}
        >
          <Text style={styles.commandLabel}>
            Command detected:
          </Text>
          <Text style={styles.commandText}>
            {lastCommand.replace(/_/g, ' ')}
          </Text>
        </Animated.View>
      )}
      
      {/* Processing indicator */}
      {isProcessing && (
        <View style={styles.processingContainer}>
          <View style={styles.processingIndicator} />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
      
      {/* Authentication feedback */}
      {authRequired && authStatus && (
        <View style={[
          styles.authIndicator,
          { 
            backgroundColor: authStatus.authenticated 
              ? 'rgba(16, 185, 129, 0.2)' 
              : 'rgba(239, 68, 68, 0.2)' 
          }
        ]}>
          <Text style={[
            styles.authText,
            { 
              color: authStatus.authenticated 
                ? colors.success 
                : colors.error 
            }
          ]}>
            {authStatus.authenticated 
              ? 'Voice verified' 
              : 'Auth failed'
            }
          </Text>
        </View>
      )}
      
      {/* Voice icon */}
      <View style={styles.iconContainer}>
        <VoiceWaveform 
          width={24} 
          height={24} 
          color={isListening ? colors.primary : 'rgba(255,255,255,0.5)'} 
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 140,
    borderRadius: 16,
    padding: 12,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 1000,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  toggleButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  audioVisualization: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 32,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  audioBar: {
    width: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  transcriptContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    maxHeight: 60,
  },
  transcriptText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  commandContainer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 8,
  },
  commandLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  commandText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  processingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: 6,
  },
  processingText: {
    color: colors.accent,
    fontSize: 12,
  },
  authIndicator: {
    width: '100%',
    borderRadius: 4,
    padding: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  authText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconContainer: {
    position: 'absolute',
    bottom: -12,
    right: -12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    color: '#fff',
    textAlign: 'center',
  }
});

export default VoiceDetector;
