/**
 * AI Enhancement Utilities for Voice and Gesture Recognition
 * 
 * Uses OpenAI's GPT models to improve recognition accuracy and provide
 * more natural language understanding capabilities.
 */

import OpenAI from 'openai';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize OpenAI client
let openai = null;

// Maximum number of context examples to store
const MAX_CONTEXT_EXAMPLES = 10;

// Local storage keys
const STORAGE_KEY_CONTEXT = 'aiContext';
const STORAGE_KEY_CORRECTIONS = 'aiCorrections';

// Setup the OpenAI client
export const initAI = async () => {
  try {
    // Check if API key is available in environment or storage
    let apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      apiKey = await AsyncStorage.getItem('OPENAI_API_KEY');
    }
    
    if (!apiKey) {
      console.warn('OpenAI API key not found. AI enhancements will be disabled.');
      return false;
    }
    
    // Initialize client
    openai = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true // For client-side use (consider server-side for production)
    });
    
    console.log('OpenAI client initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    return false;
  }
};

// Check if AI enhancement is available
export const isAIAvailable = () => {
  return !!openai;
};

// Load context examples from storage
export const loadContext = async () => {
  try {
    const contextData = await AsyncStorage.getItem(STORAGE_KEY_CONTEXT);
    return contextData ? JSON.parse(contextData) : [];
  } catch (error) {
    console.error('Error loading AI context:', error);
    return [];
  }
};

// Save context examples to storage
export const saveContext = async (context) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_CONTEXT, JSON.stringify(context));
    return true;
  } catch (error) {
    console.error('Error saving AI context:', error);
    return false;
  }
};

// Add a new example to the context
export const addContextExample = async (original, corrected) => {
  try {
    // Load existing context
    const context = await loadContext();
    
    // Add new example
    context.push({
      original,
      corrected,
      timestamp: Date.now()
    });
    
    // Keep only the most recent examples
    const updatedContext = context.slice(-MAX_CONTEXT_EXAMPLES);
    
    // Save updated context
    await saveContext(updatedContext);
    
    return true;
  } catch (error) {
    console.error('Error adding context example:', error);
    return false;
  }
};

/**
 * Improve transcription accuracy using GPT
 * 
 * Uses the GPT model to correct speech recognition errors,
 * understand context, and improve the accuracy of transcribed text.
 */
export const improveTranscription = async (text, options = {}) => {
  if (!openai) {
    if (!await initAI()) {
      return { improved: false, text };
    }
  }
  
  try {
    // Default options
    const settings = {
      context: options.context || 'general',
      confidenceThreshold: options.confidenceThreshold || 0.7,
      includeAlternatives: options.includeAlternatives || false,
      alternatives: options.alternatives || [],
      userAction: options.userAction || null
    };
    
    // Load context examples
    const contextExamples = await loadContext();
    
    // Build prompt
    let prompt = 'Correct and improve the following speech recognition transcript, fixing any errors and making it more accurate. ';
    
    if (settings.context !== 'general') {
      prompt += `The context is: ${settings.context}. `;
    }
    
    // Add user action context if available
    if (settings.userAction) {
      prompt += `The user is currently ${settings.userAction}. `;
    }
    
    // Add examples from context if available
    if (contextExamples.length > 0) {
      prompt += 'Here are some examples of previous corrections: \n\n';
      
      for (const example of contextExamples.slice(-3)) {
        prompt += `Original: "${example.original}"\n`;
        prompt += `Corrected: "${example.corrected}"\n\n`;
      }
    }
    
    // Add alternatives if available
    if (settings.includeAlternatives && settings.alternatives.length > 0) {
      prompt += 'Alternative interpretations from the speech recognizer: \n';
      
      for (const alt of settings.alternatives) {
        prompt += `- "${alt.transcript}" (confidence: ${alt.confidence.toFixed(2)})\n`;
      }
      prompt += '\n';
    }
    
    // Add the text to correct
    prompt += `Original transcript: "${text}"`;
    
    // Call OpenAI API
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert speech recognition correction system. Your job is to fix transcription errors and improve the accuracy of voice commands. Return only the corrected text with no explanation or additional content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    });
    
    // Extract corrected text
    const correctedText = response.choices[0].message.content.trim();
    
    // Save this correction for future context if it's different
    if (correctedText !== text) {
      await addContextExample(text, correctedText);
    }
    
    return {
      improved: true,
      original: text,
      text: correctedText,
      confidence: settings.confidenceThreshold
    };
  } catch (error) {
    console.error('Error improving transcription with AI:', error);
    return { improved: false, text };
  }
};

/**
 * Process ambiguous gestures using AI
 * 
 * When gesture recognition is uncertain between multiple possible
 * gestures, use AI to determine the most likely intended gesture
 * based on user context and behavior patterns.
 */
