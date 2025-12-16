import { useLanguage } from '../contexts/LanguageContext';

export const ACTIVITY_TYPES = {
  EXERCISE: 'exercise',
  COUNSELING: 'counseling', 
  ENTERTAINMENT: 'entertainment',
  MINDFULNESS: 'mindfulness',
  SOCIAL: 'social',
  CREATIVE: 'creative',
  EDUCATIONAL: 'educational'
};

export const ASSESSMENT_TYPES = {
  PHQ9: 'phq9',
  GAD7: 'gad7',
  STRESS: 'stress'
};

// Recommendation database organized by language, assessment type, and severity
const RECOMMENDATIONS = {
  en: {
    exercise: {
      low: [
        { title: "Daily Walk", description: "Take a 20-minute walk in nature", icon: "🚶‍♂️", duration: "20 min" },
        { title: "Yoga Stretches", description: "Gentle yoga routine for beginners", icon: "🧘‍♀️", duration: "15 min" },
        { title: "Dancing", description: "Dance to your favorite music", icon: "💃", duration: "10-30 min" },
        { title: "Cycling", description: "Light cycling around your neighborhood", icon: "🚴‍♂️", duration: "30 min" }
      ],
      moderate: [
        { title: "Jogging", description: "Morning or evening jog", icon: "🏃‍♂️", duration: "30 min" },
        { title: "Swimming", description: "Swimming laps or water aerobics", icon: "🏊‍♀️", duration: "45 min" },
        { title: "Strength Training", description: "Basic weight training routine", icon: "💪", duration: "30-45 min" },
        { title: "Badminton/Tennis", description: "Play sports with friends", icon: "🏸", duration: "60 min" }
      ],
      high: [
        { title: "High-Intensity Training", description: "HIIT workout to release endorphins", icon: "🔥", duration: "20-30 min" },
        { title: "Boxing/Kickboxing", description: "Channel stress into physical activity", icon: "🥊", duration: "45 min" },
        { title: "Rock Climbing", description: "Indoor climbing for focus and strength", icon: "🧗‍♂️", duration: "60 min" },
        { title: "Marathon Training", description: "Long-distance running program", icon: "🏃‍♀️", duration: "60+ min" }
      ]
    },
    counseling: {
      low: [
        { title: "Peer Support Group", description: "Connect with fellow students", icon: "👥", type: "group" },
        { title: "Online Counseling Chat", description: "Anonymous text-based support", icon: "💬", type: "online" },
        { title: "Self-Help Resources", description: "Guided self-help materials", icon: "📚", type: "self" }
      ],
      moderate: [
        { title: "Individual Therapy", description: "One-on-one counseling session", icon: "🗣️", type: "individual" },
        { title: "Group Therapy", description: "Structured group counseling", icon: "👥", type: "group" },
        { title: "Cognitive Behavioral Therapy", description: "CBT techniques and exercises", icon: "🧠", type: "specialized" }
      ],
      high: [
        { title: "Emergency Counseling", description: "Immediate professional support", icon: "🚨", type: "emergency" },
        { title: "Intensive Therapy", description: "Multiple sessions per week", icon: "⚡", type: "intensive" },
        { title: "Psychiatric Evaluation", description: "Medical assessment and treatment", icon: "🏥", type: "medical" }
      ]
    },
    entertainment: {
      comedy: [
        { title: "Comedy Shows", description: "Watch stand-up comedy or sitcoms", icon: "😂", platform: "Netflix, YouTube" },
        { title: "Funny Podcasts", description: "Listen to humorous podcasts", icon: "🎧", platform: "Spotify, Apple" },
        { title: "Comedy Games", description: "Play fun, light-hearted games", icon: "🎮", platform: "Mobile, PC" }
      ],
      motivational: [
        { title: "Inspirational Movies", description: "Uplifting and motivational films", icon: "🎬", platform: "Netflix, Prime" },
        { title: "TED Talks", description: "Inspiring and educational talks", icon: "📺", platform: "YouTube, TED" },
        { title: "Motivational Books", description: "Read inspiring stories", icon: "📖", platform: "Kindle, Library" }
      ],
      relaxing: [
        { title: "Nature Documentaries", description: "Calming wildlife and nature shows", icon: "🌿", platform: "Netflix, YouTube" },
        { title: "Meditation Apps", description: "Guided meditation and sleep stories", icon: "🧘‍♂️", platform: "Headspace, Calm" },
        { title: "Lo-fi Music", description: "Relaxing background music", icon: "🎵", platform: "Spotify, YouTube" }
      ]
    },
    mindfulness: {
      beginner: [
        { title: "Breathing Exercise", description: "5-minute deep breathing", icon: "💨", duration: "5 min" },
        { title: "Body Scan", description: "Progressive muscle relaxation", icon: "🧘‍♀️", duration: "10 min" },
        { title: "Gratitude Journal", description: "Write 3 things you're grateful for", icon: "📝", duration: "5 min" }
      ],
      intermediate: [
        { title: "Guided Meditation", description: "20-minute meditation session", icon: "🧘‍♂️", duration: "20 min" },
        { title: "Mindful Walking", description: "Conscious walking meditation", icon: "👣", duration: "15 min" },
        { title: "Loving-Kindness Meditation", description: "Cultivate compassion", icon: "💝", duration: "15 min" }
      ],
      advanced: [
        { title: "Silent Meditation", description: "Extended silent practice", icon: "🤫", duration: "30+ min" },
        { title: "Mindfulness Retreat", description: "Day-long mindfulness program", icon: "🏔️", duration: "Full day" },
        { title: "Zen Practice", description: "Advanced meditation techniques", icon: "☯️", duration: "45 min" }
      ]
    },
    social: {
      introverted: [
        { title: "Online Gaming", description: "Play with friends online", icon: "🎮", type: "virtual" },
        { title: "Book Club", description: "Join or start a reading group", icon: "📚", type: "structured" },
        { title: "Study Groups", description: "Academic collaboration", icon: "📖", type: "educational" }
      ],
      extroverted: [
        { title: "Social Events", description: "Attend campus social activities", icon: "🎉", type: "events" },
        { title: "Sports Teams", description: "Join recreational sports", icon: "⚽", type: "sports" },
        { title: "Volunteer Work", description: "Community service projects", icon: "🤝", type: "service" }
      ]
    }
  },
  
  hi: {
    exercise: {
      low: [
        { title: "दैनिक टहलना", description: "प्रकृति में 20 मिनट की सैर", icon: "🚶‍♂️", duration: "20 मिनट" },
        { title: "योग आसन", description: "शुरुआती लोगों के लिए हल्के योग", icon: "🧘‍♀️", duration: "15 मिनट" },
        { title: "नृत्य", description: "अपने पसंदीदा संगीत पर नाचें", icon: "💃", duration: "10-30 मिनट" },
        { title: "साइकिल चलाना", description: "आसपास साइकिल चलाएं", icon: "🚴‍♂️", duration: "30 मिनट" }
      ],
      moderate: [
        { title: "जॉगिंग", description: "सुबह या शाम की दौड़", icon: "🏃‍♂️", duration: "30 मिनट" },
        { title: "तैराकी", description: "तैराकी या जल एरोबिक्स", icon: "🏊‍♀️", duration: "45 मिनट" },
        { title: "शक्ति प्रशिक्षण", description: "बुनियादी वजन उठाने की दिनचर्या", icon: "💪", duration: "30-45 मिनट" },
        { title: "बैडमिंटन/टेनिस", description: "दोस्तों के साथ खेल", icon: "🏸", duration: "60 मिनट" }
      ],
      high: [
        { title: "उच्च तीव्रता प्रशिक्षण", description: "एंडोर्फिन रिलीज करने के लिए HIIT", icon: "🔥", duration: "20-30 मिनट" },
        { title: "मुक्केबाजी", description: "तनाव को शारीरिक गतिविधि में बदलें", icon: "🥊", duration: "45 मिनट" },
        { title: "चट्टान पर चढ़ना", description: "फोकस और ताकत के लिए इंडोर क्लाइंबिंग", icon: "🧗‍♂️", duration: "60 मिनट" }
      ]
    },
    counseling: {
      low: [
        { title: "साथी सहायता समूह", description: "साथी छात्रों से जुड़ें", icon: "👥", type: "समूह" },
        { title: "ऑनलाइन परामर्श चैट", description: "गुमनाम टेक्स्ट आधारित सहायता", icon: "💬", type: "ऑनलाइन" },
        { title: "स्व-सहायता संसाधन", description: "निर्देशित स्व-सहायता सामग्री", icon: "📚", type: "स्वयं" }
      ],
      moderate: [
        { title: "व्यक्तिगत चिकित्सा", description: "एक-पर-एक परामर्श सत्र", icon: "🗣️", type: "व्यक्तिगत" },
        { title: "समूह चिकित्सा", description: "संरचित समूह परामर्श", icon: "👥", type: "समूह" },
        { title: "संज्ञानात्मक व्यवहार चिकित्सा", description: "CBT तकनीक और अभ्यास", icon: "🧠", type: "विशेषज्ञ" }
      ],
      high: [
        { title: "आपातकालीन परामर्श", description: "तत्काल पेशेवर सहायता", icon: "🚨", type: "आपातकाल" },
        { title: "गहन चिकित्सा", description: "सप्ताह में कई सत्र", icon: "⚡", type: "गहन" },
        { title: "मानसिक चिकित्सा मूल्यांकन", description: "चिकित्सा मूल्यांकन और उपचार", icon: "🏥", type: "चिकित्सा" }
      ]
    }
  },
  
  te: {
    exercise: {
      low: [
        { title: "రోజువారీ నడక", description: "ప్రకృతిలో 20 నిమిషాల నడక", icon: "🚶‍♂️", duration: "20 నిమిషాలు" },
        { title: "యోగాసనలు", description: "ప్రారంభకుల కోసం సౌమ్య యోగా", icon: "🧘‍♀️", duration: "15 నిమిషాలు" },
        { title: "నృత్యం", description: "మీ ఇష్టమైన సంగీతంతో నృత్యం", icon: "💃", duration: "10-30 నిమిషాలు" },
        { title: "సైకిలింగ్", description: "మీ పొరుగు ప్రాంతంలో తేలికపాటి సైకిలింగ్", icon: "🚴‍♂️", duration: "30 నిమిషాలు" }
      ],
      moderate: [
        { title: "జాగింగ్", description: "ఉదయం లేదా సాయంత్రం జాగింగ్", icon: "🏃‍♂️", duration: "30 నిమిషాలు" },
        { title: "ఈత", description: "ఈత కొట్టడం లేదా నీటి ఏరోబిక్స్", icon: "🏊‍♀️", duration: "45 నిమిషాలు" },
        { title: "బలం శిక్షణ", description: "ప్రాథమిక బరువు శిక్షణ", icon: "💪", duration: "30-45 నిమిషాలు" },
        { title: "బ్యాడ్మింటన్/టెన్నిస్", description: "స్నేహితులతో క్రీడలు ఆడండి", icon: "🏸", duration: "60 నిమిషాలు" }
      ],
      high: [
        { title: "అధిక తీవ్రత శిక్షణ", description: "ఎండార్ఫిన్లను విడుదల చేయడానికి HIIT", icon: "🔥", duration: "20-30 నిమిషాలు" },
        { title: "బాక్సింగ్", description: "ఒత్తిడిని శారీరక కార్యకలాపంగా మార్చండి", icon: "🥊", duration: "45 నిమిషాలు" },
        { title: "రాక్ క్లైంబింగ్", description: "దృష్టి మరియు బలం కోసం ఇండోర్ క్లైంబింగ్", icon: "🧗‍♂️", duration: "60 నిమిషాలు" }
      ]
    },
    counseling: {
      low: [
        { title: "సహచర మద్దతు గుంపు", description: "తోటి విద్యార్థులతో కనెక్ట్ అవ్వండి", icon: "👥", type: "సమూహం" },
        { title: "ఆన్‌లైన్ కౌన్సెలింగ్ చాట్", description: "అనామక వచన ఆధారిత మద్దతు", icon: "💬", type: "ఆన్‌లైన్" },
        { title: "స్వయం సహాయ వనరులు", description: "మార్గదర్శక స్వయం సహాయ విషయాలు", icon: "📚", type: "స్వయం" }
      ],
      moderate: [
        { title: "వ్యక్తిగత చికిత్స", description: "ఒకరిపై ఒకరు కౌన్సెలింగ్ సెషన్", icon: "🗣️", type: "వ్యక్తిగత" },
        { title: "సమూహ చికిత్స", description: "నిర్మాణాత్మక సమూహ కౌన్సెలింగ్", icon: "👥", type: "సమూహం" },
        { title: "కాగ్నిటివ్ బిహేవియరల్ థెరపీ", description: "CBT టెక్నిక్లు మరియు వ్యాయామాలు", icon: "🧠", type: "ప్రత్యేక" }
      ],
      high: [
        { title: "అత్యవసర కౌన్సెలింగ్", description: "తక్షణ వృత్తిపరమైన మద్దతు", icon: "🚨", type: "అత్యవసరం" },
        { title: "గంభీర చికిత్స", description: "వారానికి అనేక సెషన్లు", icon: "⚡", type: "గంభీర" },
        { title: "మానసిక వైద్య మూల్యాంకనం", description: "వైద్య మూల్యాంకనం మరియు చికిత్స", icon: "🏥", type: "వైద్య" }
      ]
    }
  }
};

