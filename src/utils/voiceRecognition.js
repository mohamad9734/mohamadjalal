// Advanced Voice Recognition Implementation
// Using Web Speech API with enhanced features

import AsyncStorage from '@react-native-async-storage/async-storage';

// Speech recognition instance
let recognition = null;
let audioContext = null;
let audioAnalyser = null;
let microphoneStream = null;
let audioDataArray = null;
let isListening = false;
let languageCode = 'en-US'; // Default language
let confidenceThreshold = 0.7; // Default confidence threshold

// Command history for ML-based improvement
let commandHistory = [];
const MAX_COMMAND_HISTORY = 50;

// Voice activity detection settings
let vadEnabled = true;
let vadSensitivity = 0.05;
let isSpeaking = false;
let silenceTimer = null;
let consecutiveSilenceMs = 0;
const SILENCE_THRESHOLD = 0.05;
const MAX_SILENCE_DURATION = 1500; // 1.5 seconds of silence before stopping

// Command processing
let commandProcessor = null;
let activeListeners = [];
let contextualCommands = {};
let activeContext = 'global';

// Initialize the speech recognition system
const initializeSpeechRecognition = () => {
  try {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return false;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = languageCode;
    
    return true;
  } catch (error) {
    console.error('Error initializing speech recognition:', error);
    return false;
  }
};

// Initialize audio context for visualization and VAD
const initializeAudioContext = async () => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Get microphone stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    microphoneStream = audioContext.createMediaStreamSource(stream);
    
    // Create analyser node
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 256;
    audioAnalyser.smoothingTimeConstant = 0.8;
    
    // Connect microphone to analyser
    microphoneStream.connect(audioAnalyser);
    
    // Prepare data array for analyser
    audioDataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
    
    return true;
  } catch (error) {
    console.error('Error initializing audio context:', error);
    return false;
  }
};

// Load configuration and command data from storage
export const loadConfiguration = async () => {
  try {
    // Load language settings
    const storedLanguage = await AsyncStorage.getItem('voiceLanguage');
    if (storedLanguage) {
      languageCode = storedLanguage;
      if (recognition) recognition.lang = languageCode;
    }
    
    // Load confidence threshold
    const storedThreshold = await AsyncStorage.getItem('confidenceThreshold');
    if (storedThreshold) {
      confidenceThreshold = parseFloat(storedThreshold);
    }
    
    // Load VAD settings
    const vadSettings = await AsyncStorage.getItem('vadSettings');
    if (vadSettings) {
      const settings = JSON.parse(vadSettings);
      vadEnabled = settings.enabled ?? true;
      vadSensitivity = settings.sensitivity ?? 0.05;
    }
    
    // Load command history for ML improvements
    const storedHistory = await AsyncStorage.getItem('commandHistory');
    if (storedHistory) {
      commandHistory = JSON.parse(storedHistory);
    }
    
    return { languageCode, confidenceThreshold, vadEnabled, vadSensitivity };
  } catch (error) {
    console.error('Error loading voice configuration:', error);
    return null;
  }
};

// Save configuration
export const saveConfiguration = async (config) => {
  try {
    if (config.language) {
      languageCode = config.language;
      await AsyncStorage.setItem('voiceLanguage', config.language);
      if (recognition) recognition.lang = languageCode;
    }
    
    if (config.confidenceThreshold !== undefined) {
      confidenceThreshold = config.confidenceThreshold;
      await AsyncStorage.setItem('confidenceThreshold', config.confidenceThreshold.toString());
    }
    
    if (config.vadEnabled !== undefined || config.vadSensitivity !== undefined) {
      vadEnabled = config.vadEnabled ?? vadEnabled;
      vadSensitivity = config.vadSensitivity ?? vadSensitivity;
      await AsyncStorage.setItem('vadSettings', JSON.stringify({
        enabled: vadEnabled,
        sensitivity: vadSensitivity
      }));
    }
    
    return true;
  } catch (error) {
    console.error('Error saving voice configuration:', error);
    return false;
  }
};

