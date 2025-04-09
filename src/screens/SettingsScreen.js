import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView, SafeAreaView } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { colors, typography, layout, spacing, buttons } from '../styles/globalStyles';

export default function SettingsScreen() {
  const { 
    darkMode, 
    toggleDarkMode,
    clearAllGestures,
    clearVoiceEnrollment,
    markGesturesConfigured,
    markVoiceEnrolled
  } = useAppContext();
  
  // Get theme colors based on dark mode
  const getThemeColor = (lightColor, darkColor) => {
    return darkMode ? darkColor : lightColor;
  };
  
  const handleClearAll = () => {
    Alert.alert(
      'Reset App Data',
      'Are you sure you want to clear all app data? This will delete all gestures, voice enrollments, and settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset All', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear gestures
              await clearAllGestures();
              markGesturesConfigured(false);
              
              // Clear voice enrollment
              await clearVoiceEnrollment();
              markVoiceEnrolled(false);
              
              Alert.alert('Success', 'All app data has been reset');
            } catch (error) {
              console.error('Error resetting app data:', error);
              Alert.alert('Error', 'Failed to reset app data');
            }
          }
        }
      ]
    );
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
          Settings
        </Text>
        
        <View style={[
          styles.settingsPanel, 
          { backgroundColor: getThemeColor(colors.card, colors.cardDark) }
        ]}>
          <Text style={[
            typography.h3, 
            { color: getThemeColor(colors.text, colors.textDark) }
          ]}>
            Appearance
          </Text>
          
          <View style={styles.settingRow}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              Dark Mode
            </Text>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={darkMode ? colors.secondary : '#f4f3f4'}
            />
          </View>
        </View>
        
        <View style={[
          styles.settingsPanel, 
          { backgroundColor: getThemeColor(colors.card, colors.cardDark) }
        ]}>
          <Text style={[
            typography.h3, 
            { color: getThemeColor(colors.text, colors.textDark) }
          ]}>
            Accessibility
          </Text>
          
          <View style={styles.settingRow}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              Text Size
            </Text>
            <View style={styles.textSizeButtons}>
              <TouchableOpacity style={styles.textSizeButton}>
                <Text style={styles.textSizeButtonText}>A-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.textSizeButton}>
                <Text style={styles.textSizeButtonText}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              High Contrast
            </Text>
            <Switch
              value={false}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>
        </View>
        
        <View style={[
          styles.settingsPanel, 
          { backgroundColor: getThemeColor(colors.card, colors.cardDark) }
        ]}>
          <Text style={[
            typography.h3, 
            { color: getThemeColor(colors.text, colors.textDark) }
          ]}>
            About
          </Text>
          
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.text, colors.textDark) }
            ]}>
              Version
            </Text>
            <Text style={[
              typography.body, 
              { color: getThemeColor(colors.textLight, colors.textLightDark) }
            ]}>
              1.0.0
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.settingsPanel, 
          { backgroundColor: getThemeColor(colors.card, colors.cardDark) }
        ]}>
          <Text style={[
            typography.h3, 
            { color: getThemeColor(colors.text, colors.textDark) }
          ]}>
            Data Management
          </Text>
          
          <TouchableOpacity
            style={[
              buttons.outline,
              { 
                marginTop: spacing.md,
                borderColor: colors.error
              }
            ]}
            onPress={handleClearAll}
          >
            <Text style={[buttons.outlineText, { color: colors.error }]}>
              Reset App Data
            </Text>
          </TouchableOpacity>
          
          <Text style={[
            typography.caption, 
            { 
              color: getThemeColor(colors.textLight, colors.textLightDark),
              marginTop: spacing.sm 
            }
          ]}>
            This will delete all gestures, voice enrollments, and reset all settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  settingsPanel: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  textSizeButtons: {
    flexDirection: 'row',
  },
  textSizeButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  textSizeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