// User interest mapping for personalized recommendations
const INTEREST_MAPPING = {
  sports: ['exercise', 'social'],
  music: ['entertainment', 'creative'],
  reading: ['educational', 'mindfulness'],
  games: ['entertainment', 'social'],
  art: ['creative', 'mindfulness'],
  technology: ['educational', 'entertainment'],
  nature: ['exercise', 'mindfulness'],
  movies: ['entertainment'],
  cooking: ['creative', 'social']
};

// Age-based activity preferences
const AGE_PREFERENCES = {
  '18-22': {
    social: ['social events', 'gaming', 'sports teams'],
    exercise: ['dancing', 'sports', 'gym'],
    entertainment: ['social media', 'gaming', 'movies']
  },
  '23-30': {
    social: ['networking events', 'hobby groups', 'volunteer work'],
    exercise: ['fitness classes', 'running', 'yoga'],
    entertainment: ['streaming', 'concerts', 'books']
  }
};

export class RecommendationEngine {
  constructor(language = 'en') {
    this.language = language;
    this.recommendations = RECOMMENDATIONS[language] || RECOMMENDATIONS.en;
  }

  /**
   * Generate comprehensive recommendations based on user profile and current state
   */
  generateRecommendations({
    assessmentScores = {},
    moodHistory = [],
    userProfile = {},
    currentMood = null
  }) {
    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      emergency: false
    };