// Supported languages
export const getSupportedLanguages = () => {
  return [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'hi-IN', name: 'Hindi' }
  ];
};

// Load command set
export const loadCommands = async () => {
  try {
    // Load custom commands from storage
    const customCommandsStr = await AsyncStorage.getItem('customCommands');
    let customCommands = customCommandsStr ? JSON.parse(customCommandsStr) : [];
    
    // Combine with default commands
    const allCommands = [...getDefaultCommands(), ...customCommands];
    
    // Group commands by context
    contextualCommands = {};
    allCommands.forEach(command => {
      const context = command.context || 'global';
      if (!contextualCommands[context]) {
        contextualCommands[context] = [];
      }
      contextualCommands[context].push(command);
    });
    
    return allCommands;
  } catch (error) {
    console.error('Error loading commands:', error);
    return getDefaultCommands();
  }
};

// Get default command set
export const getDefaultCommands = () => {
  return [
    { id: 'open_camera', phrase: 'Open camera', action: 'OPEN_CAMERA', context: 'global' },
    { id: 'take_photo', phrase: 'Take a photo', action: 'TAKE_PHOTO', context: 'camera' },
    { id: 'increase_brightness', phrase: 'Increase brightness', action: 'INCREASE_BRIGHTNESS', context: 'global' },
    { id: 'decrease_brightness', phrase: 'Decrease brightness', action: 'DECREASE_BRIGHTNESS', context: 'global' },
    { id: 'open_settings', phrase: 'Open settings', action: 'OPEN_SETTINGS', context: 'global' },
    { id: 'go_back', phrase: 'Go back', action: 'GO_BACK', context: 'global' },
    { id: 'scroll_up', phrase: 'Scroll up', action: 'SCROLL_UP', context: 'scrollable' },
    { id: 'scroll_down', phrase: 'Scroll down', action: 'SCROLL_DOWN', context: 'scrollable' },
    { id: 'select_item', phrase: 'Select', action: 'SELECT', context: 'global' },
    { id: 'confirm', phrase: 'Confirm', action: 'CONFIRM', context: 'dialog' },
    { id: 'cancel', phrase: 'Cancel', action: 'CANCEL', context: 'dialog' }
  ];
};

// Save custom command
export const saveCustomCommand = async (command) => {
  try {
    // Validate command structure
    if (!command.id || !command.phrase || !command.action) {
      throw new Error('Invalid command structure');
    }
    
    // Retrieve existing custom commands
    const customCommandsStr = await AsyncStorage.getItem('customCommands');
    let customCommands = customCommandsStr ? JSON.parse(customCommandsStr) : [];
    
    // Check if command already exists
    const existingIndex = customCommands.findIndex(cmd => cmd.id === command.id);
    
    if (existingIndex >= 0) {
      // Update existing command
      customCommands[existingIndex] = command;
    } else {
      // Add new command
      customCommands.push(command);
    }
    
    // Save updated command list
    await AsyncStorage.setItem('customCommands', JSON.stringify(customCommands));
    
    // Reload commands to update context grouping
    await loadCommands();
    
    return true;
  } catch (error) {
    console.error('Error saving custom command:', error);
    return false;
  }
};

// Delete custom command
export const deleteCustomCommand = async (commandId) => {
  try {
    // Retrieve existing custom commands
    const customCommandsStr = await AsyncStorage.getItem('customCommands');
    if (!customCommandsStr) return true; // No commands to delete
    
    const customCommands = JSON.parse(customCommandsStr);
    
    // Filter out the command to delete
    const updatedCommands = customCommands.filter(cmd => cmd.id !== commandId);
    
    // Save updated command list
    await AsyncStorage.setItem('customCommands', JSON.stringify(updatedCommands));
    
    // Reload commands to update context grouping
    await loadCommands();
    
    return true;
  } catch (error) {
    console.error('Error deleting custom command:', error);
    return false;
  }
};

