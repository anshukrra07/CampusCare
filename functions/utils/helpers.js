// utils/helpers.js - Helper functions for Cloud Functions
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
let genAI, model, fallbackModel;

try {
  const apiKey = process.env.GEMINI_KEY;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log('✅ Gemini AI initialized successfully');
  } else {
    console.warn('⚠️ Gemini API key not found in Firebase config');
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error);
}

// Generate text from Gemini AI with retry logic
const genTextFromGemini = async (prompt, maxRetries = 3) => {
  if (!genAI || !model) {
    console.warn('⚠️ Gemini AI not initialized');
    throw new Error('Gemini AI not available');
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini API attempt ${attempt}/${maxRetries}`);
      
      // Try flash-lite as primary, flash as fallback on final attempt
      const activeModel = (attempt === maxRetries) ? fallbackModel : model;
      const modelName = (attempt === maxRetries) ? "gemini-2.5-flash" : "gemini-2.5-flash-lite";
      console.log(`Using model: ${modelName}`);
      
      const resp = await activeModel.generateContent(prompt);

      // Try several fields (library returns different shapes in examples)
      const text =
        resp?.response?.text?.() ||
        resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        (Array.isArray(resp?.response?.candidates) &&
          resp.response.candidates[0]?.content?.parts?.map((p) => p.text).join("")) ||
        "";
      
      // Return both text and model info
      return {
        text: (text || "").toString(),
        model: modelName,
        attempt: attempt
      };
    } catch (error) {
      console.warn(`Gemini API attempt ${attempt} failed:`, error.message);
      
      // If it's a service overload error and we have retries left, wait and retry
      if (error.message.includes('overloaded') || error.message.includes('503')) {
        if (attempt < maxRetries) {
          const waitTime = attempt * 1500; // Shorter backoff: 1.5s, 3s, 4.5s
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // If it's the last attempt or a different error, throw
      throw error;
    }
  }
};

// Find matching keywords in a message
const findMatchingKeywords = (message, keywords) => {
  const messageLower = message.toLowerCase();
  return keywords.filter(keyword => 
    messageLower.includes(keyword.toLowerCase())
  );
};

// Clean and parse JSON from AI responses
const cleanAndParseJSON = (text) => {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\s*|```\s*/g, '').trim();
    
    // Try to extract JSON object if it's embedded in other text
    const jsonMatch = cleaned.match(/{[\s\S]*}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn('Failed to parse JSON from AI response:', error);
    throw error;
  }
};

// Generate fallback response
const generateFallbackResponse = (type = 'general') => {
  const fallbackResponses = {
    general: "I'm here to help. Can you tell me more about what's on your mind?",
    crisis: "I understand you're going through a difficult time. Please remember that help is available. If you're in immediate danger, please contact emergency services or a crisis hotline.",
    emotion: "Thank you for sharing how you're feeling. Your emotions are valid, and I'm here to listen."
  };
  
  return fallbackResponses[type] || fallbackResponses.general;
};

// Calculate age from birth date
const calculateAge = (birthDate) => {
  if (!birthDate) return '';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Normalize data to array format
const normalizeToArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    // Handle comma-separated strings
    return data.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }
  return [data]; // Convert single item to array
};

// Format date and time from Firebase timestamp
const formatDateTime = (timestamp) => {
  if (!timestamp) return { date: 'Unknown', time: '' };
  
  let date;
  if (timestamp.toDate) {
    // Firebase Timestamp
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    return { date: 'Unknown', time: '' };
  }
  
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return { date: dateStr, time: timeStr };
};

// Get emoji for appointment type
const getAppointmentTypeEmoji = (type) => {
  switch (type?.toLowerCase()) {
    case 'video':
      return '📹 Video call';
    case 'phone':
      return '📞 Phone call';
    case 'in-person':
    case 'office':
      return '🏢 In-person';
    default:
      return type || 'Meeting';
  }
};

// Get emoji for appointment status
const getAppointmentStatusEmoji = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return '✅';
    case 'pending':
      return '⏳';
    case 'cancelled':
      return '❌';
    case 'completed':
      return '✔️';
    default:
      return '📅';
  }
};

module.exports = {
  genTextFromGemini,
  generateFallbackResponse,
  findMatchingKeywords,
  cleanAndParseJSON,
  calculateAge,
  normalizeToArray,
  formatDateTime,
  getAppointmentTypeEmoji,
  getAppointmentStatusEmoji
};
