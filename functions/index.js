// index.js (Cloud Functions) - Optimized Modular Structure
require("dotenv").config();
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { initializeApp } = require("firebase-admin/app");

// Import modular services
const { analyzeEmotion } = require('./services/emotionService');
const { 
  detectCrisis, 
  generateCrisisResponse, 
  createCrisisAlert, 
  createCrisisResponseMeta
} = require('./services/crisisService');
const { 
  getUserProfileContext, 
  getChatContext 
} = require('./services/contextService');
const { 
  transcribeBase64Audio, 
  generateTTSAsync, 
  validateAudioInput 
} = require('./services/audioService');
const { 
  detectIntent, 
  getResponseStrategy, 
  buildContextPlan 
} = require('./services/intentService');
const {
  generateTargetedFirstQuestion,
  generateTargetedContextualQuestion,
  generateTargetedInsights
} = require('./services/targetedAssessmentService');
const { genTextFromGemini, generateFallbackResponse, cleanAndParseJSON } = require('./utils/helpers');
const { PROMPTS } = require('./config/prompts');
const { REGION } = require('./config/constants');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const auth = getAuth();

// 🔄 AUTO-REFRESH CACHE TRIGGERS (all in asia-south1 region)
exports.refreshCacheOnAssessment = onDocumentCreated(
  {
    document: 'users/{userId}/assessments/{assessmentId}',
    region: REGION
  },
  async (event) => {
    const userId = event.params.userId;
    console.log(`🎯 Assessment added for ${userId}, refreshing PROFILE cache...`);
    await getUserProfileContext(userId, { forceRefresh: true });
  }
);

exports.refreshCacheOnAlert = onDocumentCreated(
  {
    document: 'users/{userId}/alerts/{alertId}',
    region: REGION
  },
  async (event) => {
    const userId = event.params.userId;
    console.log(`🚨 Alert added for ${userId}, refreshing PROFILE cache...`);
    await getUserProfileContext(userId, { forceRefresh: true });
  }
);

exports.refreshCacheOnMoodCreated = onDocumentCreated(
  {
    document: 'users/{userId}/moods/{moodId}',
    region: REGION
  },
  async (event) => {
    const userId = event.params.userId;
    console.log(`😊 Mood entry created for ${userId}, refreshing PROFILE cache...`);
    await getUserProfileContext(userId, { forceRefresh: true });
  }
);

exports.refreshCacheOnMoodUpdated = onDocumentUpdated(
  {
    document: 'users/{userId}/moods/{moodId}',
    region: REGION
  },
  async (event) => {
    const userId = event.params.userId;
    console.log(`😊 Mood entry updated for ${userId}, refreshing PROFILE cache...`);
    await getUserProfileContext(userId, { forceRefresh: true });
  }
);

exports.refreshCacheOnAppointment = onDocumentCreated(
  {
    document: 'users/{userId}/appointments/{appointmentId}',
    region: REGION
  },
  async (event) => {
    const userId = event.params.userId;
    console.log(`📅 Appointment added for ${userId}, refreshing PROFILE cache...`);
    await getUserProfileContext(userId, { forceRefresh: true });
  }
);

exports.refreshCacheOnProfile = onDocumentUpdated(
  {
    document: 'users/{userId}',
    region: REGION
  },
  async (event) => {
    const userId = event.params.userId;
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();
    
    // Only refresh if meaningful profile data changed
    const profileFields = ['displayName', 'name', 'gender', 'birthDate', 'interests', 'hobbies', 'role', 'email'];
    const hasProfileChange = profileFields.some(field => beforeData?.[field] !== afterData?.[field]);
    
    if (hasProfileChange) {
      console.log(`👤 Profile updated for ${userId}, refreshing PROFILE cache...`);
      await getUserProfileContext(userId, { forceRefresh: true });
    }
  }
);

