// Advanced implementation using TensorFlow.js, fingerpose, and AI enhancement
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import * as fp from 'fingerpose';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { processAmbiguousGesture, suggestCustomGestures } from './aiEnhancement';

// Global variables to hold models and gesture data
let handposeModel = null;
let gestureEstimator = null;
let videoStream = null;

// Settings with defaults for high accuracy detection
let settings = {
  confidenceThreshold: 8.0,      // Default threshold for built-in gestures
  customThreshold: 7.5,          // Default threshold for custom gestures
  adaptiveThresholdEnabled: true,
  multiGestureDetection: true,
  gestureSequenceEnabled: true,
  predictionSmoothing: true,
  detectionFrequency: 'high',    // 'low', 'medium', 'high'
  handTrackingSensitivity: 0.7,  // Higher sensitivity for better tracking
  useAIEnhancement: true         // Use AI for ambiguous gesture resolution
};

// Initialize TensorFlow and load handpose model
export const initTensorFlow = async () => {
  try {
    console.log('Initializing TensorFlow.js...');
    await tf.ready();
    console.log('TensorFlow.js is ready');
    
    // Load handpose model
    console.log('Loading handpose model...');
    handposeModel = await handpose.load();
    console.log('Handpose model loaded successfully');
    
    // Initialize gesture estimator with default gestures
    await initializeGestureEstimator();
    
    return true;
  } catch (error) {
    console.error('Error initializing TensorFlow:', error);
    return false;
  }
};

