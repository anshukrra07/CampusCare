// config/constants.js - Centralized configuration
require("dotenv").config();

// Crisis detection keywords - centralized list
const RISK_KEYWORDS = [
  "suicide",
  "kill myself", 
  "i want to die",
  "end my life",
  "harm myself",
  "hurt myself",
  "kill me",
  "die",
  "death",
  "suicidal",
  "no point living",
  "better off dead"
];

// Emotion categories mapping - normalized emotion labels
const EMOTION_MAPPING = {
  joyful: 'happy', 
  joy: 'happy', 
  pleased: 'happy', 
  delighted: 'happy', 
  glad: 'happy',
  unhappy: 'sad', 
  sorrow: 'sad', 
  down: 'sad',
  nervous: 'anxious', 
  worried: 'anxious', 
  stressed: 'anxious',
  mad: 'angry', 
  upset: 'angry', 
  irritated: 'angry',
  frustrated: 'frustrated',
  excited: 'excited', 
  thrilled: 'excited',
  depressed: 'depressed', 
  hopeless: 'depressed',
  suicidal: 'suicidal', 
  selfharm: 'suicidal', 
  'self-harm': 'suicidal'
};

// Valid emotion categories
const VALID_EMOTIONS = ['happy', 'sad', 'anxious', 'angry', 'excited', 'frustrated', 'depressed', 'suicidal', 'neutral'];

// Crisis emotions that trigger alerts
const CRISIS_EMOTIONS = ["suicidal", "depressed", "hopeless"];

// Risk labels for crisis detection
const RISK_LABELS = ["suicide", "suicidal", "kill", "kill myself", "die", "death", "hopeless"];

// Environment variables
const GEMINI_KEY = process.env.GEMINI_KEY;

// Firebase region
const REGION = "asia-south1";

// Audio encoding options
const AUDIO_ENCODING = {
  webm: "WEBM_OPUS",
  wav: "LINEAR16", 
  ogg: "OGG_OPUS"
};

// TTS voice configuration
const TTS_CONFIG = {
  languageCode: "en-US",
  name: "en-US-Wavenet-D",
  audioEncoding: "MP3"
};

// Speech recognition configuration  
const SPEECH_CONFIG = {
  sampleRateHertz: 48000,
  languageCode: "en-US",
  enableAutomaticPunctuation: true
};

// Crisis thresholds - adjusted to reduce false positives
const CRISIS_THRESHOLDS = {
  EMOTION_INTENSITY: 85, // Increased from 80 to 85 for crisis emotions
  EXTREME_INTENSITY: 98  // Increased from 95 to 98 for any emotion
};

module.exports = {
  RISK_KEYWORDS,
  EMOTION_MAPPING,
  VALID_EMOTIONS,
  CRISIS_EMOTIONS,
  RISK_LABELS,
  GEMINI_KEY,
  REGION,
  AUDIO_ENCODING,
  TTS_CONFIG,
  SPEECH_CONFIG,
  CRISIS_THRESHOLDS
};