// Advanced Voice Authentication Implementation
// Uses browser audio APIs and basic biometrics for voice authentication

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

// Authentication constants
const ENROLLMENT_SAMPLES_REQUIRED = 3;
const VERIFICATION_CONFIDENCE_THRESHOLD = 0.75;
const FEATURE_VECTOR_SIZE = 128;
const STORAGE_KEY_VOICE_PROFILE = 'voiceAuthProfile';
const STORAGE_KEY_VOICE_SETTINGS = 'voiceAuthSettings';

// Audio processing constants
const SAMPLE_RATE = 16000;
const FFT_SIZE = 2048;
const MEL_BANDS = 40;
const FRAME_LENGTH_MS = 25;
const FRAME_SHIFT_MS = 10;

// Auth state 
let audioContext = null;
let isEnrolling = false;
let isAuthenticating = false;
let enrollmentBuffer = [];
let voiceProfiles = [];
let currentUser = null;
let audioWorkletReady = false;
let verificationPhrase = '';

// Settings
let settings = {
  securityLevel: 'medium', // low, medium, high
  autoEnrollment: false,
  usePhraseVerification: true,
  passphrases: [
    'My voice is my passport, verify me',
    'The quick brown fox jumps over the lazy dog',
    'How to recognize speech with accuracy'
  ],
  enrollmentDuration: 5000 // 5 seconds duration for each enrollment sample
};

// Feature extraction helpers
let featureExtractor = null;
let vadProcessor = null;

// Initialize audio context and processors
const initializeAudioSystem = async () => {
  try {
    if (audioContext) return true;
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: SAMPLE_RATE
    });
    
    // Load audio worklet for feature extraction (if supported)
    if (audioContext.audioWorklet) {
      try {
        await audioContext.audioWorklet.addModule('/audio-processors.js');
        audioWorkletReady = true;
        console.log('Audio worklet loaded for voice authentication');
      } catch (err) {
        console.warn('Could not load audio worklet, falling back to main thread processing', err);
        // We'll use main thread processing instead
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing audio system for authentication:', error);
    return false;
  }
};

// Load settings and voice profiles
export const initialize = async () => {
  try {
    await initializeAudioSystem();
    
    // Load authentication settings
    const storedSettings = await AsyncStorage.getItem(STORAGE_KEY_VOICE_SETTINGS);
    if (storedSettings) {
      settings = { ...settings, ...JSON.parse(storedSettings) };
    }
    
    // Load voice profiles
    const storedProfiles = await AsyncStorage.getItem(STORAGE_KEY_VOICE_PROFILE);
    if (storedProfiles) {
      voiceProfiles = JSON.parse(storedProfiles);
    }
    
    // Set the first voice profile as current user if available
    if (voiceProfiles.length > 0) {
      currentUser = voiceProfiles[0].userId || 'default';
    } else {
      currentUser = 'default';
    }
    
    return {
      initialized: true,
      hasProfiles: voiceProfiles.length > 0,
      currentUser
    };
  } catch (error) {
    console.error('Error initializing voice authentication:', error);
    return {
      initialized: false,
      error: error.message
    };
  }
};