// Initialize gesture estimator with advanced default and custom gestures
const initializeGestureEstimator = async () => {
  console.log('Initializing advanced gesture estimator...');
  
  // Load gesture configuration
  const config = await loadGestureConfig();
  
  // ---------- ENHANCED DEFAULT GESTURES ----------
  
  // Define thumbs up gesture with improved detection parameters
  const thumbsUpGesture = new fp.GestureDescription('thumbs_up');
  // Primary definition for thumb
  thumbsUpGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
  thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalUp, 1.0);
  // Alternative directions to improve detection in various hand orientations
  thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpLeft, 0.7);
  thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpRight, 0.7);
  // Ensure other fingers are curled
  thumbsUpGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
  thumbsUpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
  thumbsUpGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  thumbsUpGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
  // Allow half curls for more natural detection
  thumbsUpGesture.addCurl(fp.Finger.Index, fp.FingerCurl.HalfCurl, 0.5);
  thumbsUpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.HalfCurl, 0.5);
  thumbsUpGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.HalfCurl, 0.5);
  thumbsUpGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.5);
  
  // Define thumbs down gesture
  const thumbsDownGesture = new fp.GestureDescription('thumbs_down');
  // Primary definition for thumb
  thumbsDownGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
  thumbsDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalDown, 1.0);
  // Alternative directions
  thumbsDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalDownLeft, 0.7);
  thumbsDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalDownRight, 0.7);
  // Ensure other fingers are curled
  thumbsDownGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
  thumbsDownGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
  thumbsDownGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  thumbsDownGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
  // Allow half curls
  thumbsDownGesture.addCurl(fp.Finger.Index, fp.FingerCurl.HalfCurl, 0.5);
  thumbsDownGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.HalfCurl, 0.5);
  thumbsDownGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.HalfCurl, 0.5);
  thumbsDownGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.5);
  
  // Define palm gesture with greater accuracy
  const palmGesture = new fp.GestureDescription('palm');
  // All fingers straight
  palmGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
  palmGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
  palmGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
  palmGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.NoCurl, 1.0);
  palmGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);
  // Allow slight curl for more natural hand poses
  palmGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.3);
  palmGesture.addCurl(fp.Finger.Index, fp.FingerCurl.HalfCurl, 0.3);
  palmGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.HalfCurl, 0.3);
  palmGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.HalfCurl, 0.3);
  palmGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.3);
  // Preferred directions (vertical)
  palmGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpRight, 1.0);
  palmGesture.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
  palmGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.VerticalUp, 1.0);
  palmGesture.addDirection(fp.Finger.Ring, fp.FingerDirection.VerticalUp, 1.0);
  palmGesture.addDirection(fp.Finger.Pinky, fp.FingerDirection.VerticalUp, 1.0);
  // Allow diagonal directions for better tolerance
  palmGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft, 0.8);
  palmGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpLeft, 0.8);
  palmGesture.addDirection(fp.Finger.Ring, fp.FingerDirection.DiagonalUpLeft, 0.8);
  palmGesture.addDirection(fp.Finger.Pinky, fp.FingerDirection.DiagonalUpLeft, 0.8);
  palmGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpRight, 0.8);
  palmGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpRight, 0.8);
  palmGesture.addDirection(fp.Finger.Ring, fp.FingerDirection.DiagonalUpRight, 0.8);
  palmGesture.addDirection(fp.Finger.Pinky, fp.FingerDirection.DiagonalUpRight, 0.8);

  // Define pinch gesture with more precision
  const pinchGesture = new fp.GestureDescription('pinch');
  // Thumb and index finger configurations
  pinchGesture.addCurl(fp.Finger.Index, fp.FingerCurl.HalfCurl, 1.0);
  pinchGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 0.8);
  pinchGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 1.0);
  // Their directions should be towards each other
  pinchGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpRight, 1.0);
  pinchGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpLeft, 0.8);
  pinchGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft, 1.0);
  pinchGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpRight, 0.8);
  // Other fingers can be in different positions, but preferably curled
  pinchGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.HalfCurl, 0.8);
  pinchGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
  pinchGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.HalfCurl, 0.8);
  pinchGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  pinchGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.8);
  pinchGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
  
  // Define point up gesture with improved recognition
  const pointUpGesture = new fp.GestureDescription('point_up');
  // Index should be pointing up
  pointUpGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
  pointUpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
  pointUpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft, 0.8);
  pointUpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpRight, 0.8);
  // Thumb can be in different positions
  pointUpGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.8);
  pointUpGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 0.5);
  // Other fingers should be curled
  pointUpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
  pointUpGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  pointUpGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
  // Allow some tolerance with half curls
  pointUpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.HalfCurl, 0.4);
  pointUpGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.HalfCurl, 0.4);
  pointUpGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.4);

  // Define point down gesture with improved recognition
  const pointDownGesture = new fp.GestureDescription('point_down');
  // Index should be pointing down
  pointDownGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
  pointDownGesture.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalDown, 1.0);
  pointDownGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalDownLeft, 0.8);
  pointDownGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalDownRight, 0.8);
  // Thumb can be in different positions
  pointDownGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.8);
  pointDownGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 0.5);
  // Other fingers should be curled
  pointDownGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
  pointDownGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  pointDownGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
  // Allow some tolerance with half curls
  pointDownGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.HalfCurl, 0.4);
  pointDownGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.HalfCurl, 0.4);
  pointDownGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.4);
  
  // Define victory gesture (✌️)
  const victoryGesture = new fp.GestureDescription('victory');
  // Index and middle fingers extended
  victoryGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
  victoryGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
  // Direction of index and middle finger (typically up, but allow diagonal)
  victoryGesture.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
  victoryGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft, 0.8);
  victoryGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpRight, 0.8);
  victoryGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.VerticalUp, 1.0);
  victoryGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpLeft, 0.8);
  victoryGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpRight, 0.8);
  // Ring and pinky should be curled
  victoryGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  victoryGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
  // Thumb can be in various positions, allowing more natural poses
  victoryGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.8);
  victoryGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 0.5);
  
  // Define fist gesture (closed hand)
  const fistGesture = new fp.GestureDescription('fist');
  // All fingers should be fully curled
  fistGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
  fistGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
  fistGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
  fistGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  fistGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
  // Allow half curl for thumb as it's often not fully curled in a fist
  fistGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.8);

  // Define swipe left gesture (hand with fingers together pointing left)
  const swipeLeftGesture = new fp.GestureDescription('swipe_left');
  // Fingers straight but pointing left
  swipeLeftGesture.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalLeft, 1.0);
  swipeLeftGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.HorizontalLeft, 1.0);
  swipeLeftGesture.addDirection(fp.Finger.Ring, fp.FingerDirection.HorizontalLeft, 1.0);
  swipeLeftGesture.addDirection(fp.Finger.Pinky, fp.FingerDirection.HorizontalLeft, 1.0);
  // Add diagonal tolerance
  swipeLeftGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft, 0.8);
  swipeLeftGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpLeft, 0.8);
  swipeLeftGesture.addDirection(fp.Finger.Ring, fp.FingerDirection.DiagonalUpLeft, 0.8);
  swipeLeftGesture.addDirection(fp.Finger.Pinky, fp.FingerDirection.DiagonalUpLeft, 0.8);
  swipeLeftGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalDownLeft, 0.8);
  swipeLeftGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalDownLeft, 0.8);
  swipeLeftGesture.addDirection(fp.Finger.Ring, fp.FingerDirection.DiagonalDownLeft, 0.8);
  swipeLeftGesture.addDirection(fp.Finger.Pinky, fp.FingerDirection.DiagonalDownLeft, 0.8);
  // All fingers are uncurled
  swipeLeftGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
  swipeLeftGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
  swipeLeftGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.NoCurl, 1.0);
  swipeLeftGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);
  // Allow slight curl
  swipeLeftGesture.addCurl(fp.Finger.Index, fp.FingerCurl.HalfCurl, 0.4);
  swipeLeftGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.HalfCurl, 0.4);
  swipeLeftGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.HalfCurl, 0.4);
  swipeLeftGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.4);

  // Define swipe right gesture (hand with fingers together pointing right)
  const swipeRightGesture = new fp.GestureDescription('swipe_right');
  // Fingers straight but pointing right
  swipeRightGesture.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalRight, 1.0);
  swipeRightGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.HorizontalRight, 1.0);
  swipeRightGesture.addDirection(fp.Finger.Ring, fp.FingerDirection.HorizontalRight, 1.0);
  swipeRightGesture.addDirection(fp.Finger.Pinky, fp.FingerDirection.HorizontalRight, 1.0);
  // Add diagonal tolerance
  swipeRightGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpRight, 0.8);
  swipeRightGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpRight, 0.8);
  swipeRightGesture.addDirection(fp.Finger.Ring, fp.FingerDirection.DiagonalUpRight, 0.8);
  swipeRightGesture.addDirection(fp.Finger.Pinky, fp.FingerDirection.DiagonalUpRight, 0.8);
  swipeRightGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalDownRight, 0.8);
  swipeRightGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalDownRight, 0.8);
  swipeRightGesture.addDirection(fp.Finger.Ring, fp.FingerDirection.DiagonalDownRight, 0.8);
  swipeRightGesture.addDirection(fp.Finger.Pinky, fp.FingerDirection.DiagonalDownRight, 0.8);
  // All fingers are uncurled
  swipeRightGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
  swipeRightGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
  swipeRightGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.NoCurl, 1.0);
  swipeRightGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);
  // Allow slight curl
  swipeRightGesture.addCurl(fp.Finger.Index, fp.FingerCurl.HalfCurl, 0.4);
  swipeRightGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.HalfCurl, 0.4);
  swipeRightGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.HalfCurl, 0.4);
  swipeRightGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.4);

  // Initialize with all defined gestures based on configuration
  const defaultGestures = [
    thumbsUpGesture,
    palmGesture,
    pinchGesture,
    pointUpGesture,
    pointDownGesture
  ];
  
  // Add additional gestures based on user config
  if (config.enabledGestures.thumbsDown) defaultGestures.push(thumbsDownGesture);
  if (config.enabledGestures.victory) defaultGestures.push(victoryGesture);
  if (config.enabledGestures.fist) defaultGestures.push(fistGesture);
  if (config.enabledGestures.swipeLeft) defaultGestures.push(swipeLeftGesture);
  if (config.enabledGestures.swipeRight) defaultGestures.push(swipeRightGesture);
  
  // Create gesture estimator with default gestures
  gestureEstimator = new fp.GestureEstimator(defaultGestures);
  
  // Load and add custom gestures
  try {
    const customGesturesJson = await AsyncStorage.getItem('customGestures');
    if (customGesturesJson) {
      const customGestures = JSON.parse(customGesturesJson);
      
      // Convert stored data back to GestureDescription objects
      for (const gesture of customGestures) {
        try {
          const gestureDesc = convertToGestureDescription(gesture.id, gesture.data);
          if (gestureDesc) {
            gestureEstimator.addGesture(gestureDesc);
            console.log(`Added custom gesture: ${gesture.id}`);
          }
        } catch (error) {
          console.error(`Error adding custom gesture ${gesture.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error loading custom gestures:', error);
  }
  
  console.log('Advanced gesture estimator initialized');
};

// Helper function to convert stored gesture data to GestureDescription
const convertToGestureDescription = (gestureId, gestureData) => {
  try {
    const desc = new fp.GestureDescription(gestureId);
    
    // Process fingers data if available
    if (gestureData.fingers) {
      for (const finger of Object.keys(gestureData.fingers)) {
        const fingerData = gestureData.fingers[finger];
        
        // Add curl data
        if (fingerData.curl) {
          for (const curl of Object.keys(fingerData.curl)) {
            desc.addCurl(
              fp.Finger[finger],
              fp.FingerCurl[curl],
              fingerData.curl[curl]
            );
          }
        }
        
        // Add direction data
        if (fingerData.directions) {
          for (const dir of Object.keys(fingerData.directions)) {
            desc.addDirection(
              fp.Finger[finger],
              fp.FingerDirection[dir],
              fingerData.directions[dir]
            );
          }
        }
      }
    } else if (gestureData.landmarks) {
      // If we have landmark data, use it to create a gesture model
      // This is for more advanced custom gesture creation
      // Implementation would depend on how landmarks are stored
      console.log('Using landmark data to create gesture model');
    }
    
    return desc;
  } catch (error) {
    console.error(`Error converting gesture ${gestureId}:`, error);
    return null;
  }
};

// Load gesture configuration
const loadGestureConfig = async () => {
  try {
    const configJson = await AsyncStorage.getItem('gestureConfig');
    if (configJson) {
      return JSON.parse(configJson);
    }
  } catch (error) {
    console.error('Error loading gesture config:', error);
  }
  
  // Default configuration
  return {
    confidenceThreshold: 8.0,
    enabledGestures: {
      thumbsUp: true,
      thumbsDown: true,
      palm: true,
      pinch: true,
      pointUp: true,
      pointDown: true,
      victory: true,
      fist: true,
      swipeLeft: true,
      swipeRight: true
    },
    gestureHistory: {},
    adaptiveThreshold: true
  };
};

// Load all available gestures (both default and custom)
export const loadGestures = async () => {
  // Get config to know which gestures are enabled
  const config = await loadGestureConfig();
  
  // Base default gestures (always available)
  const defaultGestures = [
    { id: 'thumbs_up', name: 'Thumbs Up', category: 'basic', icon: 'thumbs-up' },
    { id: 'palm', name: 'Palm', category: 'basic', icon: 'hand' },
    { id: 'pinch', name: 'Pinch', category: 'basic', icon: 'pinch' },
    { id: 'point_up', name: 'Point Up', category: 'navigation', icon: 'arrow-up' },
    { id: 'point_down', name: 'Point Down', category: 'navigation', icon: 'arrow-down' }
  ];
  
  // Advanced gestures (conditionally available based on config)
  const advancedGestures = [];
  
  if (config.enabledGestures.thumbsDown) {
    advancedGestures.push({ id: 'thumbs_down', name: 'Thumbs Down', category: 'basic', icon: 'thumbs-down' });
  }
  
  if (config.enabledGestures.victory) {
    advancedGestures.push({ id: 'victory', name: 'Victory', category: 'advanced', icon: 'victory' });
  }
  
  if (config.enabledGestures.fist) {
    advancedGestures.push({ id: 'fist', name: 'Fist', category: 'advanced', icon: 'fist' });
  }
  
  if (config.enabledGestures.swipeLeft) {
    advancedGestures.push({ id: 'swipe_left', name: 'Swipe Left', category: 'navigation', icon: 'swipe-left' });
  }
  
  if (config.enabledGestures.swipeRight) {
    advancedGestures.push({ id: 'swipe_right', name: 'Swipe Right', category: 'navigation', icon: 'swipe-right' });
  }
  
  try {
    // Load custom gestures
    const customGesturesJson = await AsyncStorage.getItem('customGestures');
    const customGestures = customGesturesJson ? JSON.parse(customGesturesJson) : [];
    
    // Add category and other metadata to custom gestures if not present
    const enhancedCustomGestures = customGestures.map(gesture => ({
      ...gesture,
      category: gesture.category || 'custom',
      icon: gesture.icon || 'custom-gesture'
    }));
    
    return [...defaultGestures, ...advancedGestures, ...enhancedCustomGestures];
  } catch (error) {
    console.error('Error loading gestures:', error);
    return [...defaultGestures, ...advancedGestures];
  }
};

// Start gesture training using camera
export const startGestureTraining = (onFrame, onError) => {
  try {
    if (!handposeModel) {
      throw new Error('Handpose model not loaded. Please initialize TensorFlow first.');
    }
    
    // Access camera
    navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480,
        facingMode: 'user'
      }
    }).then(stream => {
      videoStream = stream;
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        
        // Detect hand poses in video frames
        const detectFrame = async () => {
          try {
            if (videoElement.readyState === 4) {
              const predictions = await handposeModel.estimateHands(videoElement);
              if (predictions.length > 0) {
                if (onFrame) {
                  onFrame({
                    landmarks: predictions[0].landmarks,
                    boundingBox: predictions[0].boundingBox
                  });
                }
              }
            }
            requestAnimationFrame(detectFrame);
          } catch (err) {
            if (onError) onError(err);
          }
        };
        
        detectFrame();
      };
    }).catch(err => {
      if (onError) onError(err);
    });
    
    return true;
  } catch (error) {
    console.error('Error starting gesture training:', error);
    if (onError) onError(error);
    return false;
  }
};

// Stop gesture training and release camera
export const stopGestureTraining = () => {
  try {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      videoStream = null;
    }
    return true;
  } catch (error) {
    console.error('Error stopping gesture training:', error);
    return false;
  }
};

// Save custom gesture
export const saveGesture = async (gestureId, gestureData) => {
  try {
    const customGesturesJson = await AsyncStorage.getItem('customGestures');
    const customGestures = customGesturesJson ? JSON.parse(customGesturesJson) : [];
    
    // Check if gesture already exists
    const existingIndex = customGestures.findIndex(g => g.id === gestureId);
    if (existingIndex >= 0) {
      customGestures[existingIndex] = {
        id: gestureId,
        name: gestureData.name || gestureId,
        data: gestureData
      };
    } else {
      customGestures.push({
        id: gestureId,
        name: gestureData.name || gestureId,
        data: gestureData
      });
    }
    
    await AsyncStorage.setItem('customGestures', JSON.stringify(customGestures));
    
    // Reinitialize gesture estimator with updated gestures
    await initializeGestureEstimator();
    
    return { success: true, gestureId };
  } catch (error) {
    console.error('Error saving gesture:', error);
    return { success: false, error: error.message };
  }
};

// Delete a gesture
export const deleteGesture = async (gestureId) => {
  try {
    // Only allow deleting custom gestures, not default ones
    const defaultGestureIds = ['thumbs_up', 'palm', 'pinch', 'point_up', 'point_down'];
    if (defaultGestureIds.includes(gestureId)) {
      return { success: false, error: 'Cannot delete default gestures' };
    }
    
    const customGesturesJson = await AsyncStorage.getItem('customGestures');
    if (!customGesturesJson) return true; // No custom gestures exist
    
    const customGestures = JSON.parse(customGesturesJson);
    const updatedGestures = customGestures.filter(g => g.id !== gestureId);
    
    await AsyncStorage.setItem('customGestures', JSON.stringify(updatedGestures));
    
    // Reinitialize gesture estimator with updated gestures
    await initializeGestureEstimator();
    
    return true;
  } catch (error) {
    console.error('Error deleting gesture:', error);
    return false;
  }
};

// Clear all custom gestures
export const clearAllGestures = async () => {
  try {
    await AsyncStorage.removeItem('customGestures');
    // Reinitialize gesture estimator with only default gestures
    await initializeGestureEstimator();
    return true;
  } catch (error) {
    console.error('Error clearing gestures:', error);
    return false;
  }
};

// Global variables for advanced gesture detection
let lastGesture = null;
let lastGestureTime = 0;
let gestureSequence = [];
let gestureConfidenceHistory = {};
let gestureCounters = {};
let gestureWindowStart = 0;
let adaptiveThreshold = 7.5; // Default threshold will be dynamically adjusted

// Track hand position for motion detection
let previousHandPosition = null;
let handVelocity = { x: 0, y: 0 };

// Detect gesture from video frame with advanced features
export const detectGesture = async (videoFrame, options = {}) => {
  try {
    if (!handposeModel || !gestureEstimator) {
      throw new Error('Models not initialized. Please call initTensorFlow first.');
    }
    
    // Merge options with global settings
    const detectOptions = {
      calculateLandmarks: options.calculateLandmarks ?? false,
      multiGesture: options.multiGesture ?? settings.multiGestureDetection,
      useSequence: options.useSequence ?? settings.gestureSequenceEnabled,
      useAI: options.useAI ?? settings.useAIEnhancement,
      context: options.context || {},
      confidenceThreshold: options.confidenceThreshold || settings.confidenceThreshold
    };
    
    const now = Date.now();
    
    // Manage sequence window - reset sequence if too much time has elapsed
    if (now - gestureWindowStart > 3000 && gestureSequence.length > 0) {
      // Only log sequence if it contains multiple gestures
      if (gestureSequence.length > 1) {
        console.log('Gesture sequence detected:', gestureSequence);
        // Trigger actions based on sequences
        checkGestureSequence(gestureSequence);
      }
      gestureSequence = [];
      gestureWindowStart = now;
    }
    
    // Estimate hand landmarks with higher precision settings
    const hands = await handposeModel.estimateHands(videoFrame, {
      flipHorizontal: false,
      staticImageMode: false, // Set to true for static images, false for video
      maxNumHands: detectOptions.multiGesture ? 2 : 1,
      detectionConfidence: settings.handTrackingSensitivity
    });
    
    if (hands.length === 0) {
      // No hands detected
      if (lastGesture !== null && now - lastGestureTime > 500) {
        // Reset last gesture if hand disappears for over 500ms
        lastGesture = null;
        // Clear sequence if applicable
        if (gestureSequence.length > 0 && now - gestureWindowStart > 1000) {
          gestureSequence = [];
        }
      }
      return null;
    }
    
    // Process hand data and detect gestures
    const handResults = await Promise.all(hands.map(async (hand) => {
      // Get landmarks and bounding box
      const landmarks = hand.landmarks;
      
      // Track hand motion for gesture enhancement
      const currentHandPosition = calculateHandCenter(landmarks);
      let movementMagnitude = 0;
      
      if (previousHandPosition) {
        handVelocity = {
          x: currentHandPosition.x - previousHandPosition.x,
          y: currentHandPosition.y - previousHandPosition.y
        };
        
        // Calculate movement magnitude
        movementMagnitude = Math.sqrt(
          handVelocity.x * handVelocity.x + handVelocity.y * handVelocity.y
        );
      }
      previousHandPosition = currentHandPosition;
    
    // Adjust confidence threshold based on environmental conditions and movement
    let confidenceThreshold = adaptiveThreshold;
    
    // Apply adaptive threshold based on config
    if (config.adaptiveThreshold) {
      // If hand is moving fast, increase threshold to prevent false positives
      if (movementMagnitude > 15) {
        confidenceThreshold += 1.0;
      } else if (movementMagnitude < 5) {
        // If hand is relatively still, lower threshold for better detection
        confidenceThreshold -= 0.5;
      }
      
      // Keep threshold within reasonable bounds
      confidenceThreshold = Math.max(6.0, Math.min(confidenceThreshold, 9.0));
    } else {
      // Use fixed threshold from config
      confidenceThreshold = config.confidenceThreshold;
    }
    
    // Estimate gestures using fingerpose
    const estimatedGestures = gestureEstimator.estimate(landmarks, confidenceThreshold);
    
    if (estimatedGestures.gestures.length === 0) {
      return null; // No gesture detected
    }
    
    // Update adaptive threshold based on detection confidence
    // If we detected gestures, gradually adjust the threshold
    if (adaptiveThreshold !== confidenceThreshold) {
      adaptiveThreshold = confidenceThreshold * 0.9 + adaptiveThreshold * 0.1; // Smooth transition
    }
    
    // Process all detected gestures and their confidence scores
    const detectedGestures = estimatedGestures.gestures;
    const allGesturesWithScores = {};
    
    detectedGestures.forEach(gesture => {
      allGesturesWithScores[gesture.name] = gesture.score;
      
      // Update confidence history for this gesture
      if (!gestureConfidenceHistory[gesture.name]) {
        gestureConfidenceHistory[gesture.name] = [];
      }
      
      // Keep last 10 confidence scores to track stability
      gestureConfidenceHistory[gesture.name].push(gesture.score);
      if (gestureConfidenceHistory[gesture.name].length > 10) {
        gestureConfidenceHistory[gesture.name].shift();
      }
    });
    
    // Apply gesture stability enhancement:
    // If multiple gestures have similar scores, prefer the one that has been more stable
    const topGestures = detectedGestures
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Consider top 3 gestures
    
    if (topGestures.length >= 2) {
      const [first, second] = topGestures;
      
      // If scores are close (within 10%), consider stability
      if (second.score > first.score * 0.9) {
        const firstStability = calculateGestureStability(first.name);
        const secondStability = calculateGestureStability(second.name);
        
        // If second gesture is significantly more stable, prefer it
        if (secondStability > firstStability * 1.5) {
          topGestures[0] = second;
          topGestures[1] = first;
        }
      }
    }
    
    // Get highest confidence gesture after stability analysis
    const gesture = topGestures[0];
    
    // Consider motion for swipe gestures to enhance detection
    let finalGesture = gesture.name;
    
    // Motion enhancement for swipe gestures
    if (gesture.name === 'swipe_left' && handVelocity.x > 15) {
      // Boost confidence for swipe_left when hand is actually moving left
      finalGesture = 'swipe_left';
    } else if (gesture.name === 'swipe_right' && handVelocity.x < -15) {
      // Boost confidence for swipe_right when hand is actually moving right
      finalGesture = 'swipe_right';
    }
    
    // Update gesture sequence if this is a new gesture
    if (finalGesture !== lastGesture) {
      // Only count as a new gesture if enough time has passed
      // This prevents rapid oscillation between gestures
      if (now - lastGestureTime > 350) {
        if (gestureSequence.length === 0) {
          gestureWindowStart = now;
        }
        
        // Add to sequence
        gestureSequence.push({
          gesture: finalGesture,
          timestamp: now
        });
        
        // Keep sequence to reasonable length
        if (gestureSequence.length > 5) {
          gestureSequence.shift();
        }
        
        // Track gesture frequency
        gestureCounters[finalGesture] = (gestureCounters[finalGesture] || 0) + 1;
        
        // Update last gesture info
        lastGesture = finalGesture;
        lastGestureTime = now;
        
        // Save usage statistics for ML-based improvements
        saveGestureStatistics(finalGesture, allGesturesWithScores, gesture.score);
      }
    }
    
    return {
      name: finalGesture,
      confidence: gesture.score,
      allGestures: allGesturesWithScores,
      handPosition: currentHandPosition,
      velocity: handVelocity
    };
  } catch (error) {
    console.error('Error detecting gesture:', error);
    return null;
  }
};

// Calculate stability of a gesture based on confidence history
const calculateGestureStability = (gestureName) => {
  if (!gestureConfidenceHistory[gestureName] || 
      gestureConfidenceHistory[gestureName].length < 3) {
    return 0;
  }
  
  // Calculate standard deviation of confidence scores
  // Lower std dev means more stable
  const scores = gestureConfidenceHistory[gestureName];
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Invert so higher value means more stable
  return 1 / (stdDev + 0.01); // Add small epsilon to avoid division by zero
};

// Calculate center position of hand
const calculateHandCenter = (landmarks) => {
  if (!landmarks || landmarks.length === 0) return { x: 0, y: 0 };
  
  // Use palm base as center
  return {
    x: landmarks[0][0],
    y: landmarks[0][1]
  };
};

// Check for known gesture sequences and perform actions
const checkGestureSequence = (sequence) => {
  if (sequence.length < 2) return;
  
  // Extract just the gesture names in sequence
  const gestures = sequence.map(g => g.gesture);
  
  // Define known sequences and their actions
  const knownSequences = {
    'thumbs_up,thumbs_down': 'TOGGLE_APPROVAL',
    'palm,fist': 'GRAB_OBJECT',
    'swipe_left,swipe_right': 'SHAKE_GESTURE',
    'victory,fist': 'SCISSORS_TO_ROCK',
    'point_up,point_down': 'FLIP_DIRECTION'
  };
  
  // Check each known sequence
  for (const [pattern, action] of Object.entries(knownSequences)) {
    const patternGestures = pattern.split(',');
    
    // Check if the recent gestures match this pattern
    if (patternGestures.length <= gestures.length) {
      const recentGestures = gestures.slice(-patternGestures.length);
      
      if (recentGestures.join(',') === pattern) {
        console.log(`Detected gesture sequence: ${pattern} → Action: ${action}`);
        // Here we could trigger the sequence action
        // For now just log it
        return action;
      }
    }
  }
  
  return null;
};

// Save gesture statistics for machine learning improvements
const saveGestureStatistics = async (gestureName, allGestures, confidence) => {
  try {
    // Get existing statistics
    const statsJson = await AsyncStorage.getItem('gestureStatistics');
    let stats = statsJson ? JSON.parse(statsJson) : {
      gestureFrequency: {},
      confusionMatrix: {},
      timestamps: []
    };
    
    // Update frequency
    stats.gestureFrequency[gestureName] = (stats.gestureFrequency[gestureName] || 0) + 1;
    
    // Update confusion data - which gestures are often confused
    if (!stats.confusionMatrix[gestureName]) {
      stats.confusionMatrix[gestureName] = {};
    }
    
    // For each detected gesture that wasn't the top one
    Object.keys(allGestures).forEach(otherGesture => {
      if (otherGesture !== gestureName) {
        stats.confusionMatrix[gestureName][otherGesture] = 
          (stats.confusionMatrix[gestureName][otherGesture] || 0) + 1;
      }
    });
    
    // Record timestamp (keep latest 100)
    stats.timestamps.push({
      gesture: gestureName,
      time: Date.now(),
      confidence
    });
    
    if (stats.timestamps.length > 100) {
      stats.timestamps.shift();
    }
    
    // Save back to storage
    await AsyncStorage.setItem('gestureStatistics', JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving gesture statistics:', error);
  }
};

// Get gesture usage statistics
export const getGestureStatistics = async () => {
  try {
    const statsJson = await AsyncStorage.getItem('gestureStatistics');
    return statsJson ? JSON.parse(statsJson) : null;
  } catch (error) {
    console.error('Error loading gesture statistics:', error);
    return null;
  }
};

// Reset all gesture statistics
export const resetGestureStatistics = async () => {
  try {
    await AsyncStorage.removeItem('gestureStatistics');
    return true;
  } catch (error) {
    console.error('Error resetting gesture statistics:', error);
    return false;
  }
};
