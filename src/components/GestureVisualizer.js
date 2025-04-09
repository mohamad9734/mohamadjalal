import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { HandGesture } from '../../assets/icons';

/**
 * Enhanced Gesture Visualizer Component
 * 
 * Provides real-time visualization of detected hand gestures with
 * animated feedback and visual cues for better user understanding.
 */
const GestureVisualizer = ({ 
  detectedGesture, 
  confidence = 0, 
  handPosition = null,
  velocity = null,
  size = 'medium',
  showLabels = true,
  theme = 'light',
  animate = true
}) => {
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 200, height: 150 });
  const animationRef = useRef(null);
  const [animationState, setAnimationState] = useState({
    scale: 1,
    opacity: 1,
    rotation: 0
  });
  
  // Determine size
  const sizeMap = {
    small: { width: 100, height: 80 },
    medium: { width: 200, height: 150 },
    large: { width: 300, height: 250 }
  };
  
  // Set dimensions based on size prop
  useEffect(() => {
    setDimensions(sizeMap[size] || sizeMap.medium);
  }, [size]);
  
  // Theme colors
  const themeColors = {
    light: {
      background: 'rgba(255, 255, 255, 0.1)',
      text: '#333333',
      primary: '#4F46E5',
      secondary: '#60A5FA',
      accent: '#10B981',
      border: '#E5E7EB'
    },
    dark: {
      background: 'rgba(17, 24, 39, 0.7)',
      text: '#F9FAFB',
      primary: '#818CF8',
      secondary: '#60A5FA',
      accent: '#34D399',
      border: '#374151'
    },
    blue: {
      background: 'rgba(59, 130, 246, 0.1)',
      text: '#1E40AF',
      primary: '#3B82F6',
      secondary: '#93C5FD',
      accent: '#2563EB',
      border: '#BFDBFE'
    }
  };
  
  const colors = themeColors[theme] || themeColors.light;
  
  // Animate the gesture visualization when it changes
  useEffect(() => {
    if (!animate) return;
    
    // Reset animation state
    setAnimationState({
      scale: 0.8,
      opacity: 0.7,
      rotation: 0
    });
    
    // Animate to normal state
    let startTime = null;
    const duration = 500;
    
    const animateFrame = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out function
      const easeOut = t => 1 - Math.pow(1 - t, 2);
      const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const easedProgress = easeOut(progress);
      
      setAnimationState({
        scale: 0.8 + (0.2 * easedProgress),
        opacity: 0.7 + (0.3 * easedProgress),
        rotation: detectedGesture?.includes('swipe') ? 
                 (detectedGesture === 'swipe_left' ? -15 * easeInOut(progress) : 15 * easeInOut(progress)) : 
                 0
      });
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateFrame);
      }
    };
    
    animationRef.current = requestAnimationFrame(animateFrame);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [detectedGesture, animate]);
  
  // Render the appropriate gesture icon or visualization
  const renderGestureIcon = () => {
    if (!detectedGesture) {
      return <div className="no-gesture-detected">No gesture detected</div>;
    }
    
    // Convert snake_case to readable form
    const gestureTitle = detectedGesture
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Map gesture names to appropriate gesture type for the HandGesture component
    const gestureTypeMap = {
      thumbs_up: 'thumbs-up',
      thumbs_down: 'thumbs-down',
      palm: 'palm',
      pinch: 'pinch',
      point_up: 'pointing-up',
      point_down: 'pointing-down',
      victory: 'victory',
      fist: 'fist',
      swipe_left: 'swipe-left',
      swipe_right: 'swipe-right'
    };
    
    const gestureType = gestureTypeMap[detectedGesture] || 'palm';
    
    return (
      <div className="gesture-display" style={{
        transform: `scale(${animationState.scale}) rotate(${animationState.rotation}deg)`,
        opacity: animationState.opacity,
        transition: animate ? 'transform 0.3s ease-out' : 'none'
      }}>
        <HandGesture 
          width={dimensions.width * 0.7} 
          height={dimensions.height * 0.7} 
          color={colors.primary} 
          gesture={gestureType} 
        />
        
        {showLabels && (
          <div className="gesture-label" style={{
            color: colors.text,
            marginTop: '8px',
            fontSize: size === 'small' ? '12px' : '16px',
            fontWeight: 'bold'
          }}>
            {gestureTitle}
            
            {confidence > 0 && (
              <span className="confidence-score" style={{
                marginLeft: '8px',
                fontSize: size === 'small' ? '10px' : '14px',
                opacity: 0.7,
                color: confidence > 8.5 ? '#10B981' : confidence > 7.5 ? '#FBBF24' : '#EF4444'
              }}>
                {Math.round(confidence * 10) / 10}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Draw velocity vector if hand position and velocity are provided
  useEffect(() => {
    if (!canvasRef.current || !handPosition || !velocity) return;
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    if (Math.abs(velocity.x) < 0.5 && Math.abs(velocity.y) < 0.5) return;
    
    // Calculate a suitable center point for the vector
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    // Scale the velocity vector for visibility
    const scale = 5;
    const vectorX = velocity.x * scale;
    const vectorY = velocity.y * scale;
    
    // Draw the velocity vector
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + vectorX, centerY + vectorY);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw arrowhead
    const headLength = 10;
    const angle = Math.atan2(vectorY, vectorX);
    
    ctx.beginPath();
    ctx.moveTo(centerX + vectorX, centerY + vectorY);
    ctx.lineTo(
      centerX + vectorX - headLength * Math.cos(angle - Math.PI / 6),
      centerY + vectorY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      centerX + vectorX - headLength * Math.cos(angle + Math.PI / 6),
      centerY + vectorY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.lineTo(centerX + vectorX, centerY + vectorY);
    ctx.fillStyle = colors.accent;
    ctx.fill();
    
  }, [handPosition, velocity, dimensions, colors]);
  
  return (
    <div className={`gesture-visualizer ${size} theme-${theme}`} style={{
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: colors.background,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Canvas for velocity vector or additional visualizations */}
      <canvas 
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
      
      {/* Gesture display */}
      {renderGestureIcon()}
    </div>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative'
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  },
  noGesture: {
    opacity: 0.5,
    fontSize: 14
  },
  gestureDisplay: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  gestureLabel: {
    marginTop: 8,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  confidenceScore: {
    marginLeft: 8,
    opacity: 0.7
  }
});

export default GestureVisualizer;