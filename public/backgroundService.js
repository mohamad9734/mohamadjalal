// Background Service for Gesture & Voice Control App
// This service keeps gesture detection running even when the app is minimized

class BackgroundGestureService {
    constructor() {
        this.isRunning = false;
        this.handposeModel = null;
        this.gestureEstimator = null;
        this.videoStream = null;
        this.videoElement = null;
        this.detectionInterval = null;
        this.lastDetectedGesture = null;
        this.onGestureDetected = null;
        this.workerActive = false;
        
        // Enhanced gesture detection properties
        this.previousHandPosition = null;
        this.handVelocity = { x: 0, y: 0 };
        this.gestureConfidenceHistory = {};
        this.gestureCounters = {};
        this.lastGestureTimestamp = 0;
        this.gestureSequence = [];
    }

    async initialize() {
        console.log('Initializing background gesture service...');
        try {
            await tf.ready();
            console.log('TensorFlow.js is ready in background');
            
            // Load handpose model
            this.handposeModel = await handpose.load();
            console.log('Handpose model loaded successfully in background');
            
            // Initialize gesture estimator
            await this.initializeGestureEstimator();
            
            return true;
        } catch (error) {
            console.error('Error initializing background service:', error);
            return false;
        }
    }

    async initializeGestureEstimator() {
        const fp = window.fp;
        if (!fp) {
            console.error('Fingerpose library not loaded in background service');
            return;
        }
        
        // Define default gestures
        const thumbsUpGesture = new fp.GestureDescription('thumbs_up');
        thumbsUpGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
        thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalUp, 1.0);
        thumbsUpGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
        thumbsUpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
        thumbsUpGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
        thumbsUpGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
        