// 🎙️ VOICE PROCESSING ENDPOINT
exports.processVoice = onRequest({ region: REGION, cors: true }, async (req, res) => {
  // Handle CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const { userId, audioBase64, mimeType } = req.body || {};
    
    // Validate input
    if (!userId || !audioBase64) {
      return res.status(400).send("Missing userId or audioBase64");
    }

    const audioValidation = validateAudioInput(audioBase64, mimeType);
    if (!audioValidation.isValid) {
      return res.status(400).json({ 
        ok: false, 
        error: "Invalid audio input", 
        details: audioValidation.errors 
      });
    }

    console.log(`🎙️ Processing voice message for user: ${userId}`);

    // 1. Transcribe audio to text
    const transcript = await transcribeBase64Audio(audioBase64, mimeType || "audio/webm");
    console.log(`🎙️ Transcript: "${transcript}"`);
    
    if (!transcript.trim()) {
      return res.status(400).json({ 
        ok: false, 
        error: "No speech detected in audio" 
      });
    }

    // 2. Save transcribed user message (as text, not voice)
    await db.collection("users").doc(userId).collection("chats").add({
      role: "user",
      text: transcript,
      type: "text",  // ✅ Save as text message, not voice
      created_at: new Date(),
      meta: { processedBy: "processVoice" },
    });

    // 3. Parallel processing: Emotion + Crisis + Intent Detection
    console.log("🔄 Starting parallel voice analysis...");
    const [emotionResult, crisisResult, intentResult] = await Promise.all([
      analyzeEmotion(transcript, 'voice'),
      detectCrisis(transcript, { emotion: "analyzing", intensity: 0 }, 'voice'),
      detectIntent(transcript, 'voice')
    ]);

    const { emotionData, emotionModel } = emotionResult;
    const { shouldTriggerCrisis } = crisisResult;
    const { intentResult: intents } = intentResult;

    // 4. Handle crisis situations immediately
    if (shouldTriggerCrisis) {
      console.log(`🚨 Crisis detected in voice message: "${transcript}"`);
      
      const crisisResponse = await generateCrisisResponse(transcript, 'voice');
      const crisisAlert = createCrisisAlert(transcript, emotionData, 'voice');
      const crisisResponseMeta = createCrisisResponseMeta(emotionData, emotionModel, 'voice');

      // Save crisis response and alert
      await Promise.all([
        db.collection("users").doc(userId).collection("chats").add({
          role: "assistant",
          text: crisisResponse,
          created_at: new Date(),
          meta: crisisResponseMeta
        }),
        db.collection("users").doc(userId).collection("alerts").add(crisisAlert)
      ]);

      // Generate TTS in background
      generateTTSAsync(crisisResponse);

      return res.json({
        ok: true,
        transcript,
        assistantText: crisisResponse,
        assistantAudio: null,
        emotion: emotionData,
        crisis: true,
        models: { emotion: emotionModel, response: "voice-crisis-ai" }
      });
    }

    // 5. Build context based on intent
    const contextPlan = buildContextPlan(intents);
    const responseStrategy = getResponseStrategy(intents);
    
    console.log(`📋 Context plan:`, contextPlan.sectionsToLoad);
    console.log(`🎯 Response strategy:`, responseStrategy.strategy);

    // 6. Load context data
    let contextData = {};
    let contextSections = [];

    // Always load chat context
    const chatContext = await getChatContext(userId);
    contextData.chats = chatContext;

    // Load specific context if needed
    if (responseStrategy.requiresContext) {
      const profileContext = await getUserProfileContext(userId);
      
      if (contextPlan.loadAssessments) {
        contextSections.push(`ASSESSMENT HISTORY: ${profileContext.assessmentSummary}`);
      }
      if (contextPlan.loadMoods) {
        contextSections.push(`RECENT MOODS: ${profileContext.moodSummary}`);
      }
      if (contextPlan.loadAppointments) {
        contextSections.push(`APPOINTMENTS: ${profileContext.appointmentsSummary}`);
      }
      if (contextPlan.loadAlerts) {
        contextSections.push(`CRISIS ALERTS: ${profileContext.alertSummary}`);
      }
      if (contextPlan.loadProfile) {
        contextSections.push(`PERSONAL PROFILE: ${profileContext.profileSummary}`);
      }
    }

    // 7. Generate AI response
    let assistantText = "";
    let responseModel = "voice-fallback";

    try {
      let prompt;
      const contextString = contextSections.join('\n\n');

      if (responseStrategy.strategy === 'comprehensive-summary') {
        prompt = PROMPTS.VOICE_COMPREHENSIVE_SUMMARY(transcript, emotionData, contextString, chatContext);
        responseModel = "voice-comprehensive-summary";
      } else if (responseStrategy.strategy === 'enhanced-context') {
        prompt = PROMPTS.VOICE_ENHANCED_CONTEXT(transcript, emotionData, contextString, chatContext);
        responseModel = "voice-enhanced-context";
      } else {
        prompt = PROMPTS.VOICE_CONVERSATIONAL(transcript, emotionData, chatContext);
        responseModel = "voice-conversational";
      }

      const aiResult = await genTextFromGemini(prompt, 2);
      assistantText = aiResult.text.trim();
      responseModel = aiResult.model;

    } catch (err) {
      console.warn("Voice AI response failed:", err);
      assistantText = generateFallbackResponse('voice');
      responseModel = "voice-error-fallback";
    }

    // 8. Save assistant response
    const assistantMeta = {
      automated: true,
      processedBy: "processVoice",
      emotion: emotionData,
      emotionModel: emotionModel,
      responseModel: responseModel,
      contextStrategy: responseStrategy.strategy,
      contextLoaded: Object.keys(contextData),
      detectedIntents: intents,
      tts: false
    };

    await db.collection("users").doc(userId).collection("chats").add({
      role: "assistant",
      text: assistantText,
      created_at: new Date(),
      meta: assistantMeta,
    });

    // 9. Generate TTS in background
    generateTTSAsync(assistantText);

    return res.json({
      ok: true,
      transcript,
      assistantText,
      assistantAudio: null,
      emotion: emotionData,
      models: { emotion: emotionModel, response: responseModel },
      performance: { fastMode: true, ttsAsync: true }
    });

  } catch (error) {
    console.error("❌ processVoice error:", error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || "Internal server error" 
    });
  }
});





