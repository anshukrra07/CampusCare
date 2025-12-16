// services/audioService.js - Audio processing utilities
const speech = require("@google-cloud/speech").v1;
const tts = require("@google-cloud/text-to-speech");
const { Buffer } = require("buffer");
const { AUDIO_ENCODING, TTS_CONFIG, SPEECH_CONFIG } = require('../config/constants');

// Initialize Google Cloud clients
const speechClient = new speech.SpeechClient();
const ttsClient = new tts.TextToSpeechClient();

/**
 * Transcribe base64 audio to text
 */
async function transcribeBase64Audio(base64, mimeType = "audio/webm") {
  console.log(`🎙️ Starting audio transcription for ${mimeType}`);
  
  // Choose encoding by mime type
  let encoding = AUDIO_ENCODING.webm;
  if (mimeType.includes("wav")) encoding = AUDIO_ENCODING.wav;
  if (mimeType.includes("ogg")) encoding = AUDIO_ENCODING.ogg;

  const request = {
    audio: { content: base64 },
    config: {
      encoding,
      sampleRateHertz: SPEECH_CONFIG.sampleRateHertz,
      languageCode: SPEECH_CONFIG.languageCode,
      enableAutomaticPunctuation: SPEECH_CONFIG.enableAutomaticPunctuation,
    },
  };

  try {
    const [response] = await speechClient.recognize(request);
    
    if (!response || !response.results) {
      console.log("🎙️ No speech recognized in audio");
      return "";
    }
    
    const transcript = response.results
      .map((r) => r.alternatives?.[0]?.transcript || "")
      .join(" ");
      
    console.log(`🎙️ Transcription completed: "${transcript}"`);
    return transcript;
    
  } catch (error) {
    console.error("❌ Audio transcription failed:", error);
    throw new Error(`Audio transcription failed: ${error.message}`);
  }
}

/**
 * Synthesize text to speech and return base64 audio
 */
async function synthesizeAudioBase64(text) {
  console.log(`🔊 Starting TTS synthesis for text: "${text.slice(0, 50)}..."`);
  
  try {
    const request = {
      input: { text },
      voice: { 
        languageCode: TTS_CONFIG.languageCode, 
        name: TTS_CONFIG.name 
      },
      audioConfig: { 
        audioEncoding: TTS_CONFIG.audioEncoding 
      },
    };
    
    const [response] = await ttsClient.synthesizeSpeech(request);
    const audioBase64 = Buffer.from(response.audioContent).toString("base64");
    
    console.log(`🔊 TTS synthesis completed, audio length: ${audioBase64.length} chars`);
    return audioBase64;
    
  } catch (error) {
    console.error("❌ TTS synthesis failed:", error);
    throw new Error(`TTS synthesis failed: ${error.message}`);
  }
}

/**
 * Generate TTS in background (fire and forget)
 */
function generateTTSAsync(text, onSuccess = null, onError = null) {
  console.log("🔊 Starting background TTS generation...");
  
  synthesizeAudioBase64(text)
    .then(audioBase64 => {
      console.log("🔊 Background TTS generation completed");
      if (onSuccess) onSuccess(audioBase64);
    })
    .catch(ttsErr => {
      console.warn("⚠️ Background TTS generation failed:", ttsErr);
      if (onError) onError(ttsErr);
    });
}

/**
 * Validate audio format and size
 */
function validateAudioInput(audioBase64, mimeType) {
  const errors = [];
  
  if (!audioBase64) {
    errors.push("Missing audio data");
  }
  
  if (audioBase64 && audioBase64.length < 100) {
    errors.push("Audio data too short");
  }
  
  // Check for reasonable size limits (e.g., max 10MB base64)
  if (audioBase64 && audioBase64.length > 10 * 1024 * 1024) {
    errors.push("Audio data too large (max 10MB)");
  }
  
  const supportedTypes = ["audio/webm", "audio/wav", "audio/ogg"];
  if (mimeType && !supportedTypes.some(type => mimeType.includes(type.split('/')[1]))) {
    errors.push(`Unsupported audio format: ${mimeType}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get audio processing statistics
 */
function getAudioStats(audioBase64) {
  return {
    base64Length: audioBase64?.length || 0,
    estimatedSizeKB: audioBase64 ? Math.round(audioBase64.length * 0.75 / 1024) : 0,
    processingTimestamp: new Date().toISOString()
  };
}

module.exports = {
  transcribeBase64Audio,
  synthesizeAudioBase64,
  generateTTSAsync,
  validateAudioInput,
  getAudioStats
};