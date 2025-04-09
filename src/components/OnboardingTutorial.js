import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Dimensions, 
  SafeAreaView 
} from 'react-native';
import { colors, typography, layout, spacing, buttons } from '../styles/globalStyles';
import { useAppContext } from '../context/AppContext';
import GestureVisualizer from './GestureVisualizer';

const { width } = Dimensions.get('window');

const OnboardingTutorial = () => {
  const { darkMode, completeFirstTimeSetup } = useAppContext();
  const [currentPage, setCurrentPage] = useState(0);
  
  // Get theme colors based on dark mode
  const getThemeColor = (lightColor, darkColor) => {
    return darkMode ? darkColor : lightColor;
  };
  
  // Onboarding content
  const pages = [
    {
      title: 'Welcome to Gesture & Voice Control',
      description: 'Control your phone with simple gestures and voice commands. Perfect for accessibility or hands-free operation.',
      content: () => (
        <View style={styles.illustrationContainer}>
          <View style={styles.featureIconsContainer}>
            <GestureVisualizer gesture="palm" size={80} />
            <View style={styles.iconSpacer} />
            <GestureVisualizer gesture="swipe_right" size={80} />
          </View>
        </View>
      ),
    },
    {
      title: 'Gesture Training',
      description: 'Train custom gestures that your device will recognize. Go to the Gestures tab to train and customize your hand gestures.',
      content: () => (
        <View style={styles.illustrationContainer}>
          <View style={styles.trainingStepsContainer}>
            <View style={styles.trainingStep}>
              <View style={[
                styles.trainingStepIcon,
                { backgroundColor: colors.primary + '30' }
              ]}>
                <Text style={styles.trainingStepNumber}>1</Text>
              </View>
              <Text style={[
                typography.bodySmall,
                { color: getThemeColor(colors.text, colors.textDark) }
              ]}>
                Select gesture
              </Text>
            </View>
            
            <View style={styles.stepArrow}>
              <Text style={{ color: colors.primary }}>→</Text>
            </View>
            
            <View style={styles.trainingStep}>
              <View style={[
                styles.trainingStepIcon,
                { backgroundColor: colors.primary + '30' }
              ]}>
                <Text style={styles.trainingStepNumber}>2</Text>
              </View>
              <Text style={[
                typography.bodySmall,
                { color: getThemeColor(colors.text, colors.textDark) }
              ]}>
                Record samples
              </Text>
            </View>
            
            <View style={styles.stepArrow}>
              <Text style={{ color: colors.primary }}>→</Text>
            </View>
            
            <View style={styles.trainingStep}>
              <View style={[
                styles.trainingStepIcon,
                { backgroundColor: colors.primary + '30' }
              ]}>
                <Text style={styles.trainingStepNumber}>3</Text>
              </View>
              <Text style={[
                typography.bodySmall,
                { color: getThemeColor(colors.text, colors.textDark) }
              ]}>
                Use gestures
              </Text>
            </View>
          </View>
          
          <View style={styles.gesturesPreview}>
            <GestureVisualizer gesture="thumbs_up" size={60} />
            <GestureVisualizer gesture="swipe_left" size={60} />
            <GestureVisualizer gesture="palm" size={60} />
          </View>
        </View>
      ),
    },
    {
      title: 'Voice Authentication',
      description: 'Enroll your voice to enable secure voice commands. Your voice profile ensures only you can control your device.',
      content: () => (
        <View style={styles.illustrationContainer}>
          <View style={styles.voiceEnrollmentContainer}>
            <View style={styles.microphoneIcon}>
              <View style={styles.microphoneOuter}>
                <View style={styles.microphoneInner} />
              </View>
              <View style={styles.microphoneStand} />
              <View style={styles.microphoneBase} />
            </View>
            
            <View style={styles.voiceWaves}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View 
                  key={i}
                  style={[
                    styles.voiceWave,
                    { 
                      height: 4 + (i * 4),
                      opacity: 1 - (i * 0.15)
                    }
                  ]}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.enrollmentSteps}>
            <Text style={[
              typography.body,
              { 
                color: getThemeColor(colors.text, colors.textDark),
                textAlign: 'center',
                marginBottom: spacing.sm
              }
            ]}>
              Speak these phrases to enroll:
            </Text>
            
            <View style={[
              styles.phraseBox,
              { backgroundColor: getThemeColor(colors.background, colors.backgroundDark) }
            ]}>
              <Text style={styles.phraseText}>
                "My voice is my password"
              </Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      title: 'Let\'s Get Started!',
      description: 'You can now train gestures and enroll your voice. Navigate using the tabs at the bottom of the screen.',
      content: () => (
        <View style={styles.illustrationContainer}>
          <View style={styles.tabsPreview}>
            <View style={styles.tabBar}>
              <View style={[styles.tab, styles.activeTab]}>
                <Text style={styles.activeTabText}>Home</Text>
              </View>
              <View style={styles.tab}>
                <Text style={styles.tabText}>Gestures</Text>
              </View>
              <View style={styles.tab}>
                <Text style={styles.tabText}>Voice</Text>
              </View>
              <View style={styles.tab}>
                <Text style={styles.tabText}>Settings</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.startContainer}>
            <TouchableOpacity
              style={buttons.primary}
              onPress={completeFirstTimeSetup}
            >
              <Text style={buttons.buttonText}>
                Get Started
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ),
    },
  ];
  
  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      completeFirstTimeSetup();
    }
  };
  
  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleSkip = () => {
    completeFirstTimeSetup();
  };
  
  const CurrentPage = pages[currentPage];
  
  return (
    <SafeAreaView style={[
      layout.container,
      { backgroundColor: getThemeColor(colors.background, colors.backgroundDark) }
    ]}>
      <View style={styles.container}>
        <View style={styles.header}>
          {currentPage > 0 ? (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <Text style={[
                typography.body,
                { color: colors.primary }
              ]}>
                Back
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButton} />
          )}
          
          <TouchableOpacity onPress={handleSkip} style={styles.headerButton}>
            <Text style={[
              typography.body,
              { color: colors.primary }
            ]}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={[
            typography.h1,
            { 
              color: getThemeColor(colors.text, colors.textDark),
              textAlign: 'center',
              marginBottom: spacing.sm
            }
          ]}>
            {CurrentPage.title}
          </Text>
          
          <Text style={[
            typography.body,
            { 
              color: getThemeColor(colors.textLight, colors.textLightDark),
              textAlign: 'center',
              marginBottom: spacing.xl
            }
          ]}>
            {CurrentPage.description}
          </Text>
          
          <CurrentPage.content />
        </View>
        
        <View style={styles.footer}>
          <View style={styles.dots}>
            {pages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentPage 
                      ? colors.primary 
                      : getThemeColor('#ccc', '#444'),
                  },
                ]}
              />
            ))}
          </View>
          
          <TouchableOpacity
            style={[buttons.primary, { paddingHorizontal: spacing.xl }]}
            onPress={handleNext}
          >
            <Text style={buttons.buttonText}>
              {currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  featureIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconSpacer: {
    width: spacing.xl,
  },
  trainingStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  trainingStep: {
    alignItems: 'center',
  },
  trainingStepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  trainingStepNumber: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  stepArrow: {
    marginHorizontal: spacing.sm,
  },
  gesturesPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.md,
  },
  voiceEnrollmentContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  microphoneIcon: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  microphoneOuter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  microphoneInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary + '50',
  },
  microphoneStand: {
    width: 6,
    height: 30,
    backgroundColor: colors.primary,
    marginTop: -5,
  },
  microphoneBase: {
    width: 40,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  voiceWaves: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 30,
    marginTop: spacing.md,
  },
  voiceWave: {
    width: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 3,
    borderRadius: 2,
  },
  enrollmentSteps: {
    width: '100%',
    padding: spacing.md,
  },
  phraseBox: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  phraseText: {
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabsPreview: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '20',
    borderRadius: 25,
    padding: 5,
    width: '90%',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  tabText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  startContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});

export default OnboardingTutorial;