    // Check for emergency situations
    if (this.isEmergencyState(assessmentScores, currentMood)) {
      recommendations.emergency = true;
      recommendations.immediate = this.getEmergencyRecommendations();
      return recommendations;
    }

    // Get severity levels for each assessment
    const phq9Severity = this.getAssessmentSeverity(ASSESSMENT_TYPES.PHQ9, assessmentScores.phq9);
    const gad7Severity = this.getAssessmentSeverity(ASSESSMENT_TYPES.GAD7, assessmentScores.gad7);
    const stressSeverity = this.getAssessmentSeverity(ASSESSMENT_TYPES.STRESS, assessmentScores.stress);

    // Generate immediate recommendations (next 1-4 hours)
    recommendations.immediate = this.getImmediateRecommendations({
      phq9Severity,
      gad7Severity, 
      stressSeverity,
      currentMood,
      userProfile
    });

    // Generate short-term recommendations (this week)
    recommendations.shortTerm = this.getShortTermRecommendations({
      phq9Severity,
      gad7Severity,
      stressSeverity,
      moodHistory,
      userProfile
    });

    // Generate long-term recommendations (this month)
    recommendations.longTerm = this.getLongTermRecommendations({
      phq9Severity,
      gad7Severity,
      stressSeverity,
      moodHistory,
      userProfile
    });

