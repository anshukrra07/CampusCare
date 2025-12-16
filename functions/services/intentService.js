// services/intentService.js - AI-powered intent detection
const { genTextFromGemini, cleanAndParseJSON } = require('../utils/helpers');
const { PROMPTS } = require('../config/prompts');

/**
 * Default intent result structure
 */
const DEFAULT_INTENT = {
  needsAssessments: false,
  needsMoods: false, 
  needsAppointments: false,
  needsAlerts: false,
  needsSummary: false,
  needsProfile: false
};

/**
 * Detect user intent using AI
 */
async function detectIntent(message, type = 'text') {
  console.log(`🤖 Starting AI intent detection for ${type}...`);
  
  try {
    const intentPrompt = PROMPTS.INTENT_DETECTION(message);
    const intentAI = await genTextFromGemini(intentPrompt, 2);
    
    console.log('🤖 Raw AI intent response:', intentAI.text);
    
    const parsed = cleanAndParseJSON(intentAI.text);
    
    const intentResult = {
      needsAssessments: !!parsed.needsAssessments,
      needsMoods: !!parsed.needsMoods,
      needsAppointments: !!parsed.needsAppointments, 
      needsAlerts: !!parsed.needsAlerts,
      needsSummary: !!parsed.needsSummary,
      needsProfile: !!parsed.needsProfile
    };
    
    console.log('✅ AI intent detection result:', intentResult);
    return { intentResult, method: 'ai-powered' };
    
  } catch (err) {
    console.warn('⚠️ AI intent detection failed, using keyword fallback:', err);
    
    const intentResult = detectIntentByKeywords(message);
    return { intentResult, method: 'keyword-fallback' };
  }
}

/**
 * Keyword-based intent detection fallback
 */
function detectIntentByKeywords(message) {
  const messageLower = message.toLowerCase();
  
  return {
    needsAssessments: /\b(assessment|test|score|result|phq|gad|exam)\b/i.test(messageLower),
    needsMoods: /\b(mood|feeling|emotion|how.*feel|track)\b/i.test(messageLower),
    needsAppointments: /\b(appointment|session|meeting|counselor|therapist|schedule)\b/i.test(messageLower),
    needsAlerts: /\b(alert|crisis|emergency|help|urgent)\b/i.test(messageLower),
    needsSummary: /\b(summary|overview|progress|overall|how.*doing|report)\b/i.test(messageLower),
    needsProfile: /\b(name|interest|hobby|about me|who am i|my name|my interest)\b/i.test(messageLower)
  };
}

/**
 * Determine response strategy based on intent
 */
function getResponseStrategy(intentResult) {
  const { needsAssessments, needsMoods, needsAppointments, needsAlerts, needsSummary, needsProfile } = intentResult;
  
  // Check if any specific data is needed
  const hasSpecificNeeds = needsAssessments || needsMoods || needsAppointments || needsAlerts || needsProfile;
  
  if (needsSummary) {
    return {
      strategy: 'comprehensive-summary',
      description: 'User requested comprehensive summary',
      requiresContext: true,
      loadAll: true
    };
  }
  
  if (hasSpecificNeeds) {
    return {
      strategy: 'enhanced-context',
      description: 'User needs specific data',
      requiresContext: true,
      loadAll: false
    };
  }
  
  return {
    strategy: 'conversational',
    description: 'General conversation without specific data needs',
    requiresContext: false,
    loadAll: false
  };
}

/**
 * Build context loading plan based on intent
 */
function buildContextPlan(intentResult) {
  const { needsAssessments, needsMoods, needsAppointments, needsAlerts, needsSummary, needsProfile } = intentResult;
  
  const plan = {
    loadAssessments: needsAssessments || needsSummary,
    loadMoods: needsMoods || needsSummary,
    loadAppointments: needsAppointments || needsSummary,
    loadAlerts: needsAlerts || needsSummary,
    loadProfile: needsProfile || needsSummary,
    loadChats: true // Always load recent chats for conversation flow
  };
  
  const sections = [];
  if (plan.loadAssessments) sections.push('assessments');
  if (plan.loadMoods) sections.push('moods');
  if (plan.loadAppointments) sections.push('appointments');
  if (plan.loadAlerts) sections.push('alerts');
  if (plan.loadProfile) sections.push('profile');
  if (plan.loadChats) sections.push('chats');
  
  return {
    ...plan,
    sectionsToLoad: sections,
    totalSections: sections.length
  };
}

/**
 * Quick intent classification for immediate decisions
 */
function quickIntentCheck(message) {
  const messageLower = message.toLowerCase();
  
  // Check for summary request
  if (/\b(summary|overview|progress|overall|how.*doing|report)\b/i.test(messageLower)) {
    return {
      type: 'summary',
      confidence: 'high',
      requiresFullContext: true
    };
  }
  
  // Check for specific data requests
  if (/\b(assessment|test|score|result|phq|gad)\b/i.test(messageLower)) {
    return {
      type: 'assessment-query',
      confidence: 'high',
      requiresFullContext: false
    };
  }
  
  if (/\b(mood|feeling|emotion|how.*feel)\b/i.test(messageLower)) {
    return {
      type: 'mood-query',
      confidence: 'high',
      requiresFullContext: false
    };
  }
  
  if (/\b(appointment|session|meeting|counselor|therapist)\b/i.test(messageLower)) {
    return {
      type: 'appointment-query',
      confidence: 'high',
      requiresFullContext: false
    };
  }
  
  // Default to conversational
  return {
    type: 'conversational',
    confidence: 'medium',
    requiresFullContext: false
  };
}

/**
 * Validate intent detection result
 */
function validateIntentResult(intentResult) {
  const requiredKeys = ['needsAssessments', 'needsMoods', 'needsAppointments', 'needsAlerts', 'needsSummary', 'needsProfile'];
  
  const errors = [];
  
  // Check if all required keys are present
  for (const key of requiredKeys) {
    if (!(key in intentResult)) {
      errors.push(`Missing required field: ${key}`);
    }
  }
  
  // Check if values are boolean
  for (const [key, value] of Object.entries(intentResult)) {
    if (requiredKeys.includes(key) && typeof value !== 'boolean') {
      errors.push(`Field ${key} should be boolean, got ${typeof value}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  detectIntent,
  detectIntentByKeywords,
  getResponseStrategy,
  buildContextPlan,
  quickIntentCheck,
  validateIntentResult,
  DEFAULT_INTENT
};