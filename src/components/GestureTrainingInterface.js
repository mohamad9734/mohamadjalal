import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, TextInput, ScrollView, Alert, TouchableOpacity, Switch } from 'react-native';
import { saveGesture, startGestureTraining, stopGestureTraining, loadGestures } from '../utils/gestureRecognition';

/**
 * Advanced Gesture Training Interface
 * 
 * Allows users to create, save, and manage custom gestures with
 * real-time feedback and visual guidance.
 */
const GestureTrainingInterface = ({ 
  onGestureSaved,
  onCancel,
  initialGestureName = '',
  existingGestureData = null,
  isEditMode = false
}) => {
  // State
  const [gestureName, setGestureName] = useState(initialGestureName || '');
  const [recordingInProgress, setRecordingInProgress] = useState(false);
  const [recordedFrames, setRecordedFrames] = useState([]);
  const [currentStep, setCurrentStep] = useState('name');
  const [handLandmarks, setHandLandmarks] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [boundingBox, setBoundingBox] = useState(null);
  const [existingGestures, setExistingGestures] = useState([]);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [quality, setQuality] = useState('medium');
  const [handError, setHandError] = useState(null);
  
  // References
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const recordingFramesRef = useRef([]);
  
  // Load existing gestures to avoid name conflicts
  useEffect(() => {
    const loadExisting = async () => {
      const gestures = await loadGestures();
      setExistingGestures(gestures);
    };
    
    loadExisting();
  }, []);
  
  // Initialize by setting up fields if in edit mode
  useEffect(() => {
    if (isEditMode && existingGestureData) {
      setGestureName(existingGestureData.name || initialGestureName);
      // Other setup for editing an existing gesture
    }
  }, [isEditMode, existingGestureData, initialGestureName]);
  
  // Canvas drawing for hand landmarks
  useEffect(() => {
    if (canvasRef.current && handLandmarks) {
      drawHandLandmarks();
    }
  }, [handLandmarks, boundingBox]);
  
  // Clean up recording when component unmounts
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);
  
  // Draw hand landmarks on canvas
  const drawHandLandmarks = () => {
    if (!canvasRef.current || !handLandmarks) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const canvas = canvasRef.current;
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Define connections between landmarks for better visualization
    const connections = [
      // Thumb connections
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index finger
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle finger
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Ring finger
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Palm connections
      [0, 5], [5, 9], [9, 13], [13, 17]
    ];
    
    // Draw connections
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#4F46E5';
    ctx.lineCap = 'round';
    
    connections.forEach(([i, j]) => {
      ctx.beginPath();
      ctx.moveTo(handLandmarks[i][0], handLandmarks[i][1]);
      ctx.lineTo(handLandmarks[j][0], handLandmarks[j][1]);
      ctx.stroke();
    });
    
    // Draw points
    handLandmarks.forEach((point, i) => {
      // Key points (wrist, fingertips) are larger
      const isKeyPoint = i === 0 || i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
      const radius = isKeyPoint ? 6 : 4;
      
      ctx.beginPath();
      ctx.arc(point[0], point[1], radius, 0, 2 * Math.PI);
      
      // Different colors for key points
      if (isKeyPoint) {
        ctx.fillStyle = '#EF4444';
      } else {
        ctx.fillStyle = '#4F46E5';
      }
      ctx.fill();
    });
    
    // Draw bounding box if available
    if (boundingBox) {
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        boundingBox.topLeft[0], 
        boundingBox.topLeft[1], 
        boundingBox.bottomRight[0] - boundingBox.topLeft[0], 
        boundingBox.bottomRight[1] - boundingBox.topLeft[1]
      );
    }
    
    // Add labels for fingertips
    const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
    const fingertipIndices = [4, 8, 12, 16, 20];
    
    ctx.font = '12px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    
    fingertipIndices.forEach((index, i) => {
      const point = handLandmarks[index];
      const text = fingerNames[i];
      
      // Position text above fingertip
      const textX = point[0] - 20;
      const textY = point[1] - 10;
      
      // Draw text with stroke for better visibility
      ctx.strokeText(text, textX, textY);
      ctx.fillText(text, textX, textY);
    });
  };
  
  // Start recording frames for gesture creation
  const startRecording = async () => {
    setHandError(null);
    setRecordingInProgress(true);
    recordingFramesRef.current = [];
    
    // Start countdown
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          beginCapture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Begin capturing frames after countdown
  const beginCapture = async () => {
    try {
      await startGestureTraining(
        (prediction) => {
          if (prediction && prediction.landmarks) {
            setHandLandmarks(prediction.landmarks);
            setBoundingBox(prediction.boundingBox);
            
            if (recordingInProgress) {
              // Store frame data
              recordingFramesRef.current.push({
                landmarks: prediction.landmarks,
                timestamp: Date.now()
              });
            }
          }
        },
        (error) => {
          console.error('Training error:', error);
          setHandError('Error detecting hand. Please try again.');
        }
      );
      
      // Record for 2 seconds
      timerRef.current = setTimeout(() => {
        setRecordedFrames(recordingFramesRef.current);
        stopRecording();
        setCurrentStep('review');
      }, 2000);
    } catch (error) {
      console.error('Failed to start gesture training:', error);
      setHandError('Failed to start hand tracking. Please check camera permissions.');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    setRecordingInProgress(false);
    stopGestureTraining();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };
  
  // Process frames to extract gesture data
  const processGestureData = () => {
    if (recordedFrames.length === 0) {
      setHandError('No hand data detected. Please try again.');
      return null;
    }
    
    // Calculate the best frames (those with most stable hand position)
    const stableFrames = selectStableFrames(recordedFrames);
    if (stableFrames.length === 0) {
      return null;
    }
    
    // Extract finger postures from stable frames
    return extractGestureData(stableFrames);
  };
  
  // Select the most stable frames from the recording
  const selectStableFrames = (frames) => {
    if (frames.length <= 5) return frames;
    
    // Calculate movement between consecutive frames
    const frameMovements = [];
    for (let i = 1; i < frames.length; i++) {
      const prevFrame = frames[i-1];
      const currentFrame = frames[i];
      
      // Calculate average movement of all landmarks
      let totalMovement = 0;
      for (let j = 0; j < prevFrame.landmarks.length; j++) {
        const prev = prevFrame.landmarks[j];
        const current = currentFrame.landmarks[j];
        
        const dx = current[0] - prev[0];
        const dy = current[1] - prev[1];
        totalMovement += Math.sqrt(dx*dx + dy*dy);
      }
      
      const avgMovement = totalMovement / prevFrame.landmarks.length;
      frameMovements.push({
        index: i,
        movement: avgMovement
      });
    }
    
    // Sort frames by stability (least movement)
    frameMovements.sort((a, b) => a.movement - b.movement);
    
    // Select 5-10 most stable frames
    const selectedIndices = frameMovements
      .slice(0, Math.min(10, Math.ceil(frames.length / 2)))
      .map(item => item.index);
    
    selectedIndices.sort((a, b) => a - b); // Sort indices numerically
    
    return selectedIndices.map(index => frames[index]);
  };
  
  // Extract finger curl and direction data from frames
  const extractGestureData = (frames) => {
    // For advanced analysis, we should use the fingerpose library directly
    // Here we just prepare the data to be processed by the main gesture recognition system
    
    // Sample the middle frame for demonstration
    const middleFrame = frames[Math.floor(frames.length / 2)];
    
    return {
      name: gestureName,
      frames: frames.map(frame => ({
        landmarks: frame.landmarks,
        timestamp: frame.timestamp
      })),
      // Include the raw frame data for processing
      landmarks: middleFrame.landmarks,
      quality: quality,
      createdAt: Date.now()
    };
  };
  
  // Save the gesture
  const saveCustomGesture = async () => {
    // Validate name
    if (!gestureName.trim()) {
      Alert.alert('Error', 'Please provide a gesture name');
      return;
    }
    
    // Check for name conflicts
    const gestureId = gestureName.toLowerCase().replace(/\s+/g, '_');
    const nameExists = existingGestures.some(
      g => g.id === gestureId && (!isEditMode || g.id !== initialGestureName.toLowerCase().replace(/\s+/g, '_'))
    );
    
    if (nameExists) {
      Alert.alert('Error', 'A gesture with this name already exists. Please choose a different name.');
      return;
    }
    
    // Process and save
    const gestureData = processGestureData();
    if (!gestureData) {
      setHandError('Could not process gesture data. Please try again with clearer hand movements.');
      return;
    }
    
    try {
      const result = await saveGesture(gestureId, gestureData);
      
      if (result.success) {
        if (onGestureSaved) {
          onGestureSaved(result);
        }
      } else {
        Alert.alert('Error', `Failed to save gesture: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving gesture:', error);
      Alert.alert('Error', 'Failed to save gesture. Please try again.');
    }
  };
  
  // Render progress steps
  const renderProgressSteps = () => {
    const steps = ['name', 'record', 'review', 'save'];
    const currentIndex = steps.indexOf(currentStep);
    
    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <View 
              style={[
                styles.progressStep, 
                index <= currentIndex ? styles.progressStepActive : {}
              ]}
            >
              <Text style={styles.progressStepText}>{index + 1}</Text>
            </View>
            {index < steps.length - 1 && (
              <View 
                style={[
                  styles.progressLine, 
                  index < currentIndex ? styles.progressLineActive : {}
                ]} 
              />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };
  
  // Render the current step based on state
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'name':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Name Your Gesture</Text>
            <Text style={styles.stepDescription}>
              Choose a unique and descriptive name for your custom gesture.
            </Text>
            
            <TextInput 
              style={styles.input}
              value={gestureName}
              onChangeText={setGestureName}
              placeholder="Gesture Name"
              maxLength={20}
            />
            
            <View style={styles.advancedOptionsRow}>
              <Text>Advanced Options</Text>
              <Switch value={advancedMode} onValueChange={setAdvancedMode} />
            </View>
            
            {advancedMode && (
              <View style={styles.advancedOptions}>
                <Text style={styles.optionLabel}>Quality:</Text>
                <View style={styles.qualityOptions}>
                  {['low', 'medium', 'high'].map(q => (
                    <TouchableOpacity 
                      key={q}
                      style={[
                        styles.qualityOption,
                        quality === q ? styles.qualityOptionSelected : {}
                      ]}
                      onPress={() => setQuality(q)}
                    >
                      <Text 
                        style={[
                          styles.qualityOptionText,
                          quality === q ? styles.qualityOptionTextSelected : {}
                        ]}
                      >
                        {q.charAt(0).toUpperCase() + q.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.buttonRow}>
              <Button title="Cancel" onPress={onCancel} color="#6b7280" />
              <Button 
                title="Next"
                onPress={() => setCurrentStep('record')}
                disabled={!gestureName.trim()} 
              />
            </View>
          </View>
        );
        
      case 'record':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Record Gesture</Text>
            <Text style={styles.stepDescription}>
              Position your hand within the frame and hold the gesture steady.
              Recording will automatically begin after the countdown.
            </Text>
            
            <View style={styles.canvasContainer}>
              <canvas
                ref={canvasRef}
                width={320}
                height={240}
                style={styles.canvas}
              />
              
              {countdown > 0 && (
                <View style={styles.countdownOverlay}>
                  <Text style={styles.countdownText}>{countdown}</Text>
                </View>
              )}
              
              {recordingInProgress && countdown === 0 && (
                <View style={styles.recordingIndicator}>
                  <Text style={styles.recordingText}>Recording...</Text>
                </View>
              )}
              
              {handError && (
                <View style={styles.errorOverlay}>
                  <Text style={styles.errorText}>{handError}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.instructionContainer}>
              <Text style={styles.instruction}>
                • Position your hand clearly in the frame
              </Text>
              <Text style={styles.instruction}>
                • Hold the gesture steady during recording
              </Text>
              <Text style={styles.instruction}>
                • Ensure good lighting for best results
              </Text>
            </View>
            
            <View style={styles.buttonRow}>
              <Button 
                title="Back" 
                onPress={() => setCurrentStep('name')} 
                color="#6b7280" 
                disabled={recordingInProgress}
              />
              {!recordingInProgress ? (
                <Button 
                  title="Start Recording" 
                  onPress={startRecording} 
                  color="#10b981"
                />
              ) : (
                <Button 
                  title="Cancel Recording" 
                  onPress={stopRecording} 
                  color="#ef4444"
                />
              )}
            </View>
          </View>
        );
        
      case 'review':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Review Gesture</Text>
            <Text style={styles.stepDescription}>
              Review your recorded gesture. If you're not satisfied, you can record again.
            </Text>
            
            <View style={styles.reviewStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Frames:</Text>
                <Text style={styles.statValue}>{recordedFrames.length}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Quality:</Text>
                <Text style={styles.statValue}>
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Duration:</Text>
                <Text style={styles.statValue}>
                  {recordedFrames.length > 1 
                    ? `${((recordedFrames[recordedFrames.length-1].timestamp - recordedFrames[0].timestamp) / 1000).toFixed(1)}s` 
                    : 'N/A'}
                </Text>
              </View>
            </View>
            
            <View style={styles.canvasContainer}>
              <canvas
                ref={canvasRef}
                width={320}
                height={240}
                style={styles.canvas}
              />
            </View>
            
            <View style={styles.buttonRow}>
              <Button 
                title="Record Again" 
                onPress={() => setCurrentStep('record')} 
                color="#6b7280" 
              />
              <Button 
                title="Save Gesture" 
                onPress={() => {
                  saveCustomGesture();
                  setCurrentStep('save');
                }} 
              />
            </View>
          </View>
        );
        
      case 'save':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Gesture Saved</Text>
            <Text style={styles.stepDescription}>
              Your custom gesture has been saved successfully!
            </Text>
            
            <View style={styles.savedConfirmation}>
              <Text style={styles.savedGestureName}>{gestureName}</Text>
              <Text style={styles.savedDescription}>
                You can now use this gesture to control your device.
              </Text>
            </View>
            
            <Button 
              title="Done" 
              onPress={onCancel} 
            />
          </View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {renderProgressSteps()}
      {renderCurrentStep()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb'
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 16
  },
  progressStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center'
  },
  progressStepActive: {
    backgroundColor: '#4F46E5'
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280'
  },
  progressStepTextActive: {
    color: '#ffffff'
  },
  progressLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4
  },
  progressLineActive: {
    backgroundColor: '#4F46E5'
  },
  stepContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    marginBottom: 16
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  advancedOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  advancedOptions: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8
  },
  optionLabel: {
    fontWeight: 'bold',
    marginBottom: 8
  },
  qualityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  qualityOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    alignItems: 'center'
  },
  qualityOptionSelected: {
    backgroundColor: '#4F46E5'
  },
  qualityOptionText: {
    color: '#374151'
  },
  qualityOptionTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  canvasContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 16
  },
  canvas: {
    width: '100%',
    height: 240,
    backgroundColor: '#1f2937'
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  countdownText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  recordingIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  recordingText: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 8
  },
  errorText: {
    color: '#ffffff',
    textAlign: 'center'
  },
  instructionContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  instruction: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4
  },
  reviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  statItem: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  savedConfirmation: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 24
  },
  savedGestureName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 8
  },
  savedDescription: {
    color: '#047857',
    textAlign: 'center'
  }
});

export default GestureTrainingInterface;