// Set active context to improve recognition accuracy
export const setRecognitionContext = (context) => {
  activeContext = context || 'global';
  console.log(`Voice recognition context set to: ${activeContext}`);
  return true;
};

// Start voice activity detection
const startVoiceActivityDetection = () => {
  if (!vadEnabled || !audioAnalyser) return;
  
  // Check audio level regularly
  const checkAudioLevel = () => {
    if (!isListening) return;
    
    const level = getAudioLevelSync();
    
    // Detect if user is speaking based on audio level
    const newIsSpeaking = level > vadSensitivity;
    
    if (newIsSpeaking) {
      // Reset silence counter when speech detected
      consecutiveSilenceMs = 0;
      if (!isSpeaking) {
        console.log('Speech started');
        isSpeaking = true;
        
        // Notify listeners of speech start
        notifyListeners('speechStart', { timestamp: Date.now() });
      }
    } else if (isSpeaking) {
      // Count consecutive silence
      consecutiveSilenceMs += 100; // assuming 100ms interval
      
      if (consecutiveSilenceMs >= MAX_SILENCE_DURATION) {
        console.log('Speech ended');
        isSpeaking = false;
        consecutiveSilenceMs = 0;
        
        // Notify listeners of speech end
        notifyListeners('speechEnd', { 
          timestamp: Date.now(),
          duration: consecutiveSilenceMs
        });
      }
    }
    
    // Continue checking
    silenceTimer = setTimeout(checkAudioLevel, 100);
  };
  
  // Start checking
  silenceTimer = setTimeout(checkAudioLevel, 100);
};

// Stop voice activity detection
const stopVoiceActivityDetection = () => {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  
  isSpeaking = false;
  consecutiveSilenceMs = 0;
};

// Helper function to add event listener
export const addEventListener = (type, callback) => {
  activeListeners.push({ type, callback });
  return activeListeners.length - 1; // Return ID for removal
};

// Helper function to remove event listener
export const removeEventListener = (id) => {
  if (id >= 0 && id < activeListeners.length) {
    activeListeners[id] = null; // Mark as removed
    return true;
  }
  return false;
};

// Notify all event listeners
const notifyListeners = (type, data) => {
  activeListeners.forEach(listener => {
    if (listener && listener.type === type) {
      listener.callback(data);
    }
  });
};

