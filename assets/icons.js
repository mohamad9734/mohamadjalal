import React from 'react';
import { Svg, Path, Circle, G } from 'react-native-svg';

export const GestureIcon = ({ width = 24, height = 24, color = '#4F46E5' }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <Path d="M6 2v1" />
      <Path d="M6 11v1" />
      <Path d="M11 6H10" />
      <Path d="M2 6H1" />
      <Path d="M16 12l2 2" />
      <Path d="M8 18H9" />
      <Path d="M12 12a4 4 0 0 1 8 0v8" />
      <Path d="M20 12a4 4 0 0 0-8 0v8" />
      <Path d="M12 16H8v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2" />
    </Svg>
  );
};

export const VoiceIcon = ({ width = 24, height = 24, color = '#4F46E5' }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Path d="M12 19v4" />
      <Path d="M8 23h8" />
    </Svg>
  );
};

export const FingerSwipeIcon = ({ width = 24, height = 24, color = '#4F46E5', direction = 'right' }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'right' ? (
        <>
          <Path d="M5 12h14" />
          <Path d="M12 5l7 7-7 7" />
        </>
      ) : (
        <>
          <Path d="M19 12H5" />
          <Path d="M12 19l-7-7 7-7" />
        </>
      )}
    </Svg>
  );
};

export const VoiceWaveform = ({ width = 24, height = 24, color = '#4F46E5' }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 12h2" />
      <Path d="M6 8v8" />
      <Path d="M10 4v16" />
      <Path d="M14 6v12" />
      <Path d="M18 2v20" />
      <Path d="M22 10v4" />
    </Svg>
  );
};

export const HandGesture = ({ width = 24, height = 24, color = '#4F46E5', gesture = 'palm' }) => {
  switch (gesture) {
    case 'palm':
      return (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <Path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
          <Path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
          <Path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </Svg>
      );
    
    case 'thumbs-up':
      return (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M7 10v12" />
          <Path d="M15 5.88l1 .12-1-.12z" />
          <Path d="M7 22h10.24a2 2 0 0 0 1.94-2.5l-1.57-6a2 2 0 0 0-1.94-1.5H14" />
          <Path d="M14 10V4.5a1.5 1.5 0 0 0-3 0v5.5" />
        </Svg>
      );

    case 'thumbs-down':
      return (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M17 14V2" />
          <Path d="M9 18.12l-1-.12 1 .12z" />
          <Path d="M17 2H6.76a2 2 0 0 0-1.94 2.5l1.57 6a2 2 0 0 0 1.94 1.5H10" />
          <Path d="M10 14v5.5a1.5 1.5 0 0 0 3 0V14" />
        </Svg>
      );
      
    case 'pinch':
      return (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 16a1 1 0 0 0 1 1h2.6a1 1 0 0 0 .7-.3l6.7-6.7a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0L6.3 12.7a1 1 0 0 0-.3.7V16z" />
          <Path d="M15 9l3 3" />
          <Path d="M10 4l4 4" />
          <Path d="M18 15l2 2" />
          <Path d="M15 18l3 3" />
        </Svg>
      );
      
    case 'pointing-up':
      return (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 2v6" />
          <Path d="m9 5 3-3 3 3" />
          <Path d="M17 8v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2z" />
        </Svg>
      );
      
    case 'pointing-down':
      return (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 22v-6" />
          <Path d="m15 19-3 3-3-3" />
          <Path d="M7 16V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
        </Svg>
      );
      
    case 'victory':
      return (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 9v.5" />
          <Path d="M18 9v.5" />
          <Path d="M10 4L8 22" />
          <Path d="M16 4l-2 6" />
          <Path d="M8.5 10a3.5 3.5 0 0 1 5 0" />
          <Path d="M5.5 9a6.5 6.5 0 0 1 13 0" />
          <Path d="M16 22l-4-10" />
        </Svg>
      );
      
    case 'fist':
      return (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M7 12.5V10a5 5 0 0 1 10 0v8.5a5 5 0 0 1-10 0V12.5z" />
          <Path d="M5.5 13.5V10a6.5 6.5 0 0 1 13 0v8.5a6.5 6.5 0 0 1-13 0V13.5z" />
          <Path d="M15 13v6" />
          <Path d="M12 13v6" />
          <Path d="M9 13v6" />
        </Svg>
      );
      
    case 'swipe-left':
      return (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 12h16" />
          <Path d="M4 12l6-6" />
          <Path d="M4 12l6 6" />
          <Path d="M18 6v12" />
        </Svg>
      );
      
    case 'swipe-right':
      return (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 12H4" />
          <Path d="M20 12l-6-6" />
          <Path d="M20 12l-6 6" />
          <Path d="M6 6v12" />
        </Svg>
      );
      
    case 'custom-gesture':
      return (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M19 5L5 19" />
          <Path d="M5 5l14 14" />
          <Circle cx="12" cy="12" r="9" />
        </Svg>
      );
      
    default:
      return (
        <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          <Path d="M6 2v1" />
          <Path d="M6 11v1" />
          <Path d="M11 6H10" />
          <Path d="M2 6H1" />
          <Path d="M16 12l2 2" />
          <Path d="M8 18H9" />
          <Path d="M12 12a4 4 0 0 1 8 0v8" />
          <Path d="M20 12a4 4 0 0 0-8 0v8" />
          <Path d="M12 16H8v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2" />
        </Svg>
      );
  }
};
