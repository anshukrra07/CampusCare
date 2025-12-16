# CampusCare - Digital Mental Health Support Platform

![alt text](<public/Screenshot 2025-12-16 at 7.17.15 PM.png>)

WEBSITE LINK-[text](https://campus-care-three.vercel.app)

> 🧠 **Hackathon Project**: A comprehensive digital mental health and psychological support system for students in higher education.

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.2.1-orange.svg)](https://firebase.google.com/)
[![Material-UI](https://img.shields.io/badge/Material--UI-7.3.2-blue.svg)](https://mui.com/)
[![Vite](https://img.shields.io/badge/Vite-7.1.2-green.svg)](https://vitejs.dev/)

## 🌟 Problem Statement

Mental health issues among college students have significantly increased in recent years, including anxiety, depression, burnout, sleep disorders, academic stress, and social isolation. CampusCare addresses the major gap in availability, accessibility, and stigma-free delivery of mental health support in higher education institutions.

## ✨ Key Features

### 🤖 AI-Powered Support
- **Intelligent Chatbot**: AI-guided first-aid support with contextual responses
- **Voice Integration**: Voice message processing with speech-to-text and text-to-speech
- **Emotion Analysis**: Real-time emotion detection and intensity scoring
- **Crisis Detection**: Automated crisis intervention with immediate support resources

### 📊 Mental Health Tools
- **Clinical Assessments**: PHQ-9 (Depression), GAD-7 (Anxiety), Perceived Stress Scale
- **Mood Tracking**: Comprehensive mood logging with analytics and insights
- **Progress Analytics**: Visual charts and trend analysis
- **Personalized Recommendations**: AI-driven suggestions based on user data

### 🩺 Professional Support
- **Appointment Booking**: Confidential scheduling with on-campus counselors
- **Support Groups**: Moderated peer-to-peer support forums
- **Crisis Resources**: 24/7 emergency contacts and safety planning tools
- **Multi-language Support**: Regional language compatibility

## 🚀 Recent Optimizations - **70% Code Reduction**

### ⚡ **Modular Architecture Implementation**
- **Before**: 1,530 lines in single `index.js`
- **After**: 494 lines in main file + 9 specialized modules
- **Benefits**: Better maintainability, reduced duplication, improved testability

### 🏗️ **New Modular Structure**:
```
functions/
├── config/            # Configuration and constants
│   ├── constants.js   # Environment variables, risk keywords
│   └── prompts.js     # Centralized AI prompt templates
├── services/          # Business logic services
│   ├── audioService.js      # Speech-to-text, TTS
│   ├── contextService.js    # User data context loading
│   ├── crisisService.js     # Crisis detection & response
│   ├── emotionService.js    # Unified emotion analysis
│   └── intentService.js     # AI intent detection
├── utils/             # Utility functions
│   └── helpers.js     # Common helper functions
└── index.js           # Main Cloud Functions (optimized)
```

### 🔧 **Key Improvements**:
1. **Unified Services**: Eliminated duplicate code across text/voice processing
2. **Centralized Configuration**: Single source of truth for constants and prompts
3. **Smart Context Loading**: Load only required data based on AI intent detection
4. **Parallel Processing**: Simultaneous emotion analysis, crisis detection, and intent recognition
5. **Enhanced Error Handling**: Graceful fallbacks with proper logging

## 🛠️ Technology Stack

### Frontend
- **React 19.1.1** - Modern UI framework
- **Material-UI 7.3.2** - Professional UI components
- **Recharts 3.2.0** - Data visualization
- **Vite 7.1.2** - Fast build tool

### Backend (Optimized)
- **Firebase Functions** - Serverless compute (modular architecture)
- **Firestore** - NoSQL database
- **Google Cloud Speech/TTS** - Voice processing
- **Google Generative AI (Gemini)** - Advanced AI with fallback models

## 🚀 Quick Start

### Frontend
```bash
npm install
npm run dev
```

### Backend Functions
```bash
cd functions
npm install
# Configure environment variables
firebase deploy --only functions
```

## 📱 Core Features

### Mental Health Assessments
- **PHQ-9**: Depression screening (9 questions, 5-7 minutes)
- **GAD-7**: Anxiety assessment (7 questions, 3-5 minutes)  
- **Stress Scale**: Perceived stress evaluation (10 questions, 5-8 minutes)

### AI-Powered Chat
- **Text Chat**: Contextual responses with emotion analysis
- **Voice Messages**: Speech-to-text processing with TTS responses
- **Crisis Detection**: Multi-layer safety system with immediate intervention
- **Intent Recognition**: Smart context loading based on user needs

### Support Systems
- **Crisis Resources**: 24/7 emergency contacts and safety planning
- **Appointment Booking**: Confidential counselor scheduling
- **Support Groups**: Peer-to-peer moderated forums
- **Multi-language**: English, Hindi, Telugu support

## 🎯 SIH Implementation Highlights

### Innovation
- First unified voice/text AI mental health platform
- Regional language support with cultural sensitivity
- Real-time emotion analysis with crisis intervention

### Technical Excellence
- 70% code reduction through modular architecture
- Parallel processing for optimal performance
- Smart context loading based on AI intent detection

### Impact
- Reduces stigma through anonymous, accessible platform
- Enables early intervention through AI-powered detection
- Provides data-driven insights for institutional policy

## 📊 Project Statistics
- **Frontend Components**: 15+ React components
- **Backend Services**: 9 modular services
- **AI Models**: 2 Gemini models with fallback
- **Languages Supported**: 3 (expandable)
- **Assessment Types**: 3 clinically validated
- **Code Optimization**: 70% reduction in main file

---

**⚠️ Disclaimer**: This platform provides supportive resources and should not replace professional mental health treatment. In emergencies, contact local crisis services immediately.

**Built with ❤️ for student mental health and well-being -**