// Start voice recognition
export const startVoiceRecognition = async (onCommand, onError) => {
  try {
    // Initialize recognition if not already initialized
    if (!recognition && !initializeSpeechRecognition()) {
      throw new Error('Failed to initialize speech recognition');
    }
    
    // Initialize audio context if not already initialized
    if (!audioAnalyser && !await initializeAudioContext()) {
      throw new Error('Failed to initialize audio context');
    }
    
    // Load configuration and commands
    await loadConfiguration();
    await loadCommands();
    
    // Set up recognition event handlers
    recognition.onstart = () => {
      console.log('Voice recognition started');
      isListening = true;
      notifyListeners('recognitionStart', { timestamp: Date.now() });
    };
    
    recognition.onend = () => {
      // Restart recognition if still listening
      if (isListening) {
        console.log('Voice recognition restarted');
        recognition.start();
      } else {
        console.log('Voice recognition ended');
        notifyListeners('recognitionEnd', { timestamp: Date.now() });
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Recognition error:', event.error);
      
      // Handle specific errors
      switch (event.error) {
        case 'no-speech':
          // No speech detected, just restart
          break;
        case 'aborted':
          // Recognition was aborted, just log
          break;
        case 'audio-capture':
          if (onError) onError(new Error('Microphone not available or not working'));
          break;
        case 'network':
          if (onError) onError(new Error('Network error occurred'));
          break;
        case 'not-allowed':
          if (onError) onError(new Error('Microphone permission denied'));
          break;
        default:
          if (onError) onError(new Error(`Recognition error: ${event.error}`));
      }
      
      notifyListeners('recognitionError', { 
        timestamp: Date.now(),
        error: event.error
      });
    };
    
    // Handle recognition results
    recognition.onresult = (event) => {
      const results = event.results;
      
      // Process each result
      for (let i = event.resultIndex; i < results.length; i++) {
        // Get most confident interpretation
        const transcript = results[i][0].transcript.trim().toLowerCase();
        const confidence = results[i][0].confidence;
        const isFinal = results[i].isFinal;
        
        // Log interim results for debugging
        if (!isFinal) {
          console.log(`Interim: "${transcript}" (${confidence.toFixed(2)})`);
          notifyListeners('interimResult', { 
            transcript,
            confidence,
            timestamp: Date.now()
          });
          continue;
        }
        
        console.log(`Final: "${transcript}" (${confidence.toFixed(2)})`);
        
        // Notify of final recognition
        notifyListeners('finalResult', {
          transcript,
          confidence,
          timestamp: Date.now(),
          alternatives: Array.from({ length: results[i].length - 1 }, (_, j) => ({
            transcript: results[i][j+1].transcript.trim().toLowerCase(),
            confidence: results[i][j+1].confidence
          }))
        });
        
        // Check if confidence is above threshold
        if (confidence < confidenceThreshold) {
          console.log(`Command rejected: confidence ${confidence} below threshold ${confidenceThreshold}`);
          continue;
        }
        
        // Match command against the transcript
        const matchedCommand = findMatchingCommand(transcript);
        
        if (matchedCommand) {
          console.log(`Command matched: ${matchedCommand.phrase} -> ${matchedCommand.action}`);
          
          // Record command in history for ML improvements
          recordCommandExecution(matchedCommand, transcript, confidence);
          
          // Execute the command callback
          if (onCommand) {
            onCommand(matchedCommand.action);
          }
          
          // Notify listeners
          notifyListeners('commandExecuted', {
            command: matchedCommand,
            transcript,
            confidence,
            timestamp: Date.now()
          });
        } else {
          console.log(`No matching command found for: "${transcript}"`);
          
          // Notify about unrecognized command
          notifyListeners('unrecognizedCommand', {
            transcript,
            confidence,
            timestamp: Date.now()
          });
        }
      }
    };
    
    // Start recognition
    recognition.start();
    
    // Start voice activity detection
    startVoiceActivityDetection();
    
    // Return control object for managing recognition
    commandProcessor = {
      updateContext: (context) => setRecognitionContext(context),
      pause: () => {
        if (isListening) {
          recognition.stop();
          isListening = false;
        }
      },
      resume: () => {
        if (!isListening) {
          recognition.start();
          isListening = true;
        }
      },
      isActive: () => isListening
    };
    
    return commandProcessor;
  } catch (error) {
    console.error('Error starting voice recognition:', error);
    if (onError) onError(error);
    return null;
  }
};

// Stop voice recognition
export const stopVoiceRecognition = async () => {
  try {
    // Stop recognition
    if (recognition && isListening) {
      recognition.stop();
      isListening = false;
    }
    
    // Stop voice activity detection
    stopVoiceActivityDetection();
    
    // Clean up audio resources
    if (microphoneStream) {
      const stream = microphoneStream.mediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      microphoneStream = null;
    }
    
    // Reset other state
    commandProcessor = null;
    
    return true;
  } catch (error) {
    console.error('Error stopping voice recognition:', error);
    return false;
  }
};

// Find matching command based on transcript
const findMatchingCommand = (transcript) => {
  // Get commands for current context plus global commands
  const availableCommands = [
    ...(contextualCommands[activeContext] || []),
    ...(activeContext !== 'global' ? contextualCommands['global'] || [] : [])
  ];
  
  // Try exact matches first
  const exactMatch = availableCommands.find(cmd => {
    return cmd.phrase.toLowerCase() === transcript;
  });
  
  if (exactMatch) return exactMatch;
  
  // Try fuzzy matching (contains the command phrase)
  const fuzzyMatch = availableCommands.find(cmd => {
    return transcript.includes(cmd.phrase.toLowerCase());
  });
  
  if (fuzzyMatch) return fuzzyMatch;
  
  // Try partial word matching with similarity threshold
  return availableCommands.find(cmd => {
    return calculateSimilarity(cmd.phrase.toLowerCase(), transcript) > 0.8;
  });
};

// Calculate text similarity using Levenshtein distance
const calculateSimilarity = (s1, s2) => {
  // Early return for exact match or empty strings
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Calculate Levenshtein distance
  const track = Array(s2.length + 1).fill(null).map(() => 
    Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  
  // Calculate similarity as inverse of normalized distance
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - (track[s2.length][s1.length] / maxLength);
};

// Record command execution for ML improvement
const recordCommandExecution = async (command, transcript, confidence) => {
  const record = {
    commandId: command.id,
    transcript,
    confidence,
    context: activeContext,
    timestamp: Date.now()
  };
  
  // Add to history
  commandHistory.unshift(record);
  
  // Keep history at reasonable size
  if (commandHistory.length > MAX_COMMAND_HISTORY) {
    commandHistory = commandHistory.slice(0, MAX_COMMAND_HISTORY);
  }
  
  // Persist history
  try {
    await AsyncStorage.setItem('commandHistory', JSON.stringify(commandHistory));
  } catch (error) {
    console.error('Error saving command history:', error);
  }
};

// Get command usage statistics for insights
export const getCommandStatistics = async () => {
  try {
    const history = commandHistory.length > 0 ? commandHistory : 
      JSON.parse(await AsyncStorage.getItem('commandHistory')) || [];
    
    // Calculate basic statistics
    const stats = {
      totalExecutions: history.length,
      commandFrequency: {},
      averageConfidence: 0,
      contextUsage: {},
      timeDistribution: {
        morning: 0, // 5am-12pm
        afternoon: 0, // 12pm-5pm
        evening: 0, // 5pm-9pm
        night: 0 // 9pm-5am
      }
    };
    
    // Skip if no data
    if (history.length === 0) {
      return stats;
    }
    
    // Calculate detailed stats
    let totalConfidence = 0;
    
    history.forEach(record => {
      // Command frequency
      stats.commandFrequency[record.commandId] = (stats.commandFrequency[record.commandId] || 0) + 1;
      
      // Confidence tracking
      totalConfidence += record.confidence || 0;
      
      // Context usage
      stats.contextUsage[record.context || 'global'] = (stats.contextUsage[record.context || 'global'] || 0) + 1;
      
      // Time distribution
      const date = new Date(record.timestamp);
      const hour = date.getHours();
      
      if (hour >= 5 && hour < 12) {
        stats.timeDistribution.morning++;
      } else if (hour >= 12 && hour < 17) {
        stats.timeDistribution.afternoon++;
      } else if (hour >= 17 && hour < 21) {
        stats.timeDistribution.evening++;
      } else {
        stats.timeDistribution.night++;
      }
    });
    
    // Calculate average confidence
    stats.averageConfidence = totalConfidence / history.length;
    
    return stats;
  } catch (error) {
    console.error('Error calculating command statistics:', error);
    return null;
  }
};

// Reset command history and learning
export const resetCommandLearning = async () => {
  try {
    commandHistory = [];
    await AsyncStorage.removeItem('commandHistory');
    return true;
  } catch (error) {
    console.error('Error resetting command learning:', error);
    return false;
  }
};

// Get real-time audio level for visualization
export const getAudioLevel = async () => {
  if (!audioAnalyser) {
    // Try to initialize audio
    if (!await initializeAudioContext()) {
      return 0;
    }
  }
  
  return getAudioLevelSync();
};

// Synchronous version of getAudioLevel for internal use
const getAudioLevelSync = () => {
  if (!audioAnalyser || !audioDataArray) return 0;
  
  // Get frequency data
  audioAnalyser.getByteFrequencyData(audioDataArray);
  
  // Calculate average level normalized to 0-1
  const average = Array.from(audioDataArray).reduce((sum, value) => sum + value, 0) / audioDataArray.length;
  return average / 255;
};
