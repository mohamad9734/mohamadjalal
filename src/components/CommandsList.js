import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { colors, typography, spacing } from '../styles/globalStyles';
import { getAvailableActions } from '../utils/phoneControl';

const CommandsList = ({ darkMode }) => {
  const actions = getAvailableActions();
  
  // Get theme colors based on dark mode
  const getThemeColor = (lightColor, darkColor) => {
    return darkMode ? darkColor : lightColor;
  };
  
  // Icon mapping
  const renderIcon = (iconName, color) => {
    switch (iconName) {
      case 'camera':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <Path cx="12" cy="13" r="4" />
          </Svg>
        );
      
      case 'sun':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path cx="12" cy="12" r="5" />
            <Path d="M12 1v2" />
            <Path d="M12 21v2" />
            <Path d="M4.22 4.22l1.42 1.42" />
            <Path d="M18.36 18.36l1.42 1.42" />
            <Path d="M1 12h2" />
            <Path d="M21 12h2" />
            <Path d="M4.22 19.78l1.42-1.42" />
            <Path d="M18.36 5.64l1.42-1.42" />
          </Svg>
        );
      
      case 'moon':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </Svg>
        );
      
      case 'settings':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path cx="12" cy="12" r="3" />
            <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </Svg>
        );
      
      case 'arrow-left':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5" />
            <Path d="M12 19l-7-7 7-7" />
          </Svg>
        );
      
      case 'arrow-up':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 19V5" />
            <Path d="M5 12l7-7 7 7" />
          </Svg>
        );
      
      case 'arrow-down':
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 5v14" />
            <Path d="M19 12l-7 7-7-7" />
          </Svg>
        );
      
      default:
        return (
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 2L2 7l10 5 10-5-10-5z" />
            <Path d="M2 17l10 5 10-5" />
            <Path d="M2 12l10 5 10-5" />
          </Svg>
        );
    }
  };
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: getThemeColor(colors.card, colors.cardDark) }
    ]}>
      <Text style={[
        typography.h3,
        { color: getThemeColor(colors.text, colors.textDark) }
      ]}>
        Available Commands
      </Text>
      
      <ScrollView 
        style={styles.commandList}
        showsVerticalScrollIndicator={false}
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.commandItem,
              { borderBottomColor: getThemeColor(colors.border, colors.borderDark) }
            ]}
          >
            <View style={styles.iconContainer}>
              {renderIcon(action.icon, colors.primary)}
            </View>
            
            <Text style={[
              typography.body,
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              {action.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  commandList: {
    marginTop: spacing.sm,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20', // 20% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
});

export default CommandsList;
