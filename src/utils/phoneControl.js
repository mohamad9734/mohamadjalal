// Utility functions for controlling the phone based on commands

export const executeAction = (action) => {
  console.log(`Executing action: ${action}`);
  
  switch (action) {
    case 'OPEN_CAMERA':
      console.log('Mock: Opening camera');
      return { success: true, message: 'Camera opened' };
      
    case 'TAKE_PHOTO':
      console.log('Mock: Taking photo');
      return { success: true, message: 'Photo taken' };
      
    case 'INCREASE_BRIGHTNESS':
      console.log('Mock: Increasing brightness');
      return { success: true, message: 'Brightness increased' };
      
    case 'DECREASE_BRIGHTNESS':
      console.log('Mock: Decreasing brightness');
      return { success: true, message: 'Brightness decreased' };
      
    case 'OPEN_SETTINGS':
      console.log('Mock: Opening settings');
      return { success: true, message: 'Settings opened' };
      
    case 'GO_BACK':
      console.log('Mock: Going back');
      return { success: true, message: 'Went back' };
      
    case 'SCROLL_UP':
      console.log('Mock: Scrolling up');
      return { success: true, message: 'Scrolled up' };
      
    case 'SCROLL_DOWN':
      console.log('Mock: Scrolling down');
      return { success: true, message: 'Scrolled down' };
      
    default:
      console.log(`Unknown action: ${action}`);
      return { success: false, message: 'Unknown action' };
  }
};

export const commandToAction = (command) => {
  // Map voice commands to actions
  const commandMap = {
    'open camera': 'OPEN_CAMERA',
    'take photo': 'TAKE_PHOTO',
    'increase brightness': 'INCREASE_BRIGHTNESS',
    'decrease brightness': 'DECREASE_BRIGHTNESS',
    'open settings': 'OPEN_SETTINGS',
    'go back': 'GO_BACK',
    'scroll up': 'SCROLL_UP',
    'scroll down': 'SCROLL_DOWN'
  };
  
  const normalizedCommand = command.toLowerCase().trim();
  return commandMap[normalizedCommand] || null;
};

export const getAvailableActions = () => {
  return [
    { id: 'OPEN_CAMERA', name: 'Open Camera', icon: 'camera' },
    { id: 'TAKE_PHOTO', name: 'Take Photo', icon: 'camera' },
    { id: 'INCREASE_BRIGHTNESS', name: 'Increase Brightness', icon: 'sun' },
    { id: 'DECREASE_BRIGHTNESS', name: 'Decrease Brightness', icon: 'moon' },
    { id: 'OPEN_SETTINGS', name: 'Open Settings', icon: 'settings' },
    { id: 'GO_BACK', name: 'Go Back', icon: 'arrow-left' },
    { id: 'SCROLL_UP', name: 'Scroll Up', icon: 'arrow-up' },
    { id: 'SCROLL_DOWN', name: 'Scroll Down', icon: 'arrow-down' }
  ];
};

export const gestureToAction = {
  'swipe_right': 'GO_BACK',
  'swipe_left': 'OPEN_SETTINGS',
  'thumbs_up': 'TAKE_PHOTO',
  'palm': 'OPEN_CAMERA',
  'pinch': 'DECREASE_BRIGHTNESS',
  'spread': 'INCREASE_BRIGHTNESS'
};