// 🎯 TARGETED AI ASSESSMENT ENDPOINTS
exports.generateTargetedFirstQuestion = onRequest({ region: REGION, cors: true }, async (req, res) => {
  // Handle CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const { selectedAreas, userId } = req.body || {};
    
    if (!selectedAreas || !Array.isArray(selectedAreas) || selectedAreas.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: "Missing or empty selected areas" 
      });
    }

    const result = await generateTargetedFirstQuestion(selectedAreas, userId, db);
    return res.json(result);

  } catch (error) {
    console.error("❌ generateTargetedFirstQuestion error:", error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || "Internal server error" 
    });
  }
});

exports.generateTargetedContextualQuestion = onRequest({ region: REGION, cors: true }, async (req, res) => {
  // Handle CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const { questionContext, userId } = req.body || {};
    
    if (!questionContext || !questionContext.selectedAreas) {
      return res.status(400).json({ 
        ok: false, 
        error: "Missing question context or selected areas" 
      });
    }

    const result = await generateTargetedContextualQuestion(questionContext, userId, db);
    return res.json(result);

  } catch (error) {
    console.error("❌ generateTargetedContextualQuestion error:", error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || "Internal server error" 
    });
  }
});

// 💬 TEXT CHAT PROCESSING
exports.onChatMessage = onDocumentCreated(
  {
    document: "users/{userId}/chats/{messageId}",
    region: REGION,
  },
  async (event) => {
    const data = event.data.data();
    const { userId } = event.params;

    // Skip non-user messages or already processed messages
    if (!data || data.role !== "user") return;
    if (data.meta?.processedBy === "processVoice" || 
        data.meta?.processedBy === "voiceUpload" ||
        data.meta?.processedBy === "voiceProcessingComplete" ||
        data.meta?.isVoiceMessage === true || 
        data.type === "voice") {
      console.log("onChatMessage: skipping voice message or processed message");
      return;
    }

    const userMsg = data.text?.trim();
    if (!userMsg || userMsg === "" || userMsg === "undefined") {
      console.log("onChatMessage: skipping message with no text content");
      return;
    }

    console.log("💬 Processing text message:", userMsg);

    try {
      // 1. Parallel processing: Emotion + Crisis + Intent Detection
      console.log("🔄 Starting parallel text analysis...");
      const [emotionResult, crisisResult, intentResult] = await Promise.all([
        analyzeEmotion(userMsg, 'text'),
        detectCrisis(userMsg, { emotion: "analyzing", intensity: 0 }, 'text'),
        detectIntent(userMsg, 'text')
      ]);

      const { emotionData, emotionModel } = emotionResult;
      const { shouldTriggerCrisis } = crisisResult;
      const { intentResult: intents } = intentResult;

      // 2. Handle crisis situations immediately
      if (shouldTriggerCrisis) {
        console.log(`🚨 Crisis detected in text message: "${userMsg}"`);
        
        const crisisResponse = await generateCrisisResponse(userMsg, 'text');
        const crisisAlert = createCrisisAlert(userMsg, emotionData, 'text', { chat_id: event.params.messageId });
        const crisisResponseMeta = createCrisisResponseMeta(emotionData, emotionModel, 'text');

        // Save crisis response and alert
        await Promise.all([
          db.collection("users").doc(userId).collection("chats").add({
            role: "assistant",
            text: crisisResponse,
            created_at: new Date(),
            meta: crisisResponseMeta
          }),
          db.collection("users").doc(userId).collection("alerts").add(crisisAlert)
        ]);

        return;
      }

      // 3. Build context based on intent
      const contextPlan = buildContextPlan(intents);
      const responseStrategy = getResponseStrategy(intents);
      
      console.log(`📋 Context plan:`, contextPlan.sectionsToLoad);
      console.log(`🎯 Response strategy:`, responseStrategy.strategy);

      // 4. Load context data in parallel for faster performance
      let contextData = {};
      let contextSections = [];
      let chatContext, profileContext;

      if (responseStrategy.requiresContext) {
        // Load both chat and profile context in parallel (saves ~200-300ms)
        [chatContext, profileContext] = await Promise.all([
          getChatContext(userId),
          getUserProfileContext(userId)
        ]);
        
        // Build context sections based on plan
        if (contextPlan.loadAssessments) {
          contextSections.push(`ASSESSMENT HISTORY: ${profileContext.assessmentSummary}`);
        }
        if (contextPlan.loadMoods) {
          contextSections.push(`RECENT MOODS: ${profileContext.moodSummary}`);
        }
        if (contextPlan.loadAppointments) {
          contextSections.push(`APPOINTMENTS: ${profileContext.appointmentsSummary}`);
        }
        if (contextPlan.loadAlerts) {
          contextSections.push(`CRISIS ALERTS: ${profileContext.alertSummary}`);
        }
        if (contextPlan.loadProfile) {
          contextSections.push(`PERSONAL PROFILE: ${profileContext.profileSummary}`);
        }
      } else {
        // Only load chat context for conversational responses (faster for simple chats)
        chatContext = await getChatContext(userId);
      }
      
      contextData.chats = chatContext;

      // 5. Generate AI response
      let assistantText = "";
      let responseModel = "text-fallback";

      try {
        let prompt;
        const contextString = contextSections.join('\n\n');

        if (responseStrategy.strategy === 'comprehensive-summary') {
          prompt = PROMPTS.COMPREHENSIVE_SUMMARY_RESPONSE(userMsg, emotionData, contextString, chatContext);
          responseModel = "text-comprehensive-summary";
        } else if (responseStrategy.strategy === 'enhanced-context') {
          prompt = PROMPTS.ENHANCED_CONTEXT_RESPONSE(userMsg, emotionData, contextString, chatContext);
          responseModel = "text-enhanced-context";
        } else {
          prompt = PROMPTS.CONVERSATIONAL_RESPONSE(userMsg, emotionData, chatContext);
          responseModel = "text-conversational";
        }

        const aiResult = await genTextFromGemini(prompt, 2);
        assistantText = aiResult.text.trim();
        responseModel = aiResult.model;

      } catch (err) {
        console.warn("Text AI response failed:", err);
        assistantText = generateFallbackResponse('general');
        responseModel = "text-error-fallback";
      }

      // 6. Parallel DB operations for faster response
      const assistantMeta = {
        automated: true,
        source: "gemini",
        emotion: emotionData,
        emotionModel: emotionModel,
        responseModel: responseModel,
        contextStrategy: responseStrategy.strategy,
        contextLoaded: Object.keys(contextData),
        detectedIntents: intents
      };

      // Execute both DB operations in parallel (faster than sequential)
      await Promise.all([
        // Update user message with processing info
        db.collection("users").doc(userId).collection("chats").doc(event.params.messageId).update({
          'meta.emotion': emotionData,
          'meta.emotionModel': emotionModel,
          'meta.processedBy': 'onChatMessage'
        }).catch(err => console.warn("Failed to update user message:", err)),
        
        // Save assistant response
        db.collection("users").doc(userId).collection("chats").add({
          role: "assistant",
          text: assistantText,
          created_at: new Date(),
          meta: assistantMeta,
        })
      ]);

      console.log("✅ Text message processed successfully");

    } catch (error) {
      console.error("❌ Error in onChatMessage:", error);
      
      // Save error response
      await db.collection("users").doc(userId).collection("chats").add({
        role: "assistant",
        text: "Sorry, I wasn't able to respond just now. Can you try again?",
        created_at: new Date(),
        meta: { automated: true, error: true },
      });
    }
  }
);

