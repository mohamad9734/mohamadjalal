import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  initTensorFlow, 
  detectGesture, 
  startGestureTraining, 
  stopGestureTraining,
  getGestureStatistics
} from '../utils/gestureRecognition';
import { executeAction, gestureToAction } from '../utils/phoneControl';

const GestureDetector = ({ onGestureDetected, showStats = false, gestureOptions = {} }) => {
  // Main state
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [lastGesture, setLastGesture] = useState(null);
  const [lastGestureDetails, setLastGestureDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Advanced tracking state
  const [handTracking, setHandTracking] = useState({
    isVisible: false,
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 }
  });
  const [gestureStats, setGestureStats] = useState(null);
  const [gestureHistory, setGestureHistory] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const gestureDebounceTimer = useRef(null);
  
  // Detection settings
  const detectionInterval = useMemo(() => {
    // Faster detection interval for better UX
    return gestureOptions.highPerformanceMode ? 200 : 350;
  }, [gestureOptions.highPerformanceMode]);
  
  const visualizationSettings = useMemo(() => {
    return {
      showLandmarks: gestureOptions.showLandmarks !== false,
      showTrajectory: gestureOptions.showTrajectory === true,
      landmarkColor: gestureOptions.landmarkColor || '#4F46E5',
      confidenceThreshold: gestureOptions.confidenceThreshold || 7.5
    };
  }, [gestureOptions]);
  
  // Initialize TensorFlow and request camera permissions
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Initialize TensorFlow.js
        const initialized = await initTensorFlow();
        if (!initialized) {
          throw new Error('Failed to initialize TensorFlow.js');
        }
        setIsInitialized(true);
        
        // Load gesture statistics if requested
        if (showStats) {
          const stats = await getGestureStatistics();
          setGestureStats(stats);
        }
        
        // Request camera permission
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: 640,
              height: 480,
              facingMode: 'user'
            }
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasPermission(true);
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          setHasPermission(false);
          setError('Camera access denied. Please enable camera permissions.');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setIsLoading(false);
        setError(err.message);
      }
    };
    
    initialize();
    
    // Cleanup
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [showStats]);
  
  // Enhanced hand landmark visualization
  const drawHandLandmarks = (ctx, landmarks, handBoundingBox) => {
    if (!ctx || !landmarks) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    if (!visualizationSettings.showLandmarks) return;
    
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
    
    // Draw connections first (under the points)
    ctx.lineWidth = 3;
    ctx.strokeStyle = visualizationSettings.landmarkColor;
    ctx.lineCap = 'round';
    
    connections.forEach(([i, j]) => {
      ctx.beginPath();
      ctx.moveTo(landmarks[i][0], landmarks[i][1]);
      ctx.lineTo(landmarks[j][0], landmarks[j][1]);
      ctx.stroke();
    });
    
    // Draw points with different sizes based on their importance
    landmarks.forEach((point, i) => {
      // Key points (wrist, fingertips) are larger
      const isKeyPoint = i === 0 || i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
      const radius = isKeyPoint ? 6 : 4;
      
      ctx.beginPath();
      ctx.arc(point[0], point[1], radius, 0, 2 * Math.PI);
      
      // Fill style - use different colors for key points
      if (isKeyPoint) {
        ctx.fillStyle = '#FF4136'; // Red for key points
      } else {
        ctx.fillStyle = visualizationSettings.landmarkColor;
      }
      ctx.fill();
    });
    
    // Draw hand bounding box if available
    if (handBoundingBox && debugMode) {
      const { topLeft, bottomRight } = handBoundingBox;
      
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        topLeft[0], 
        topLeft[1], 
        bottomRight[0] - topLeft[0], 
        bottomRight[1] - topLeft[1]
      );
    }
    
    // Draw motion trajectory if enabled
    if (visualizationSettings.showTrajectory && 
        handTracking.isVisible && 
        handTracking.velocity.x !== 0 && 
        handTracking.velocity.y !== 0) {
      const scaleFactor = 3; // Scale up velocity for better visualization
      
      ctx.strokeStyle = 'rgba(255, 165, 0, 0.7)'; // Orange for trajectory
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(handTracking.position.x, handTracking.position.y);
      ctx.lineTo(
        handTracking.position.x + handTracking.velocity.x * scaleFactor,
        handTracking.position.y + handTracking.velocity.y * scaleFactor
      );
      ctx.stroke();
    }
    
    // Show confidence and additional info in debug mode
    if (debugMode && lastGestureDetails) {
      ctx.font = '14px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // Background for text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(5, 5, 180, 80);
      
      // Text info
      ctx.fillStyle = 'white';
      ctx.fillText(`Gesture: ${lastGestureDetails.name}`, 10, 10);
      ctx.fillText(`Confidence: ${lastGestureDetails.confidence.toFixed(2)}`, 10, 30);
      ctx.fillText(`V-X: ${handTracking.velocity.x.toFixed(1)}`, 10, 50);
      ctx.fillText(`V-Y: ${handTracking.velocity.y.toFixed(1)}`, 10, 70);
    }
  };
  
  // Start gesture detection when initialized and camera is ready
  useEffect(() => {
    let frameProcessorId = null;
    
    const startDetection = async () => {
      if (isInitialized && hasPermission && videoRef.current) {
        try {
          // Start processing frames
          await startGestureTraining(
            (prediction) => {
              // Update hand tracking state
              setHandTracking(prev => ({
                ...prev,
                isVisible: true,
                position: { 
                  x: prediction.landmarks[0][0], 
                  y: prediction.landmarks[0][1] 
                }
              }));
              
              // Draw hand landmarks on canvas
              if (canvasRef.current && prediction.landmarks) {
                const ctx = canvasRef.current.getContext('2d');
                drawHandLandmarks(
                  ctx, 
                  prediction.landmarks, 
                  prediction.boundingBox
                );
              }
            },
            (err) => {
              console.error('Frame processing error:', err);
            }
          );
          
          // Detect gestures at adaptive interval
          frameProcessorId = setInterval(async () => {
            if (videoRef.current) {
              try {
                const result = await detectGesture(videoRef.current);
                
                if (result) {
                  // Store detailed gesture information
                  setLastGestureDetails(result);
                  
                  // Update hand tracking with velocity data
                  if (result.velocity && result.handPosition) {
                    setHandTracking(prev => ({
                      ...prev,
                      velocity: result.velocity,
                      position: result.handPosition
                    }));
                  }
                  
                  // Check if the gesture is different or if we should debounce
                  if (result.name !== lastGesture) {
                    // Clear any existing debounce timer
                    if (gestureDebounceTimer.current) {
                      clearTimeout(gestureDebounceTimer.current);
                    }
                    
                    // Debounce gesture updates to prevent flickering
                    gestureDebounceTimer.current = setTimeout(() => {
                      // Only update if this is still the latest gesture
                      setLastGesture(result.name);
                      
                      // Add to history
                      setGestureHistory(prev => {
                        const newHistory = [
                          {
                            gesture: result.name,
                            confidence: result.confidence,
                            timestamp: Date.now()
                          },
                          ...prev
                        ].slice(0, 10);
                        return newHistory;
                      });
                      
                      // Map gesture to action and execute
                      const action = gestureToAction[result.name];
                      if (action) {
                        console.log('Executing action:', action);
                        executeAction(action);
                        
                        // Notify parent component
                        if (onGestureDetected) {
                          onGestureDetected({
                            gesture: result.name,
                            action: action,
                            confidence: result.confidence,
                            allGestures: result.allGestures
                          });
                        }
                      }
                    }, 200); // 200ms debounce
                  }
                } else {
                  // No hand detected
                  if (handTracking.isVisible) {
                    setHandTracking(prev => ({
                      ...prev,
                      isVisible: false
                    }));
                  }
                }
              } catch (error) {
                console.error('Error detecting gesture:', error);
              }
            }
          }, detectionInterval);
        } catch (error) {
          console.error('Error starting gesture detection:', error);
          setError('Failed to start gesture detection.');
        }
      }
    };
    
    if (isInitialized && hasPermission) {
      startDetection();
    }
    
    // Cleanup
    return () => {
      if (frameProcessorId) {
        clearInterval(frameProcessorId);
      }
      if (gestureDebounceTimer.current) {
        clearTimeout(gestureDebounceTimer.current);
      }
      stopGestureTraining();
    };
  }, [isInitialized, hasPermission, lastGesture, onGestureDetected, detectionInterval, visualizationSettings, debugMode]);
  
  if (isLoading) {
    return (
      <div className="gesture-detector">
        <div className="loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Initializing advanced gesture detection...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="gesture-detector">
        <div className="error-message">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }
  
  if (hasPermission === false) {
    return (
      <div className="gesture-detector">
        <div className="alert alert-warning" role="alert">
          Camera access denied. Please enable camera permissions.
        </div>
      </div>
    );
  }
  
  return (
    <div className="gesture-detector">
      <div className="video-container">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          width="320" 
          height="240"
          onLoadedMetadata={(e) => e.target.play()}
          className="camera-feed"
        />
        <canvas 
          ref={canvasRef} 
          width="320" 
          height="240"
          className="gesture-overlay"
        />
      </div>
      
      {/* Gesture Indicator */}
      {lastGesture && (
        <div className="gesture-indicator">
          <span className="badge bg-primary">
            {lastGesture.replace(/_/g, ' ')}
          </span>
          {lastGestureDetails && (
            <span className="badge bg-info ms-1">
              {Math.round(lastGestureDetails.confidence * 10) / 10}
            </span>
          )}
          {gestureToAction[lastGesture] && (
            <span className="badge bg-success ms-1">
              {gestureToAction[lastGesture].replace(/_/g, ' ')}
            </span>
          )}
        </div>
      )}
      
      {/* Debug Controls - only if requested */}
      {gestureOptions.showDebugControls && (
        <div className="mt-2 d-flex justify-content-center">
          <button 
            className={`btn btn-sm ${debugMode ? 'btn-danger' : 'btn-outline-secondary'}`}
            onClick={() => setDebugMode(!debugMode)}
          >
            {debugMode ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      )}
      
      {/* Gesture Statistics - only if requested */}
      {showStats && gestureStats && (
        <div className="mt-3 small">
          <h6 className="fw-bold">Gesture Stats</h6>
          <div className="row">
            {Object.entries(gestureStats.gestureFrequency || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([gesture, count]) => (
                <div className="col-4" key={gesture}>
                  <div className="text-center">
                    <div className="fw-bold">{count}</div>
                    <div>{gesture.replace(/_/g, ' ')}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default GestureDetector;
