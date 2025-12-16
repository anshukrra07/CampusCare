// services/emotionService.js - Unified emotion analysis
const { genTextFromGemini, findMatchingKeywords } = require('../utils/helpers');
const { PROMPTS } = require('../config/prompts');
const { 
  RISK_KEYWORDS, 
  EMOTION_MAPPING, 
  VALID_EMOTIONS 
} = require('../config/constants');

/**
 * Unified emotion analysis for both text and voice
 */
async function analyzeEmotion(message, type = 'text') {
  const prompt = PROMPTS.EMOTION_ANALYSIS(message);
  let emotionData = { emotion: "neutral", intensity: 0, notes: "" };
  let emotionModel = "keyword-fallback";
  
  try {
    const emoResult = await genTextFromGemini(prompt, 2);
    emotionModel = emoResult.model;
    
    try {
      const parsed = JSON.parse(emoResult.text);
      
      // Normalize emotion labels using mapping
      const rawEmotion = (parsed.emotion || '').toLowerCase();
      const normalizedEmotion = EMOTION_MAPPING[rawEmotion] || rawEmotion;
      
      emotionData = {
        emotion: VALID_EMOTIONS.includes(normalizedEmotion) ? normalizedEmotion : 'neutral',
        intensity: Math.max(0, Math.min(100, Number(parsed.intensity ?? 50))),
        notes: parsed.notes || ''
      };
      
      // Boost intensity for strong positive language
      const positiveBoost = /(very|so|extremely)\s+(happy|glad|excited|good|great)/i.test(message);
      if (emotionData.emotion === 'happy' && positiveBoost && emotionData.intensity < 70) {
        emotionData.intensity = 80;
        emotionData.notes = emotionData.notes || 'strong positive language detected';
      }
      
    } catch (parseErr) {
      console.warn('JSON parse error in emotion analysis, using keyword fallback:', parseErr);
      emotionData = getKeywordBasedEmotion(message);
    }
    
  } catch (err) {
    console.warn('AI emotion analysis failed, using keyword fallback:', err);
    emotionData = getKeywordBasedEmotion(message);
    emotionModel = getEmotionModelFromKeywords(message);
  }
  
  return { emotionData, emotionModel };
}

/**
 * Keyword-based emotion detection fallback
 */
function getKeywordBasedEmotion(message) {
  const messageLower = message.toLowerCase();
  
  // Check for crisis keywords first
  const crisisKeywords = findMatchingKeywords(message, RISK_KEYWORDS);
  if (crisisKeywords.length > 0) {
    return { 
      emotion: 'suicidal', 
      intensity: 95, 
      notes: `Crisis keywords detected: ${crisisKeywords.join(', ')}` 
    };
  }
  
  // Strong positive detection
  if (/\b(very|so|extremely)\s+(happy|glad|excited|good|great)/i.test(messageLower)) {
    return { 
      emotion: 'happy', 
      intensity: 85, 
      notes: 'strong positive keywords' 
    };
  }
  
  // Regular positive detection
  if (/\b(happy|glad|excited|great|amazing|wonderful|fantastic|awesome|love|enjoy)/i.test(messageLower)) {
    return { 
      emotion: 'happy', 
      intensity: 70, 
      notes: 'positive keywords' 
    };
  }
  
  // Negative emotion detection
  if (/\b(sad|depressed|down|awful|terrible|horrible|hate|upset|crying)/i.test(messageLower)) {
    return { 
      emotion: 'sad', 
      intensity: 70, 
      notes: 'negative keywords' 
    };
  }
  
  // Anxiety detection
  if (/\b(anxious|worried|nervous|scared|afraid|panic)/i.test(messageLower)) {
    return { 
      emotion: 'anxious', 
      intensity: 65, 
      notes: 'anxiety keywords' 
    };
  }
  
  // Anger detection
  if (/\b(angry|mad|furious|irritated|annoyed|frustrated)/i.test(messageLower)) {
    return { 
      emotion: 'angry', 
      intensity: 65, 
      notes: 'anger keywords' 
    };
  }
  
  // Default neutral
  return { 
    emotion: 'neutral', 
    intensity: 30, 
    notes: 'no clear emotional indicators' 
  };
}

/**
 * Determine emotion model type based on keywords
 */
function getEmotionModelFromKeywords(message) {
  const crisisKeywords = findMatchingKeywords(message, RISK_KEYWORDS);
  if (crisisKeywords.length > 0) {
    return "crisis-keyword-fallback";
  }
  
  if (/\b(very|so|extremely)\s+(happy|glad|excited|good|great)/i.test(message)) {
    return "positive-keyword-fallback";
  }
  
  if (/\b(happy|glad|excited|great|amazing|wonderful|fantastic|awesome|love|enjoy)/i.test(message)) {
    return "positive-keyword-fallback";
  }
  
  if (/\b(sad|depressed|down|awful|terrible|horrible|hate|upset|crying)/i.test(message)) {
    return "negative-keyword-fallback";
  }
  
  return "error-fallback";
}

/**
 * Quick emotion classification for immediate crisis detection
 */
function quickEmotionCheck(message) {
  const crisisKeywords = findMatchingKeywords(message, RISK_KEYWORDS);
  return {
    hasCrisisKeywords: crisisKeywords.length > 0,
    matchedKeywords: crisisKeywords,
    estimatedIntensity: crisisKeywords.length > 0 ? 95 : 30
  };
}

module.exports = {
  analyzeEmotion,
  getKeywordBasedEmotion,
  quickEmotionCheck
};