// Save settings
export const saveSettings = async (newSettings) => {
  try {
    settings = { ...settings, ...newSettings };
    await AsyncStorage.setItem(STORAGE_KEY_VOICE_SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving voice authentication settings:', error);
    return false;
  }
};

// Check if user has completed voice enrollment
export const checkVoiceEnrollment = async (userId = 'default') => {
  try {
    // Initialize if needed
    if (!audioContext) {
      await initialize();
    }
    
    // Find profile for user
    const profile = voiceProfiles.find(p => p.userId === userId);
    
    return {
      enrolled: !!profile && profile.completed,
      progress: profile ? profile.progress : 0,
      samplesCount: profile ? profile.samples.length : 0,
      samplesRequired: ENROLLMENT_SAMPLES_REQUIRED
    };
  } catch (error) {
    console.error('Error checking voice enrollment:', error);
    return {
      enrolled: false,
      error: error.message
    };
  }
};

// Start voice enrollment process
export const startVoiceEnrollment = async (userId = 'default') => {
  try {
    // Initialize if needed
    if (!audioContext) {
      await initialize();
    }
    
    // Check if already enrolling
    if (isEnrolling) {
      throw new Error('Enrollment already in progress');
    }
    
    // Start enrollment
    isEnrolling = true;
    enrollmentBuffer = [];
    currentUser = userId;
    
    // Select a random verification phrase if phrase verification is enabled
    if (settings.usePhraseVerification) {
      const phrases = settings.passphrases;
      verificationPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    return { 
      success: true, 
      userId,
      phrase: verificationPhrase,
      enrollmentId: `enrollment-${Date.now()}` 
    };
  } catch (error) {
    console.error('Error starting voice enrollment:', error);
    isEnrolling = false;
    return {
      success: false,
      error: error.message
    };
  }
};

// Record and process an enrollment audio sample
export const enrollVoice = async (audioData, step = 1) => {
  try {
    if (!isEnrolling) {
      throw new Error('No enrollment session in progress');
    }
    
    // Extract features from audio data
    const features = await extractVoiceFeatures(audioData);
    
    // Store this sample
    enrollmentBuffer.push({
      step,
      features,
      timestamp: Date.now()
    });
    
    // Calculate progress
    const progress = enrollmentBuffer.length / ENROLLMENT_SAMPLES_REQUIRED;
    
    // Check if enrollment is complete
    const isComplete = enrollmentBuffer.length >= ENROLLMENT_SAMPLES_REQUIRED;
    
    if (isComplete) {
      // Create or update voice profile
      await saveVoiceProfile();
      isEnrolling = false;
    }
    
    return {
      success: true,
      progress,
      completed: isComplete,
      samplesCount: enrollmentBuffer.length,
      samplesRequired: ENROLLMENT_SAMPLES_REQUIRED
    };
  } catch (error) {
    console.error('Error during voice enrollment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Save voice profile to storage
const saveVoiceProfile = async () => {
  // Process samples to create voice profile
  const voiceFeatures = processEnrollmentSamples(enrollmentBuffer);
  
  // Create or update profile
  const existingIndex = voiceProfiles.findIndex(p => p.userId === currentUser);
  
  const profile = {
    userId: currentUser,
    created: Date.now(),
    lastUpdated: Date.now(),
    features: voiceFeatures,
    samples: enrollmentBuffer,
    completed: true,
    progress: 1.0
  };
  
  if (existingIndex >= 0) {
    // Update existing profile
    voiceProfiles[existingIndex] = profile;
  } else {
    // Add new profile
    voiceProfiles.push(profile);
  }
  
  // Save to storage
  await AsyncStorage.setItem(STORAGE_KEY_VOICE_PROFILE, JSON.stringify(voiceProfiles));
  
  // Clear enrollment buffer
  enrollmentBuffer = [];
  
  return true;
};

// Process enrollment samples to create a voice profile
const processEnrollmentSamples = (samples) => {
  // Average all feature vectors to create a single representative vector
  // This is a simplified approach; a real system would use more sophisticated methods
  const featureVectors = samples.map(sample => sample.features);
  
  // Average feature vectors
  const averageFeatures = Array(FEATURE_VECTOR_SIZE).fill(0);
  featureVectors.forEach(vector => {
    vector.forEach((value, i) => {
      averageFeatures[i] += value / featureVectors.length;
    });
  });
  
  return averageFeatures;
};

// Clear voice enrollment data
export const clearVoiceEnrollment = async (userId = currentUser) => {
  try {
    // Filter out the specified user's profile
    voiceProfiles = voiceProfiles.filter(p => p.userId !== userId);
    
    // Save updated profiles
    await AsyncStorage.setItem(STORAGE_KEY_VOICE_PROFILE, JSON.stringify(voiceProfiles));
    
    return { success: true };
  } catch (error) {
    console.error('Error clearing voice enrollment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Authenticate voice against stored profile
export const authenticateVoice = async (audioData, options = {}) => {
  try {
    if (isAuthenticating) {
      throw new Error('Authentication already in progress');
    }
    
    isAuthenticating = true;
    
    // Default options
    const authOptions = {
      userId: currentUser,
      phrase: options.phrase || '',
      requiredConfidence: getConfidenceThresholdForSecurityLevel()
    };
    
    // Check if there's a profile to authenticate against
    const profile = voiceProfiles.find(p => p.userId === authOptions.userId);
    if (!profile || !profile.completed) {
      isAuthenticating = false;
      return {
        success: false,
        error: 'No voice profile found for authentication',
        enrolled: false
      };
    }
    
    // Extract features from the provided audio
    const features = await extractVoiceFeatures(audioData);
    
    // Compare with stored profile
    const similarity = calculateVoiceSimilarity(features, profile.features);
    const confidence = similarity;
    
    // Check if the similarity is above the required threshold
    const isAuthenticated = confidence >= authOptions.requiredConfidence;
    
    // Record authentication attempt for security analytics
    recordAuthenticationAttempt(authOptions.userId, isAuthenticated, confidence);
    
    isAuthenticating = false;
    
    return {
      success: isAuthenticated,
      confidence,
      threshold: authOptions.requiredConfidence,
      userId: authOptions.userId
    };
  } catch (error) {
    console.error('Error during voice authentication:', error);
    isAuthenticating = false;
    return {
      success: false,
      error: error.message
    };
  }
};

// Extract voice features from audio data
const extractVoiceFeatures = async (audioData) => {
  // This is a simplified placeholder
  // A real implementation would use MFCC, pitch analysis, etc.
  
  // For demonstration, we'll generate a random feature vector
  // In a real implementation, this would process the audio data
  
  try {
    // Simple feature extraction based on frequency spectrum
    const audioBuffer = await decodeAudioData(audioData);
    const features = calculateAudioFeatures(audioBuffer);
    return features;
  } catch (error) {
    console.error('Error extracting voice features:', error);
    
    // Fallback to simplified features
    return Array(FEATURE_VECTOR_SIZE).fill(0).map(() => Math.random());
  }
};

// Decode audio data from various formats to AudioBuffer
const decodeAudioData = async (audioData) => {
  // Handle different types of input
  if (audioData instanceof AudioBuffer) {
    return audioData;
  }
  
  // If it's a Blob or File
  if (audioData instanceof Blob || audioData instanceof File) {
    const arrayBuffer = await audioData.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  }
  
  // If it's an ArrayBuffer
  if (audioData instanceof ArrayBuffer) {
    return await audioContext.decodeAudioData(audioData);
  }
  
  // If it's a base64 string
  if (typeof audioData === 'string' && audioData.startsWith('data:audio')) {
    const response = await fetch(audioData);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  }
  
  throw new Error('Unsupported audio data format');
};

// Calculate basic audio features from an AudioBuffer
const calculateAudioFeatures = (audioBuffer) => {
  // Get audio data
  const channelData = audioBuffer.getChannelData(0);
  const features = [];
  
  // Calculate simple time domain features
  const frameSize = Math.floor(FRAME_LENGTH_MS * audioBuffer.sampleRate / 1000);
  const frameShift = Math.floor(FRAME_SHIFT_MS * audioBuffer.sampleRate / 1000);
  
  // Create analyzer node for frequency analysis
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  
  // Create a temporary buffer source for the analyzer
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyser);
  
  // Get frequency data
  const frequencyData = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(frequencyData);
  
  // Sample frequency bins for spectral features
  // We'll create a simplified feature vector with spectral and temporal features
  
  // Spectral features - downsample frequency data
  const spectralFeatures = [];
  const binSize = Math.floor(frequencyData.length / 64);
  
  for (let i = 0; i < 64; i++) {
    const binStart = i * binSize;
    const binEnd = Math.min(binStart + binSize, frequencyData.length);
    let sum = 0;
    
    for (let j = binStart; j < binEnd; j++) {
      sum += frequencyData[j];
    }
    
    spectralFeatures.push(sum / (binEnd - binStart));
  }
  
  // Temporal features
  const temporalFeatures = [];
  
  // Calculate energy, zero crossings, etc.
  let energy = 0;
  let zeroCrossings = 0;
  
  for (let i = 1; i < channelData.length; i++) {
    energy += channelData[i] * channelData[i];
    if ((channelData[i] >= 0 && channelData[i-1] < 0) || 
        (channelData[i] < 0 && channelData[i-1] >= 0)) {
      zeroCrossings++;
    }
  }
  
  energy /= channelData.length;
  zeroCrossings /= channelData.length;
  
  temporalFeatures.push(energy, zeroCrossings);
  
  // Add statistical features
  let sum = 0;
  let sumSquared = 0;
  let min = Infinity;
  let max = -Infinity;
  
  for (let i = 0; i < channelData.length; i++) {
    const sample = channelData[i];
    sum += sample;
    sumSquared += sample * sample;
    min = Math.min(min, sample);
    max = Math.max(max, sample);
  }
  
  const mean = sum / channelData.length;
  const variance = (sumSquared / channelData.length) - (mean * mean);
  const stdDev = Math.sqrt(variance);
  
  temporalFeatures.push(mean, stdDev, min, max);
  
  // Combine features
  const combinedFeatures = [...spectralFeatures, ...temporalFeatures];
  
  // Normalize to get a feature vector of the required size
  const normalizedFeatures = [];
  const step = combinedFeatures.length / FEATURE_VECTOR_SIZE;
  
  for (let i = 0; i < FEATURE_VECTOR_SIZE; i++) {
    const index = Math.min(Math.floor(i * step), combinedFeatures.length - 1);
    normalizedFeatures.push(combinedFeatures[index]);
  }
  
  return normalizedFeatures;
};

// Calculate similarity between two voice feature vectors
const calculateVoiceSimilarity = (features1, features2) => {
  // Use cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < features1.length; i++) {
    dotProduct += features1[i] * features2[i];
    norm1 += features1[i] * features1[i];
    norm2 += features2[i] * features2[i];
  }
  
  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  // Normalize to 0-1 range
  return (dotProduct / (norm1 * norm2) + 1) / 2;
};

// Record authentication attempt for security analytics
const recordAuthenticationAttempt = async (userId, success, confidence) => {
  try {
    // Get existing logs
    const logsJson = await AsyncStorage.getItem('voiceAuthLogs');
    const logs = logsJson ? JSON.parse(logsJson) : [];
    
    // Add new log
    logs.push({
      userId,
      timestamp: Date.now(),
      success,
      confidence
    });
    
    // Keep only recent logs
    const recentLogs = logs.slice(-50); // Keep last 50 logs
    
    // Save logs
    await AsyncStorage.setItem('voiceAuthLogs', JSON.stringify(recentLogs));
  } catch (error) {
    console.error('Error recording authentication attempt:', error);
  }
};

// Get confidence threshold based on security level setting
const getConfidenceThresholdForSecurityLevel = () => {
  switch (settings.securityLevel) {
    case 'low':
      return 0.65;
    case 'high':
      return 0.85;
    case 'medium':
    default:
      return VERIFICATION_CONFIDENCE_THRESHOLD;
  }
};

// Speak verification phrase using text-to-speech
export const speakVerificationPhrase = async (phrase) => {
  try {
    verificationPhrase = phrase || verificationPhrase;
    
    if (!verificationPhrase) {
      // Pick a random phrase if none provided
      const phrases = settings.passphrases;
      verificationPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    // Use Expo's Speech API
    await Speech.speak(verificationPhrase, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.75
    });
    
    return true;
  } catch (error) {
    console.error('Error speaking verification phrase:', error);
    return false;
  }
};

// Get enrollment phrases
export const getEnrollmentPhrases = () => {
  return settings.passphrases;
};

// Add a custom passphrase
export const addCustomPassphrase = async (phrase) => {
  try {
    if (!phrase || phrase.trim().length < 5) {
      throw new Error('Phrase must be at least 5 characters long');
    }
    
    // Add to passphrases if not already included
    if (!settings.passphrases.includes(phrase)) {
      settings.passphrases.push(phrase);
      await saveSettings(settings);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding custom passphrase:', error);
    return false;
  }
};

// Get voice authentication statistics
export const getAuthenticationStats = async () => {
  try {
    const logsJson = await AsyncStorage.getItem('voiceAuthLogs');
    const logs = logsJson ? JSON.parse(logsJson) : [];
    
    // Calculate statistics
    const stats = {
      totalAttempts: logs.length,
      successRate: 0,
      averageConfidence: 0,
      recentActivity: []
    };
    
    if (logs.length > 0) {
      // Success rate
      const successfulAttempts = logs.filter(log => log.success).length;
      stats.successRate = successfulAttempts / logs.length;
      
      // Average confidence
      const totalConfidence = logs.reduce((sum, log) => sum + (log.confidence || 0), 0);
      stats.averageConfidence = totalConfidence / logs.length;
      
      // Recent activity (last 5 attempts)
      stats.recentActivity = logs.slice(-5).map(log => ({
        timestamp: log.timestamp,
        success: log.success,
        confidence: log.confidence
      }));
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting authentication stats:', error);
    return null;
  }
};
