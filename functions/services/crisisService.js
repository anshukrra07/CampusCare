// services/crisisService.js - Unified crisis detection and response
const { genTextFromGemini, generateFallbackCrisisResponse } = require('../utils/helpers');
const { PROMPTS } = require('../config/prompts');
const { 
  RISK_KEYWORDS, 
  CRISIS_EMOTIONS, 
  RISK_LABELS,
  CRISIS_THRESHOLDS 
} = require('../config/constants');

/**
 * Unified crisis detection for both text and voice
 */
async function detectCrisis(message, emotionData, type = 'text') {
  console.log(`🔍 Starting crisis detection for ${type}...`);
  
  // 1. AI-powered moderation
  const riskLevel = await performModeration(message);
  
  // 2. Crisis condition analysis
  const crisisAnalysis = analyzeCrisisConditions(riskLevel, emotionData);
  
  console.log(`Crisis analysis result:`, crisisAnalysis);
  
  return {
    ...crisisAnalysis,
    riskLevel,
    type
  };
}

/**
 * AI-powered content moderation
 */
async function performModeration(message) {
  try {
    const moderationPrompt = PROMPTS.MODERATION(message);
    const moderationResult = await genTextFromGemini(moderationPrompt, 2);

    let riskLevel = moderationResult?.text?.toLowerCase().trim() || "safe";
    if (!["high", "safe"].includes(riskLevel)) {
      riskLevel = "safe";
    }
    
    console.log(`🔍 AI moderation result: ${riskLevel}`);
    return riskLevel;
    
  } catch (err) {
    console.error("⚠️ AI moderation failed:", err);
    
    // Fallback to keyword-based detection
    const keywordRisk = detectKeywordRisk(message);
    console.log(`🔍 Keyword fallback result: ${keywordRisk ? 'high' : 'safe'}`);
    
    return keywordRisk ? "high" : "safe";
  }
}

/**
 * Keyword-based crisis detection fallback with context awareness
 */
function detectKeywordRisk(message) {
  const messageLower = message.toLowerCase();
  
  // Check for positive context indicators first
  const positiveIndicators = [
    "want to be here",
    "looking forward",
    "excited about", 
    "planning to",
    "hope to",
    "can't wait",
    "tomorrow will be",
    "next week",
    "next month",
    "in the future",
    "after this",
    "getting better",
    "improving",
    "working on"
  ];
  
  // If message contains positive future-oriented language, it's likely safe
  const hasPositiveContext = positiveIndicators.some(indicator => 
    messageLower.includes(indicator)
  );
  
  if (hasPositiveContext) {
    console.log(`✅ POSITIVE CONTEXT DETECTED - likely safe: "${message}"`);
    return false;
  }
  
  // Check for high-risk patterns (more specific than individual words)
  const highRiskPatterns = [
    "kill myself",
    "want to die",
    "going to die", 
    "end my life",
    "end it all",
    "harm myself",
    "hurt myself",
    "no point living",
    "no point in living",
    "better off dead",
    "can't go on",
    "don't want to live",
    "tired of living",
    "want it to end",
    "nothing to live for",
    "suicide",
    "suicidal"
  ];
  
  const matchedPattern = highRiskPatterns.find(pattern => 
    messageLower.includes(pattern)
  );
  
  if (matchedPattern) {
    console.log(`🚨 CRISIS PATTERN DETECTED: "${matchedPattern}" in message: "${message}"`);
    return true;
  }
  
  return false;
}

/**
 * Analyze various crisis conditions
 */
function analyzeCrisisConditions(riskLevel, emotionData) {
  const isHighRiskKeyword = riskLevel === "high";
  const isCrisisEmotion = emotionData.emotion && 
    CRISIS_EMOTIONS.includes(emotionData.emotion.toLowerCase());
  const isHighIntensityEmotion = emotionData.intensity >= CRISIS_THRESHOLDS.EMOTION_INTENSITY;
  const isExtremeIntensity = emotionData.intensity >= CRISIS_THRESHOLDS.EXTREME_INTENSITY;
  
  // Crisis trigger conditions:
  // 1. AI flagged as high-risk
  // 2. Crisis emotion with high intensity (>= 80)
  // 3. Any emotion with extremely high intensity (>= 95)
  const shouldTriggerCrisis = isHighRiskKeyword || 
                             (isCrisisEmotion && isHighIntensityEmotion) ||
                             isExtremeIntensity;

  return {
    shouldTriggerCrisis,
    triggers: {
      aiModeration: isHighRiskKeyword,
      crisisEmotion: isCrisisEmotion && isHighIntensityEmotion,
      extremeIntensity: isExtremeIntensity
    },
    severity: shouldTriggerCrisis ? 'high' : 'safe'
  };
}

/**
 * Generate AI-powered crisis response
 */
async function generateCrisisResponse(message, type = 'text') {
  try {
    const crisisPrompt = type === 'voice' 
      ? `You are a crisis counselor responding to someone in distress via voice message. The person said: "${message}"

Provide a comprehensive, compassionate crisis response that:
1. Opens with warmth and acknowledgment of their courage to reach out
2. Validates their pain without judgment - acknowledge how much they're hurting
3. Provide specific crisis resources:
   - **988** for US/Canada Suicide & Crisis Lifeline (available 24/7)
   - **111** for UK urgent mental health support
   - **116 123** for Samaritans in UK (available 24/7)
   - Crisis Text Line: text HOME to 741741 (available 24/7)
4. Emphasize that these feelings are treatable and there are people who want to help
5. Ask a gentle, caring follow-up question to keep them talking
6. Reassure them they're not alone and that you're here to listen
7. Use a warm, steady voice tone - be direct but extremely compassionate
8. Include phrases like "I'm so sorry you're going through this" and "These feelings, even though they're overwhelming, are treatable"

This is a crisis situation. Be comprehensive, warm, and include specific actionable help. Keep it conversational for voice but thorough.`
      : PROMPTS.CRISIS_RESPONSE(message);
    
    const crisisResult = await genTextFromGemini(crisisPrompt, 3);
    return crisisResult.text.trim();
    
  } catch (err) {
    console.warn(`${type} crisis AI response failed, using fallback:`, err);
    return generateFallbackCrisisResponse(message);
  }
}

/**
 * Create crisis alert data for database
 */
function createCrisisAlert(message, emotionData, type = 'text', additionalMeta = {}) {
  return {
    severity: "high",
    reason: `AI detected crisis from ${type}`,
    message: message,
    created_at: new Date(),
    meta: { 
      emotion: emotionData,
      type,
      ...additionalMeta
    }
  };
}

/**
 * Create crisis response metadata
 */
function createCrisisResponseMeta(emotionData, emotionModel, type = 'text', additionalMeta = {}) {
  return {
    automated: true, 
    risk: "high", 
    responseModel: `${type}-crisis-ai`,
    processedBy: type === 'voice' ? 'processVoice' : 'onChatMessage',
    emotion: emotionData,
    emotionModel: emotionModel,
    tts: false, // TTS handled separately for voice
    ...additionalMeta
  };
}

/**
 * Quick crisis keyword check for immediate detection
 */
function quickCrisisCheck(message) {
  const matchedKeywords = RISK_KEYWORDS.filter(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return {
    hasCrisisKeywords: matchedKeywords.length > 0,
    matchedKeywords,
    severity: matchedKeywords.length > 0 ? 'high' : 'safe'
  };
}

module.exports = {
  detectCrisis,
  performModeration,
  detectKeywordRisk,
  analyzeCrisisConditions,
  generateCrisisResponse,
  createCrisisAlert,
  createCrisisResponseMeta,
  quickCrisisCheck
};