export const processAmbiguousGesture = async (
  candidates,
  userContext = {}
) => {
  if (!openai) {
    if (!await initAI()) {
      // Return the highest confidence candidate as fallback
      return candidates.sort((a, b) => b.confidence - a.confidence)[0];
    }
  }
  
  try {
    // Prepare context information
    const contextInfo = {
      screen: userContext.currentScreen || 'unknown',
      recentActions: userContext.recentActions || [],
      time: new Date().toISOString(),
      handPosition: userContext.handPosition || {},
      ...userContext
    };
    
    // Build prompt
    const prompt = `
      I'm trying to determine which gesture the user most likely intended to perform.
      The system detected multiple possible gestures with the following confidence scores:
      
      ${candidates.map(c => `- ${c.name}: ${(c.confidence * 100).toFixed(1)}% confidence`).join('\n')}
      
      Current user context:
      - Current screen: ${contextInfo.screen}
      - Recent actions: ${contextInfo.recentActions.join(', ')}
      - Hand position: ${JSON.stringify(contextInfo.handPosition)}
      
      Based on this information, which gesture was most likely intended?
      Respond with a JSON object in this exact format: { "gesture": "gesture_name", "confidence": 0.95, "explanation": "brief explanation" }
    `;
    
    // Call OpenAI API
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in gesture recognition and human-computer interaction. Your task is to analyze ambiguous gesture data and determine the most likely intended gesture based on context."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 150,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const result = JSON.parse(response.choices[0].message.content);
    
    // Find the matching candidate
    const matchedCandidate = candidates.find(c => 
      c.name.toLowerCase() === result.gesture.toLowerCase()
    );
    
    if (matchedCandidate) {
      // Return the candidate with AI-updated confidence
      return {
        ...matchedCandidate,
        confidence: result.confidence,
        aiEnhanced: true,
        explanation: result.explanation
      };
    } else {
      // Return the highest confidence candidate as fallback
      return candidates.sort((a, b) => b.confidence - a.confidence)[0];
    }
  } catch (error) {
    console.error('Error processing ambiguous gesture:', error);
    // Return the highest confidence candidate as fallback
    return candidates.sort((a, b) => b.confidence - a.confidence)[0];
  }
};

/**
 * Generate custom gesture suggestions based on user behavior
 * 
 * Analyzes user activity and suggests custom gestures that 
 * would improve their experience.
 */
export const suggestCustomGestures = async (userActivity) => {
  if (!openai) {
    if (!await initAI()) {
      return [];
    }
  }
  
  try {
    // Format user activity data
    const activityData = JSON.stringify(userActivity, null, 2);
    
    // Build prompt
    const prompt = `
      Based on the following user activity data, suggest 3 custom gestures that would improve the user experience.
      For each suggestion, explain how the gesture should work and what action it should trigger.
      
      User activity data:
      ${activityData}
      
      Respond with a JSON array in this format: 
      [
        {
          "gestureName": "name of gesture", 
          "gestureDescription": "description of hand movements",
          "action": "action to trigger",
          "benefit": "how this benefits the user"
        },
        ...
      ]
    `;
    
    // Call OpenAI API
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in gesture design and human-computer interaction. Your job is to suggest custom gestures that would improve the user experience based on their usage patterns."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const suggestions = JSON.parse(response.choices[0].message.content);
    
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    console.error('Error generating gesture suggestions:', error);
    return [];
  }
};

/**
 * Analyze voice patterns for authentication enhancements
 * 
 * Process voice authentication results to detect potential issues
 * and suggest improvements to the voice authentication system.
 */
export const analyzeVoiceAuthentication = async (authResults) => {
  if (!openai) {
    if (!await initAI()) {
      return null;
    }
  }
  
  try {
    // Format authentication data
    const authData = JSON.stringify(authResults, null, 2);
    
    // Build prompt
    const prompt = `
      Analyze the following voice authentication results and provide insights on:
      1. Potential security vulnerabilities
      2. False positive/negative rates
      3. Suggestions for improving accuracy
      
      Authentication results:
      ${authData}
      
      Respond with a detailed analysis in JSON format.
    `;
    
    // Call OpenAI API
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in biometric security and voice authentication. Your job is to analyze voice authentication data and provide insights for improvement."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const analysis = JSON.parse(response.choices[0].message.content);
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing voice authentication:', error);
    return null;
  }
};

/**
 * Get contextual help for voice and gesture commands
 * 
 * Uses AI to generate contextual help messages based on
 * user's current activity and past issues.
 */
export const getContextualHelp = async (context) => {
  if (!openai) {
    if (!await initAI()) {
      return {
        title: "Help is unavailable",
        tips: ["OpenAI integration is not configured."]
      };
    }
  }
  
  try {
    // Format context data
    const contextData = JSON.stringify(context, null, 2);
    
    // Build prompt
    const prompt = `
      Based on the user's current context, provide helpful tips for using voice and gesture controls.
      Focus on the most relevant commands for their current activity.
      
      User context:
      ${contextData}
      
      Respond with a JSON object containing a title and an array of 3-5 concise, practical tips.
    `;
    
    // Call OpenAI API
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant specializing in gesture and voice control systems. Your job is to provide concise, practical tips to help users get the most out of the system."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 300,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const help = JSON.parse(response.choices[0].message.content);
    
    return help;
  } catch (error) {
    console.error('Error getting contextual help:', error);
    return {
      title: "Help Tips",
      tips: [
        "Speak clearly and directly to improve voice recognition",
        "Hold gestures steady for better detection",
        "Try repositioning your hand if gestures aren't being recognized"
      ]
    };
  }
};