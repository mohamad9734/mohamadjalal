const express = require('express');
const path = require('path');
const OpenAI = require('openai');
const bodyParser = require('body-parser');

const app = express();

// Initialize OpenAI client if API key exists
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('OpenAI API client initialized successfully');
} else {
  console.log('OPENAI_API_KEY not found. AI enhancement features will be disabled.');
}

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Check if OpenAI integration is available
app.get('/api/ai/status', (req, res) => {
  res.json({
    available: !!openai,
    features: {
      voiceEnhancement: !!openai,
      gestureEnhancement: !!openai,
      contextualHelp: !!openai
    }
  });
});

// Enhance voice transcription with GPT
app.post('/api/ai/enhance-transcription', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI API not available. Please add OPENAI_API_KEY to environment variables.',
        original: req.body.text
      });
    }

    const { text, context, alternatives } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
        original: text
      });
    }
    
    // Build prompt
    let prompt = 'Correct and improve the following speech recognition transcript, fixing any errors and making it more accurate. ';
    
    if (context && context !== 'general') {
      prompt += `The context is: ${context}. `;
    }
    
    // Add alternatives if available
    if (alternatives && alternatives.length > 0) {
      prompt += 'Alternative interpretations from the speech recognizer: \n';
      
      for (const alt of alternatives) {
        prompt += `- "${alt.transcript}" (confidence: ${alt.confidence?.toFixed(2) || 'unknown'})\n`;
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
    
    res.json({
      success: true,
      original: text,
      text: correctedText,
      model: "gpt-4o"
    });
  } catch (error) {
    console.error('Error enhancing transcription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      original: req.body.text
    });
  }
});

// Process ambiguous gestures with AI
app.post('/api/ai/process-gesture', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI API not available',
        gesture: req.body.candidates[0]
      });
    }
    
    const { candidates, context } = req.body;
    
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Candidates array is required'
      });
    }
    
    // For single candidate with high confidence, just return it
    if (candidates.length === 1 || candidates[0].confidence > 0.9) {
      return res.json({
        success: true,
        gesture: candidates[0],
        method: 'direct'
      });
    }
    
    // Prepare context information
    const contextInfo = {
      screen: context?.currentScreen || 'unknown',
      recentActions: context?.recentActions || [],
      time: new Date().toISOString(),
      handPosition: context?.handPosition || {},
      ...context
    };
    
    // Build prompt
    const prompt = `
      I'm trying to determine which gesture the user most likely intended to perform.
      The system detected multiple possible gestures with the following confidence scores:
      
      ${candidates.map(c => `- ${c.name}: ${(c.confidence * 100).toFixed(1)}% confidence`).join('\n')}
      
      Current user context:
      - Current screen: ${contextInfo.screen}
      - Recent actions: ${contextInfo.recentActions.join(', ')}
      ${contextInfo.handPosition ? `- Hand position: ${JSON.stringify(contextInfo.handPosition)}` : ''}
      
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
      res.json({
        success: true,
        gesture: {
          ...matchedCandidate,
          confidence: result.confidence,
          aiEnhanced: true,
          explanation: result.explanation
        },
        method: 'ai'
      });
    } else {
      // Return the highest confidence candidate as fallback
      res.json({
        success: true,
        gesture: candidates.sort((a, b) => b.confidence - a.confidence)[0],
        method: 'fallback'
      });
    }
  } catch (error) {
    console.error('Error processing gesture:', error);
    // Return the highest confidence candidate as fallback
    res.json({
      success: true,
      gesture: req.body.candidates.sort((a, b) => b.confidence - a.confidence)[0],
      method: 'error_fallback',
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
