import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, SafeAreaView } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { colors, typography, layout, spacing, buttons } from '../styles/globalStyles';
import { executeAction } from '../utils/phoneControl';

export default function HomeScreen() {
  const { 
    gestureMode, 
    voiceMode, 
    gesturesConfigured, 
    voiceEnrolled, 
    darkMode,
    lastCommand,
    toggleGestureMode, 
    toggleVoiceMode
  } = useAppContext();
  
  const [commandHistory, setCommandHistory] = useState([]);
  
  // Update command history when a new command is detected
  useEffect(() => {
    if (lastCommand) {
      const newCommand = {
        command: lastCommand,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setCommandHistory(prev => [newCommand, ...prev].slice(0, 10));
    }
  }, [lastCommand]);
  
  // Get theme colors based on dark mode
  const getThemeColor = (lightColor, darkColor) => {
    return darkMode ? darkColor : lightColor;
  };
  
  return (
    <SafeAreaView style={[
      layout.container, 
      { backgroundColor: getThemeColor(colors.background, colors.backgroundDark) }
    ]}>
      <ScrollView>
        <Text style={[
          typography.h1, 
          { color: getThemeColor(colors.text, colors.textDark) }
        ]}>
          Gesture & Voice Control
        </Text>
        
        {/* Control Panel */}
        <View style={styles.controlPanel}>
          <View style={styles.controlRow}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              Gesture Control
            </Text>
            <Switch
              value={gestureMode}
              onValueChange={toggleGestureMode}
              disabled={!gesturesConfigured}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={gestureMode ? colors.secondary : '#f4f3f4'}
            />
          </View>
          
          {!gesturesConfigured && (
            <Text style={styles.warningText}>
              Gestures not configured. Visit the Training screen.
            </Text>
          )}
          
          <View style={styles.controlRow}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              Voice Control
            </Text>
            <Switch
              value={voiceMode}
              onValueChange={toggleVoiceMode}
              disabled={!voiceEnrolled}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={voiceMode ? colors.secondary : '#f4f3f4'}
            />
          </View>
          
          {!voiceEnrolled && (
            <Text style={styles.warningText}>
              Voice not enrolled. Visit the Voice Enrollment screen.
            </Text>
          )}
        </View>
        
        {/* Status Panel */}
        <View style={[
          styles.statusPanel, 
          { backgroundColor: getThemeColor(colors.card, colors.cardDark) }
        ]}>
          <Text style={[
            typography.h3, 
            { color: getThemeColor(colors.text, colors.textDark) }
          ]}>
            Status
          </Text>
          
          <View style={styles.statusRow}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              Gesture Control:
            </Text>
            <Text style={[
              typography.body, 
              { 
                color: gestureMode 
                  ? colors.success 
                  : getThemeColor(colors.textLight, colors.textLightDark) 
              }
            ]}>
              {gestureMode ? 'Active' : 'Inactive'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              Voice Control:
            </Text>
            <Text style={[
              typography.body, 
              { 
                color: voiceMode 
                  ? colors.success 
                  : getThemeColor(colors.textLight, colors.textLightDark) 
              }
            ]}>
              {voiceMode ? 'Active' : 'Inactive'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              Gestures Configured:
            </Text>
            <Text style={[
              typography.body, 
              { 
                color: gesturesConfigured 
                  ? colors.success 
                  : colors.error 
              }
            ]}>
              {gesturesConfigured ? 'Yes' : 'No'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              Voice Enrolled:
            </Text>
            <Text style={[
              typography.body, 
              { 
                color: voiceEnrolled 
                  ? colors.success 
                  : colors.error 
              }
            ]}>
              {voiceEnrolled ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
        
        {/* Command History */}
        <View style={[
          styles.historyPanel, 
          { backgroundColor: getThemeColor(colors.card, colors.cardDark) }
        ]}>
          <Text style={[
            typography.h3, 
            { color: getThemeColor(colors.text, colors.textDark) }
          ]}>
            Recent Commands
          </Text>
          
          {commandHistory.length === 0 ? (
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.textLight, colors.textLightDark) }
            ]}>
              No commands executed yet
            </Text>
          ) : (
            commandHistory.map((item, index) => (
              <View key={index} style={styles.commandRow}>
                <Text style={[
                  typography.body, 
                  { color: getThemeColor(colors.text, colors.textDark) }
                ]}>
                  {item.command}
                </Text>
                <Text style={[
                  typography.bodySmall, 
                  { color: getThemeColor(colors.textLight, colors.textLightDark) }
                ]}>
                  {item.timestamp}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  controlPanel: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  warningText: {
    color: colors.warning,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  statusPanel: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  historyPanel: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  commandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