        // Define palm gesture
        const palmGesture = new fp.GestureDescription('palm');
        palmGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
        palmGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
        palmGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
        palmGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.NoCurl, 1.0);
        palmGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);

        // Define pinch gesture
        const pinchGesture = new fp.GestureDescription('pinch');
        pinchGesture.addCurl(fp.Finger.Index, fp.FingerCurl.HalfCurl, 0.8);
        pinchGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 0.8);
        pinchGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpRight, 1.0);
        pinchGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft, 1.0);
        
        // Define pointing up gesture
        const pointingUpGesture = new fp.GestureDescription('pointing_up');
        pointingUpGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
        pointingUpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
        pointingUpGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);
        pointingUpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
        pointingUpGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
        pointingUpGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
        
        // Define pointing down gesture
        const pointingDownGesture = new fp.GestureDescription('pointing_down');
        pointingDownGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
        pointingDownGesture.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalDown, 1.0);
        pointingDownGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);
        pointingDownGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
        pointingDownGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
        pointingDownGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
        
        // Initialize with defined gestures
        this.gestureEstimator = new fp.GestureEstimator([
            thumbsUpGesture,
            palmGesture,
            pinchGesture,
            pointingUpGesture,
            pointingDownGesture
        ]);
        
        // Add victory gesture if exists in localStorage
        try {
            const savedConfig = localStorage.getItem('custom_gesture_config');
            if (savedConfig) {
                this.addVictoryGesture();
            }
        } catch (error) {
            console.error('Error loading custom gesture in background:', error);
        }
    }
    
    // Add victory gesture to estimator
    addVictoryGesture() {
        if (window.fp && this.gestureEstimator) {
            const fp = window.fp;
            const victoryGesture = new fp.GestureDescription('victory');
            
            // Index and Middle finger extended
            victoryGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
            victoryGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
            
            // Other fingers curled
            victoryGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
            victoryGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
            victoryGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.8);
            
            // Index and Middle pointing up
            victoryGesture.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
            victoryGesture.addDirection(fp.Finger.Middle, fp.FingerDirection.VerticalUp, 1.0);
            
            // Add to gesture estimator
            this.gestureEstimator.addGesture(victoryGesture);
            console.log('Added victory gesture to background service');
        }
    }

    async start(callback) {
        if (this.isRunning) return;
        
        this.onGestureDetected = callback;
        
        try {
            // Initialize if not already done
            if (!this.handposeModel) {
                const initialized = await this.initialize();
                if (!initialized) {
                    console.error('Failed to initialize background service');
                    return false;
                }
            }
            
            // Set up video element
            this.videoElement = document.createElement('video');
            this.videoElement.className = 'background-camera-feed';
            this.videoElement.width = 320;
            this.videoElement.height = 240;
            this.videoElement.autoplay = true;
            this.videoElement.playsInline = true;
            this.videoElement.muted = true;
            
            // Access camera
            this.videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 320,
                    height: 240,
                    facingMode: 'user'
                }
            });
            
            this.videoElement.srcObject = this.videoStream;
            await new Promise(resolve => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play().then(resolve);
                };
            });
            
            // Start detection loop
            this.isRunning = true;
            this.startDetectionLoop();
            
            // Start the worker to keep service active
            this.startWorker();
            
            console.log('Background gesture service started');
            return true;
        } catch (error) {
            console.error('Error starting background service:', error);
            this.cleanup();
            return false;
        }
    }
    
    startWorker() {
        if (this.workerActive) return;
        
        // Create a simple worker to keep service active
        const workerBlob = new Blob([`
            let interval;
            self.onmessage = function(e) {
                if (e.data === 'start') {
                    interval = setInterval(() => {
                        self.postMessage('ping');
                    }, 1000);
                } else if (e.data === 'stop') {
                    clearInterval(interval);
                    self.close();
                }
            };
        `], { type: 'application/javascript' });
        
        const workerUrl = URL.createObjectURL(workerBlob);
        this.worker = new Worker(workerUrl);
        
        this.worker.onmessage = (e) => {
            if (e.data === 'ping' && !document.hidden && this.isRunning) {
                // Keep the service alive even when app is in background
                this.detectOnce();
            }
        };
        
        this.worker.postMessage('start');
        this.workerActive = true;
        
        // Register visibility change listener
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Document is hidden (app in background)
            console.log('App in background, keeping gesture detection active');
            // We'll continue detection via the worker
        } else {
            // Document is visible again
            console.log('App in foreground');
        }
    }

    startDetectionLoop() {
        if (!this.isRunning) return;
        
        this.detectionInterval = setInterval(() => {
            this.detectOnce();
        }, 200); // Detection every 200ms for performance
    }
    
    async detectOnce() {
        if (!this.videoElement || !this.handposeModel || !this.isRunning) return;
        
        try {
            const now = Date.now();
            const predictions = await this.handposeModel.estimateHands(this.videoElement);
            
            if (predictions.length > 0) {
                const hand = predictions[0];
                
                // Get enhanced gesture detection result
                const gestureResult = await this.detectGesture(hand);
                
                if (gestureResult) {
                    // Update gesture sequence tracking
                    if (gestureResult.name !== this.lastDetectedGesture) {
                        // Only count as a new gesture if enough time has passed
                        // This prevents rapid oscillation between gestures
                        if (now - this.lastGestureTimestamp > 500) {
                            // Add to sequence for potential combo detection
                            this.gestureSequence.push({
                                gesture: gestureResult.name,
                                timestamp: now
                            });
                            
                            // Keep sequence to reasonable length
                            if (this.gestureSequence.length > 5) {
                                this.gestureSequence.shift();
                            }
                            
                            // Track gesture frequency
                            this.gestureCounters[gestureResult.name] = 
                                (this.gestureCounters[gestureResult.name] || 0) + 1;
                            
                            // Update last detected information
                            console.log('Background service detected:', gestureResult.name, 
                                        'confidence:', gestureResult.confidence.toFixed(2));
                            this.lastDetectedGesture = gestureResult.name;
                            this.lastGestureTimestamp = now;
                            
                            // Check for gesture sequence patterns
                            if (this.gestureSequence.length >= 2) {
                                const sequencePattern = this.checkGestureSequence();
                                if (sequencePattern) {
                                    console.log('Background service detected gesture sequence:', sequencePattern);
                                    // Could trigger special actions for sequences here
                                }
                            }
                            
                            // Execute action for the gesture via callback
                            if (this.onGestureDetected) {
                                this.onGestureDetected(gestureResult.name, {
                                    confidence: gestureResult.confidence,
                                    handPosition: gestureResult.handPosition,
                                    velocity: gestureResult.velocity
                                });
                            }
                        }
                    }
                }
            } else {
                // No hand detected for a while, reset sequence tracking
                if (this.lastDetectedGesture !== null && now - this.lastGestureTimestamp > 1000) {
                    this.lastDetectedGesture = null;
                    
                    // If sequence is interesting (has multiple gestures), log it before clearing
                    if (this.gestureSequence.length > 1) {
                        console.log('Gesture sequence ended:', 
                            this.gestureSequence.map(item => item.gesture).join(' → '));
                    }
                    
                    this.gestureSequence = [];
                }
            }
        } catch (error) {
            console.error('Error in background detection:', error);
        }
    }
    
    // Check for known gesture sequences
    checkGestureSequence() {
        if (this.gestureSequence.length < 2) return null;
        
        // Extract gesture names
        const gestureNames = this.gestureSequence.map(item => item.gesture);
        const recentGestures = gestureNames.slice(-2).join(',');
        
        // Define known sequences
        const knownSequences = {
            'thumbs_up,thumbs_down': 'TOGGLE_APPROVAL',
            'palm,victory': 'SHOW_MENU',
            'swipe_left,swipe_right': 'SHAKE_ACTION',
            'pointing_up,pointing_down': 'FLIP_DIRECTION'
        };
        
        // Check if recent gestures match any known pattern
        return knownSequences[recentGestures] || null;
    }
    
    async detectGesture(hand) {
        if (!this.gestureEstimator) return null;
        
        const landmarks = hand.landmarks;
        
        // Calculate hand center position for tracking movement
        const currentHandPosition = this.calculateHandCenter(landmarks);
        
        // Track hand motion if we have previous position
        if (this.previousHandPosition) {
            this.handVelocity = {
                x: currentHandPosition.x - this.previousHandPosition.x,
                y: currentHandPosition.y - this.previousHandPosition.y
            };
        } else {
            this.handVelocity = { x: 0, y: 0 };
        }
        this.previousHandPosition = currentHandPosition;
        
        // Calculate movement magnitude
        const movementMagnitude = Math.sqrt(
            this.handVelocity.x * this.handVelocity.x + 
            this.handVelocity.y * this.handVelocity.y
        );
        
        // Adjust confidence threshold based on movement and conditions
        let confidenceThreshold = 9.0; // Default is higher for background mode
        
        // If hand is moving fast, increase threshold to prevent false positives
        if (movementMagnitude > 20) {
            confidenceThreshold += 1.0;
        } else if (movementMagnitude < 5) {
            // If hand is relatively still, lower threshold for better detection
            confidenceThreshold -= 0.5;
        }
        
        // Keep threshold within reasonable bounds
        confidenceThreshold = Math.max(7.5, Math.min(confidenceThreshold, 10.0));
        
        // Convert landmarks to fingerpose format
        const estimatorLandmarks = landmarks.map(point => [point[0], point[1], point[2]]);
        
        // Estimate gestures with adjusted threshold
        const result = this.gestureEstimator.estimate(estimatorLandmarks, confidenceThreshold);
        
        // Get most confident gesture
        if (result.gestures.length > 0) {
            // Process and collect all gesture confidences
            const confidences = {};
            result.gestures.forEach(gesture => {
                confidences[gesture.name] = gesture.score;
            });
            
            // Sort gestures by confidence
            const sortedGestures = result.gestures.sort((a, b) => b.score - a.score);
            
            // Get highest confidence gesture
            let highestConfidenceGesture = sortedGestures[0].name;
            
            // Apply motion enhancement for swipe gestures
            if (highestConfidenceGesture === 'swipe_left' && this.handVelocity.x > 15) {
                // Boost confidence for swipe_left when hand is actually moving left
                highestConfidenceGesture = 'swipe_left';
            } else if (highestConfidenceGesture === 'swipe_right' && this.handVelocity.x < -15) {
                // Boost confidence for swipe_right when hand is actually moving right
                highestConfidenceGesture = 'swipe_right';
            }
            
            // Update gesture stability tracking
            if (!this.gestureConfidenceHistory[highestConfidenceGesture]) {
                this.gestureConfidenceHistory[highestConfidenceGesture] = [];
            }
            
            // Keep last 5 confidence scores to track stability
            this.gestureConfidenceHistory[highestConfidenceGesture].push(confidences[highestConfidenceGesture]);
            if (this.gestureConfidenceHistory[highestConfidenceGesture].length > 5) {
                this.gestureConfidenceHistory[highestConfidenceGesture].shift();
            }
            
            // Return enhanced result
            return {
                name: highestConfidenceGesture,
                confidence: confidences[highestConfidenceGesture],
                allGestures: confidences,
                handPosition: currentHandPosition,
                velocity: this.handVelocity
            };
        }
        
        return null;
    }
    
    // Helper function to calculate center position of hand
    calculateHandCenter(landmarks) {
        if (!landmarks || landmarks.length === 0) return { x: 0, y: 0 };
        
        // Use palm base as center
        return {
            x: landmarks[0][0],
            y: landmarks[0][1]
        };
    }

    stop() {
        this.isRunning = false;
        this.cleanup();
        console.log('Background gesture service stopped');
    }
    
    cleanup() {
        // Clear detection interval
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        
        // Stop video stream
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
        
        // Clean up video element
        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement = null;
        }
        
        // Stop worker
        if (this.worker && this.workerActive) {
            this.worker.postMessage('stop');
            this.workerActive = false;
        }
        
        // Remove visibility change listener
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        this.lastDetectedGesture = null;
    }
}

// Create global instance
window.backgroundGestureService = new BackgroundGestureService();