    return recommendations;
  }

  /**
   * Check if user is in emergency state requiring immediate intervention
   */
  isEmergencyState(assessmentScores, currentMood) {
    // High PHQ-9 score (>15) indicates severe depression
    if (assessmentScores.phq9 && assessmentScores.phq9 > 15) return true;
    
    // High GAD-7 score (>15) indicates severe anxiety
    if (assessmentScores.gad7 && assessmentScores.gad7 > 15) return true;
    
    // Very low mood (1) for current state
    if (currentMood && currentMood <= 1) return true;
    
    return false;
  }

  /**
   * Get emergency recommendations for crisis situations
   */
  getEmergencyRecommendations() {
    return [
      {
        type: ACTIVITY_TYPES.COUNSELING,
        title: "Emergency Support",
        description: "Contact crisis hotline immediately",
        icon: "🚨",
        priority: "urgent",
        action: "call",
        contact: "988"
      },
      {
        type: ACTIVITY_TYPES.COUNSELING,
        title: "Campus Counselor",
        description: "Reach out to campus mental health services",
        icon: "🏥",
        priority: "urgent",
        action: "visit"
      },
      {
        type: ACTIVITY_TYPES.SOCIAL,
        title: "Trusted Friend",
        description: "Call a friend or family member",
        icon: "📞",
        priority: "high",
        action: "call"
      }
    ];
  }

  /**
   * Get assessment severity level
   */
  getAssessmentSeverity(assessmentType, score) {
    if (!score) return null;
    
    const severityRanges = {
      [ASSESSMENT_TYPES.PHQ9]: {
        low: [0, 4],
        moderate: [5, 9],
        moderateHigh: [10, 14],
        high: [15, 27]
      },
      [ASSESSMENT_TYPES.GAD7]: {
        low: [0, 4],
        moderate: [5, 9],
        moderateHigh: [10, 14],
        high: [15, 21]
      },
      [ASSESSMENT_TYPES.STRESS]: {
        low: [0, 13],
        moderate: [14, 26],
        high: [27, 40]
      }
    };

    const ranges = severityRanges[assessmentType];
    if (score >= ranges.high[0]) return 'high';
    if (score >= ranges.moderateHigh?.[0] || score >= ranges.moderate[0]) return 'moderate';
    return 'low';
  }

  /**
   * Generate immediate recommendations (next 1-4 hours)
   */
  getImmediateRecommendations({ phq9Severity, gad7Severity, stressSeverity, currentMood, userProfile }) {
    const recommendations = [];
    const { age, gender, interests = [], personality = 'balanced' } = userProfile;

    // Mood-based immediate actions
    if (currentMood && currentMood <= 2) {
      // Very low mood - need immediate mood boost
      recommendations.push(...this.getMoodBoostActivities(interests, personality));
    } else if (currentMood && currentMood >= 4) {
      // Good mood - maintain with positive activities  
      recommendations.push(...this.getMaintainMoodActivities(interests, personality));
    }

    // Assessment-based immediate recommendations
    if (stressSeverity === 'high' || gad7Severity === 'high') {
      recommendations.push(...this.getStressReliefActivities(userProfile));
    }

    if (phq9Severity === 'moderate' || phq9Severity === 'high') {
      recommendations.push(...this.getDepressionReliefActivities(userProfile));
    }

    return this.personalizeRecommendations(recommendations, userProfile).slice(0, 3);
  }

  /**
   * Get mood boost activities for immediate relief
   */
  getMoodBoostActivities(interests, personality) {
    const activities = [];
    
    // Quick exercise for endorphin boost
    activities.push({
      type: ACTIVITY_TYPES.EXERCISE,
      title: "5-Minute Energy Boost",
      description: "Quick jumping jacks or dancing",
      icon: "⚡",
      duration: "5 min",
      difficulty: "easy"
    });

    // Entertainment based on interests
    if (interests.includes('music')) {
      activities.push({
        type: ACTIVITY_TYPES.ENTERTAINMENT,
        title: "Upbeat Playlist",
        description: "Listen to your favorite energizing music",
        icon: "🎵",
        duration: "15-30 min"
      });
    }

    if (interests.includes('games')) {
      activities.push({
        type: ACTIVITY_TYPES.ENTERTAINMENT,
        title: "Fun Mobile Game",
        description: "Play a light, fun game for distraction",
        icon: "🎮",
        duration: "10-20 min"
      });
    }

    // Social connection
    activities.push({
      type: ACTIVITY_TYPES.SOCIAL,
      title: "Text a Friend",
      description: "Reach out to someone who makes you smile",
      icon: "💬",
      duration: "5-15 min"
    });

    return activities;
  }

  /**
   * Get activities to maintain good mood
   */
  getMaintainMoodActivities(interests, personality) {
    const activities = [];

    activities.push({
      type: ACTIVITY_TYPES.MINDFULNESS,
      title: "Gratitude Practice",
      description: "Write down 3 things you're grateful for",
      icon: "🙏",
      duration: "5 min"
    });

    if (interests.includes('nature')) {
      activities.push({
        type: ACTIVITY_TYPES.EXERCISE,
        title: "Nature Walk",
        description: "Take a mindful walk outside",
        icon: "🌳",
        duration: "20-30 min"
      });
    }

    return activities;
  }

  /**
   * Get stress relief activities
   */
  getStressReliefActivities(userProfile) {
    return this.recommendations.mindfulness.beginner.concat([
      {
        type: ACTIVITY_TYPES.EXERCISE,
        title: "Stress-Relief Workout",
        description: "Physical activity to release tension",
        icon: "🏃‍♂️",
        duration: "20-30 min"
      }
    ]);
  }

  /**
   * Get depression relief activities
   */
  getDepressionReliefActivities(userProfile) {
    const activities = [];

    // Light exercise is crucial for depression
    activities.push(...this.recommendations.exercise.low);
    
    // Professional support
    activities.push(...this.recommendations.counseling.moderate);

    return activities;
  }

  /**
   * Personalize recommendations based on user profile
   */
  personalizeRecommendations(recommendations, userProfile) {
    const { interests = [], age, gender, personality = 'balanced' } = userProfile;
    
    return recommendations.map(rec => {
      // Add personalization metadata
      rec.personalized = true;
      rec.matchScore = this.calculateMatchScore(rec, userProfile);
      return rec;
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }

  /**
   * Calculate how well a recommendation matches user profile
   */
  calculateMatchScore(recommendation, userProfile) {
    let score = 0;
    const { interests = [], age, personality } = userProfile;

    // Interest matching
    interests.forEach(interest => {
      const activityTypes = INTEREST_MAPPING[interest] || [];
      if (activityTypes.includes(recommendation.type)) {
        score += 2;
      }
    });

    // Age-based preferences
    const ageGroup = age ? (age <= 22 ? '18-22' : '23-30') : '18-22';
    const agePrefs = AGE_PREFERENCES[ageGroup] || {};
    
    Object.values(agePrefs).forEach(prefList => {
      if (prefList.some(pref => recommendation.title.toLowerCase().includes(pref))) {
        score += 1;
      }
    });

    // Personality matching
    if (personality === 'introverted' && recommendation.type === ACTIVITY_TYPES.SOCIAL) {
      score -= 1; // Slightly prefer individual activities
    } else if (personality === 'extroverted' && recommendation.type === ACTIVITY_TYPES.SOCIAL) {
      score += 1; // Prefer social activities
    }

    return score;
  }

  /**
   * Generate short-term recommendations (this week)
   */
  getShortTermRecommendations({ phq9Severity, gad7Severity, stressSeverity, moodHistory, userProfile }) {
    const recommendations = [];

    // Based on mood patterns over the week
    const avgMood = moodHistory.length > 0 
      ? moodHistory.reduce((sum, entry) => sum + entry.mood, 0) / moodHistory.length 
      : null;

    if (avgMood && avgMood < 3) {
      // Consistently low mood - structured activities
      recommendations.push({
        type: ACTIVITY_TYPES.COUNSELING,
        title: "Weekly Counseling Session",
        description: "Schedule regular check-ins with a counselor",
        icon: "📅",
        frequency: "weekly"
      });
    }

    // Assessment-based weekly activities
    if (phq9Severity === 'moderate' || phq9Severity === 'high') {
      recommendations.push(...this.recommendations.exercise.moderate);
      recommendations.push(...this.recommendations.counseling.moderate);
    }

    return this.personalizeRecommendations(recommendations, userProfile).slice(0, 4);
  }

  /**
   * Generate long-term recommendations (this month)  
   */
  getLongTermRecommendations({ phq9Severity, gad7Severity, stressSeverity, moodHistory, userProfile }) {
    const recommendations = [];

    // Long-term habit building
    if (phq9Severity === 'moderate' || phq9Severity === 'high') {
      recommendations.push({
        type: ACTIVITY_TYPES.EXERCISE,
        title: "Regular Exercise Routine",
        description: "Build a sustainable 3x/week exercise habit",
        icon: "🏋️‍♂️",
        frequency: "3x/week",
        duration: "4 weeks"
      });
    }

    if (gad7Severity === 'moderate' || gad7Severity === 'high') {
      recommendations.push({
        type: ACTIVITY_TYPES.MINDFULNESS,
        title: "Mindfulness Course",
        description: "Complete a 4-week mindfulness program",
        icon: "🧘‍♂️",
        frequency: "daily",
        duration: "4 weeks"
      });
    }

    return this.personalizeRecommendations(recommendations, userProfile).slice(0, 3);
  }
}

export default RecommendationEngine;