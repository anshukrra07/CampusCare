// Dynamic Question Database for Daily Check-ins
// This file contains the question structure and logic for generating dynamic questionnaires

export const QUESTION_CATEGORIES = {
  WELLNESS: 'wellness',
  ACADEMIC: 'academic', 
  SOCIAL: 'social',
  PERSONAL: 'personal',
  GOALS: 'goals'
};

export const QUESTION_TYPES = {
  CHOICE: 'choice',
  SCALE: 'scale',
  TEXT: 'text',
  BOOLEAN: 'boolean'
};

// Base questions - these are the starting questions for each category
export const BASE_QUESTIONS = {
  [QUESTION_CATEGORIES.WELLNESS]: [
    {
      id: 'wellness_1',
      text: "How are you feeling physically today?",
      type: QUESTION_TYPES.CHOICE,
      options: [
        { value: 'energetic', label: '⚡ Super Energetic', points: 10 },
        { value: 'good', label: '😊 Feeling Good', points: 8 },
        { value: 'tired', label: '😴 A bit Tired', points: 5 },
        { value: 'exhausted', label: '🥱 Exhausted', points: 3 }
      ],
      emoji: '💪',
      category: QUESTION_CATEGORIES.WELLNESS
    },
    {
      id: 'wellness_2', 
      text: "How's your stress level right now?",
      type: QUESTION_TYPES.SCALE,
      min: 1,
      max: 10,
      labels: { 1: '😌 Totally Calm', 10: '😰 Very Stressed' },
      emoji: '🧘‍♀️',
      category: QUESTION_CATEGORIES.WELLNESS
    },
    {
      id: 'wellness_3',
      text: "Did you get enough sleep last night?",
      type: QUESTION_TYPES.CHOICE,
      options: [
        { value: 'perfect', label: '😴 Perfect 8+ hours', points: 10 },
        { value: 'decent', label: '😊 Pretty good 6-8 hours', points: 8 },
        { value: 'little', label: '😑 Too little 4-6 hours', points: 4 },
        { value: 'terrible', label: '🫠 Barely slept <4 hours', points: 1 }
      ],
      emoji: '🛌',
      category: QUESTION_CATEGORIES.WELLNESS
    }
  ],

  [QUESTION_CATEGORIES.ACADEMIC]: [
    {
      id: 'academic_1',
      text: "How confident do you feel about your studies today?",
      type: QUESTION_TYPES.CHOICE,
      options: [
        { value: 'very_confident', label: '🎯 Super Confident', points: 10 },
        { value: 'confident', label: '😊 Pretty Confident', points: 8 },
        { value: 'uncertain', label: '🤔 A bit Uncertain', points: 5 },
        { value: 'overwhelmed', label: '😵 Feeling Overwhelmed', points: 2 }
      ],
      emoji: '📚',
      category: QUESTION_CATEGORIES.ACADEMIC
    },
    {
      id: 'academic_2',
      text: "What's your biggest academic challenge right now?",
      type: QUESTION_TYPES.CHOICE,
      options: [
        { value: 'time_management', label: '⏰ Time Management', points: 5 },
        { value: 'difficult_subjects', label: '🧮 Difficult Subjects', points: 5 },
        { value: 'motivation', label: '💪 Staying Motivated', points: 5 },
        { value: 'none', label: '✨ No major challenges!', points: 10 }
      ],
      emoji: '🎓',
      category: QUESTION_CATEGORIES.ACADEMIC
    }
  ],

  [QUESTION_CATEGORIES.SOCIAL]: [
    {
      id: 'social_1',
      text: "How connected do you feel to others today?",
      type: QUESTION_TYPES.SCALE,
      min: 1,
      max: 10,
      labels: { 1: '😔 Very Isolated', 10: '🤗 Super Connected' },
      emoji: '👥',
      category: QUESTION_CATEGORIES.SOCIAL
    },
    {
      id: 'social_2',
      text: "Did you have any meaningful interactions today?",
      type: QUESTION_TYPES.CHOICE,
      options: [
        { value: 'many', label: '🎉 Lots of great conversations', points: 10 },
        { value: 'some', label: '😊 A few nice chats', points: 8 },
        { value: 'few', label: '🙂 Just basic interactions', points: 5 },
        { value: 'none', label: '😞 No meaningful talks', points: 2 }
      ],
      emoji: '💬',
      category: QUESTION_CATEGORIES.SOCIAL
    }
  ],

  [QUESTION_CATEGORIES.PERSONAL]: [
    {
      id: 'personal_1',
      text: "How would you describe your mood right now?",
      type: QUESTION_TYPES.CHOICE,
      options: [
        { value: 'fantastic', label: '🌟 Absolutely Fantastic', points: 10 },
        { value: 'good', label: '😊 Pretty Good', points: 8 },
        { value: 'okay', label: '😐 Just Okay', points: 5 },
        { value: 'down', label: '😔 Feeling Down', points: 2 }
      ],
      emoji: '🎭',
      category: QUESTION_CATEGORIES.PERSONAL
    },
    {
      id: 'personal_2',
      text: "What's one thing you're grateful for today?",
      type: QUESTION_TYPES.TEXT,
      placeholder: "Share something that made you smile...",
      emoji: '🙏',
      category: QUESTION_CATEGORIES.PERSONAL,
      points: 5
    }
  ],

  [QUESTION_CATEGORIES.GOALS]: [
    {
      id: 'goals_1',
      text: "How motivated do you feel about your goals today?",
      type: QUESTION_TYPES.SCALE,
      min: 1,
      max: 10,
      labels: { 1: '😑 Not motivated at all', 10: '🔥 Super motivated!' },
      emoji: '🎯',
      category: QUESTION_CATEGORIES.GOALS
    },
    {
      id: 'goals_2',
      text: "Did you make progress on any personal goals yesterday?",
      type: QUESTION_TYPES.BOOLEAN,
      trueLabel: '✅ Yes, made some progress!',
      falseLabel: '❌ No, didn\'t work on goals',
      emoji: '🚀',
      category: QUESTION_CATEGORIES.GOALS,
      points: { true: 8, false: 3 }
    }
  ]
};

// Follow-up questions based on previous answers
export const FOLLOW_UP_QUESTIONS = {
  // Wellness follow-ups
  'wellness_1_tired': {
    text: "What's making you feel tired today?",
    type: QUESTION_TYPES.CHOICE,
    options: [
      { value: 'poor_sleep', label: '😴 Didn\'t sleep well', points: 3 },
      { value: 'busy_schedule', label: '📅 Too busy lately', points: 3 },
      { value: 'stress', label: '😰 Feeling stressed', points: 3 },
      { value: 'just_woke_up', label: '🌅 Just woke up!', points: 5 }
    ],
    emoji: '🔍'
  },
  'wellness_1_exhausted': {
    text: "That sounds tough! What would help you feel better?",
    type: QUESTION_TYPES.CHOICE,
    options: [
      { value: 'rest', label: '😴 More rest/sleep', points: 5 },
      { value: 'break', label: '🏖️ Taking a break', points: 5 },
      { value: 'support', label: '🤝 Talking to someone', points: 5 },
      { value: 'exercise', label: '🏃‍♀️ Some light exercise', points: 5 }
    ],
    emoji: '💙'
  },
  'wellness_2_high_stress': { // For scale 7-10
    text: "What's your biggest source of stress right now?",
    type: QUESTION_TYPES.CHOICE,
    options: [
      { value: 'academics', label: '📚 Academic pressure', points: 3 },
      { value: 'relationships', label: '💔 Relationship issues', points: 3 },
      { value: 'future', label: '🔮 Future uncertainty', points: 3 },
      { value: 'health', label: '🏥 Health concerns', points: 3 }
    ],
    emoji: '🎯'
  },

  // Academic follow-ups
  'academic_1_overwhelmed': {
    text: "Let's break this down. What would help you feel more in control?",
    type: QUESTION_TYPES.CHOICE,
    options: [
      { value: 'planning', label: '📝 Better planning/organization', points: 5 },
      { value: 'help', label: '🙋‍♀️ Getting help/tutoring', points: 5 },
      { value: 'break', label: '☕ Taking regular breaks', points: 5 },
      { value: 'counseling', label: '💬 Talking to counselor', points: 5 }
    ],
    emoji: '🛠️'
  },
  'academic_2_time_management': {
    text: "Time management is tricky! What's your biggest time challenge?",
    type: QUESTION_TYPES.CHOICE,
    options: [
      { value: 'procrastination', label: '⏳ Procrastination', points: 3 },
      { value: 'too_much', label: '📚 Too many commitments', points: 3 },
      { value: 'distractions', label: '📱 Getting distracted', points: 3 },
      { value: 'planning', label: '🗓️ Poor planning', points: 3 }
    ],
    emoji: '⏰'
  },

  // Social follow-ups
  'social_1_low_connection': { // For scale 1-4
    text: "Feeling disconnected can be hard. What might help you connect?",
    type: QUESTION_TYPES.CHOICE,
    options: [
      { value: 'reach_out', label: '📞 Reaching out to friends', points: 5 },
      { value: 'new_activity', label: '🎯 Joining new activities', points: 5 },
      { value: 'counseling', label: '💬 Talking to a counselor', points: 5 },
      { value: 'self_care', label: '🛁 Focusing on self-care first', points: 5 }
    ],
    emoji: '🌱'
  },
  'social_2_none': {
    text: "That's okay! What would make social connections easier for you?",
    type: QUESTION_TYPES.CHOICE,
    options: [
      { value: 'confidence', label: '💪 More confidence', points: 4 },
      { value: 'opportunities', label: '🚪 More opportunities', points: 4 },
      { value: 'energy', label: '⚡ More energy', points: 4 },
      { value: 'skills', label: '🗣️ Better social skills', points: 4 }
    ],
    emoji: '🔧'
  },

  // Personal follow-ups
  'personal_1_down': {
    text: "I hear you. What usually helps lift your spirits?",
    type: QUESTION_TYPES.CHOICE,
    options: [
      { value: 'music', label: '🎵 Listening to music', points: 5 },
      { value: 'nature', label: '🌳 Spending time in nature', points: 5 },
      { value: 'friends', label: '👥 Talking to friends', points: 5 },
      { value: 'exercise', label: '🏃‍♀️ Physical activity', points: 5 },
      { value: 'creative', label: '🎨 Creative activities', points: 5 }
    ],
    emoji: '🌈'
  },

  // Goals follow-ups
  'goals_1_low_motivation': { // For scale 1-4
    text: "Low motivation happens to everyone. What usually gets you going?",
    type: QUESTION_TYPES.CHOICE,
    options: [
      { value: 'small_wins', label: '🏆 Small wins and progress', points: 5 },
      { value: 'accountability', label: '👥 Accountability partner', points: 5 },
      { value: 'rewards', label: '🎁 Rewarding myself', points: 5 },
      { value: 'why', label: '🎯 Remembering my why', points: 5 }
    ],
    emoji: '🔥'
  },
  'goals_2_false': {
    text: "No worries! What's one small step you could take today?",
    type: QUESTION_TYPES.TEXT,
    placeholder: "Even 5 minutes counts...",
    emoji: '👟',
    points: 5
  }
};

// Function to get the first question for the day (can be influenced by yesterday's last question)
export const getDailyQuestion = (userId, date, previousQuestionData = null) => {
  try {
    // If we have previous question data, use it to influence today's question
    if (previousQuestionData) {
      const contextQuestion = getContextBasedQuestion(previousQuestionData);
      if (contextQuestion) {
        console.log('Using context-based question from previous day');
        return contextQuestion;
      }
    }
    
    // Default behavior: Use user ID and date to create a deterministic but varied selection
    const seed = hashString(userId + date);
    const categories = Object.keys(QUESTION_CATEGORIES);
    
    if (categories.length === 0) {
      console.error('No question categories available');
      return null;
    }
    
    const selectedCategoryKey = categories[seed % categories.length];
    const selectedCategory = QUESTION_CATEGORIES[selectedCategoryKey];
    const categoryQuestions = BASE_QUESTIONS[selectedCategory];
    
    if (!categoryQuestions || categoryQuestions.length === 0) {
      console.error('No questions found for category:', selectedCategory);
      // Fall back to wellness questions
      const fallbackQuestions = BASE_QUESTIONS['wellness'];
      if (fallbackQuestions && fallbackQuestions.length > 0) {
        return fallbackQuestions[0];
      }
      return null;
    }
    
    const questionIndex = Math.floor(seed / categories.length) % categoryQuestions.length;
    return categoryQuestions[questionIndex];
  } catch (error) {
    console.error('Error in getDailyQuestion:', error);
    // Return a fallback question
    const fallbackQuestions = BASE_QUESTIONS['wellness'];
    return fallbackQuestions && fallbackQuestions.length > 0 ? fallbackQuestions[0] : null;
  }
};

// Function to get follow-up question based on previous answer
export const getFollowUpQuestion = (questionId, answer, answerValue) => {
  // Generate follow-up key based on question and answer
  let followUpKey = null;
  
  if (questionId.includes('wellness_1') && ['tired', 'exhausted'].includes(answerValue)) {
    followUpKey = `${questionId}_${answerValue}`;
  } else if (questionId.includes('wellness_2') && answerValue >= 7) {
    followUpKey = 'wellness_2_high_stress';
  } else if (questionId.includes('academic_1') && answerValue === 'overwhelmed') {
    followUpKey = 'academic_1_overwhelmed';
  } else if (questionId.includes('academic_2') && answerValue === 'time_management') {
    followUpKey = 'academic_2_time_management';
  } else if (questionId.includes('social_1') && answerValue <= 4) {
    followUpKey = 'social_1_low_connection';
  } else if (questionId.includes('social_2') && answerValue === 'none') {
    followUpKey = 'social_2_none';
  } else if (questionId.includes('personal_1') && answerValue === 'down') {
    followUpKey = 'personal_1_down';
  } else if (questionId.includes('goals_1') && answerValue <= 4) {
    followUpKey = 'goals_1_low_motivation';
  } else if (questionId.includes('goals_2') && answerValue === false) {
    followUpKey = 'goals_2_false';
  }
  
  return followUpKey ? FOLLOW_UP_QUESTIONS[followUpKey] : null;
};

// Get third question based on first two answers
export const getThirdQuestion = (firstAnswer, secondAnswer) => {
  // Logic for selecting third question based on pattern of first two
  const firstCategory = firstAnswer.question.category;
  const firstValue = firstAnswer.value;
  const secondValue = secondAnswer.value;
  
  // If user seems to be struggling, ask about support
  const strugglingIndicators = ['exhausted', 'overwhelmed', 'down', 'none', 'terrible'];
  const isStruggling = strugglingIndicators.some(indicator => 
    firstValue === indicator || secondValue === indicator
  ) || (typeof firstValue === 'number' && firstValue >= 8) || 
      (typeof secondValue === 'number' && secondValue >= 8);
  
  if (isStruggling) {
    return {
      id: 'support_question',
      text: "It sounds like things might be challenging. What kind of support would be most helpful?",
      type: QUESTION_TYPES.CHOICE,
      options: [
        { value: 'counselor', label: '💬 Talk to a counselor', points: 8 },
        { value: 'friend', label: '👥 Chat with friends', points: 6 },
        { value: 'family', label: '🏠 Connect with family', points: 6 },
        { value: 'self_care', label: '🛁 Focus on self-care', points: 6 },
        { value: 'no_support', label: '💪 I can handle it myself', points: 4 }
      ],
      emoji: '🤝',
      category: 'support'
    };
  }
  
  // If user is doing well, ask about goals/growth
  return {
    id: 'growth_question',
    text: "You seem to be doing well! What's one area where you'd like to grow?",
    type: QUESTION_TYPES.CHOICE,
    options: [
      { value: 'academic', label: '📚 Academic skills', points: 8 },
      { value: 'social', label: '👥 Social connections', points: 8 },
      { value: 'wellness', label: '💪 Physical/mental wellness', points: 8 },
      { value: 'creative', label: '🎨 Creative pursuits', points: 8 },
      { value: 'leadership', label: '👑 Leadership abilities', points: 8 }
    ],
    emoji: '🌱',
    category: 'growth'
  };
};

// Simple hash function for deterministic randomness
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate a question based on previous day's last question and answer
export const getContextBasedQuestion = (previousData) => {
  try {
    const { question, answer } = previousData;
    
    if (!question || answer === undefined || answer === null) {
      return null;
    }
    
    // Context questions based on previous day's final answer
    const contextQuestions = {
      // Wellness follow-ups for next day
      'wellness_1': {
        'energetic': {
          id: 'followup_wellness_energy',
          text: "Yesterday you were feeling energetic. How has your energy been today?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'still_high', label: '⚡ Still going strong!', points: 10 },
            { value: 'moderate', label: '😊 Back to normal levels', points: 8 },
            { value: 'lower', label: '😴 Lower than yesterday', points: 5 }
          ],
          emoji: '🔋',
          category: QUESTION_CATEGORIES.WELLNESS
        },
        'exhausted': {
          id: 'followup_wellness_rest',
          text: "Yesterday you mentioned feeling exhausted. Were you able to get some rest?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'yes_better', label: '😌 Yes, feeling much better', points: 10 },
            { value: 'some', label: '🙂 Got some rest, still recovering', points: 6 },
            { value: 'no', label: '😩 No, still exhausted', points: 3 }
          ],
          emoji: '🛌',
          category: QUESTION_CATEGORIES.WELLNESS
        }
      },
      
      // Academic follow-ups
      'academic_1': {
        'overwhelmed': {
          id: 'followup_academic_overwhelm',
          text: "Yesterday you felt overwhelmed with studies. How are you managing today?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'better', label: '✅ Much better, got organized', points: 10 },
            { value: 'same', label: '😐 About the same', points: 5 },
            { value: 'worse', label: '😵 Falling further behind', points: 3 }
          ],
          emoji: '📚',
          category: QUESTION_CATEGORIES.ACADEMIC
        }
      },
      
      // Social follow-ups
      'social_1': {
        1: {
          id: 'followup_social_isolation',
          text: "Yesterday you indicated feeling very isolated. Have you connected with anyone today?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'yes_meaningful', label: '🤝 Yes, had meaningful interaction', points: 10 },
            { value: 'yes_brief', label: '👋 Just brief contact', points: 6 },
            { value: 'no', label: '🔕 No, still feeling isolated', points: 3 }
          ],
          emoji: '👥',
          category: QUESTION_CATEGORIES.SOCIAL
        },
        10: {
          id: 'followup_social_connection',
          text: "Yesterday you felt very socially connected. How have your social interactions been today?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'still_great', label: '🎉 Still very social', points: 10 },
            { value: 'less', label: '🙂 Fewer interactions today', points: 7 },
            { value: 'none', label: '😶 Needed some alone time', points: 5 }
          ],
          emoji: '🎭',
          category: QUESTION_CATEGORIES.SOCIAL
        }
      },
      
      // Personal mood follow-ups
      'personal_1': {
        'down': {
          id: 'followup_mood_down',
          text: "Yesterday you mentioned feeling down. How's your mood today?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'better', label: '☀️ Feeling better today', points: 10 },
            { value: 'same', label: '😐 About the same', points: 5 },
            { value: 'worse', label: '☁️ Still feeling low', points: 3 }
          ],
          emoji: '🌤️',
          category: QUESTION_CATEGORIES.PERSONAL
        },
        'fantastic': {
          id: 'followup_mood_great',
          text: "Yesterday you were feeling fantastic. Has anything specific helped maintain your positive mood?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'self_care', label: '🧘 Self-care activities', points: 8 },
            { value: 'accomplishment', label: '🏆 Accomplishing goals', points: 8 },
            { value: 'connection', label: '👥 Social connections', points: 8 },
            { value: 'external', label: '🌟 External events', points: 8 }
          ],
          emoji: '😃',
          category: QUESTION_CATEGORIES.PERSONAL
        }
      },
      
      // Goals follow-ups
      'goals_1': {
        10: {
          id: 'followup_goals_motivated',
          text: "Yesterday you were highly motivated about your goals. Did you make progress on any of them?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'yes_significant', label: '🚀 Yes, significant progress', points: 10 },
            { value: 'yes_some', label: '👍 Yes, small steps forward', points: 8 },
            { value: 'no', label: '🙁 No, got sidetracked', points: 5 }
          ],
          emoji: '🎯',
          category: QUESTION_CATEGORIES.GOALS
        }
      },
      
      // Third question (support) follow-ups
      'support_question': {
        'counselor': {
          id: 'followup_support_counselor',
          text: "Yesterday you mentioned wanting to talk to a counselor. Have you taken steps to connect with one?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'yes_appointment', label: '📅 Yes, made an appointment', points: 10 },
            { value: 'yes_research', label: '🔍 Looking into options', points: 8 },
            { value: 'no', label: '⏱️ Not yet', points: 5 }
          ],
          emoji: '💬',
          category: 'support'
        },
        'self_care': {
          id: 'followup_support_selfcare',
          text: "Yesterday you prioritized self-care. What self-care activity has been most helpful?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'rest', label: '😴 Rest/sleep', points: 8 },
            { value: 'exercise', label: '🏃‍♀️ Physical activity', points: 8 },
            { value: 'mindfulness', label: '🧘 Mindfulness/meditation', points: 8 },
            { value: 'hobbies', label: '🎨 Creative hobbies', points: 8 }
          ],
          emoji: '🌱',
          category: 'support'
        }
      },
      
      // Growth question follow-ups
      'growth_question': {
        'academic': {
          id: 'followup_growth_academic',
          text: "Yesterday you expressed interest in growing academically. What specific academic skill do you most want to improve?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'time_management', label: '⏰ Time management', points: 8 },
            { value: 'studying', label: '📝 Study techniques', points: 8 },
            { value: 'focus', label: '🔍 Focus/concentration', points: 8 },
            { value: 'writing', label: '✏️ Writing skills', points: 8 }
          ],
          emoji: '📚',
          category: 'growth'
        },
        'social': {
          id: 'followup_growth_social',
          text: "Yesterday you wanted to grow your social connections. What's one step you could take this week?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'club', label: '🏫 Join a club/group', points: 8 },
            { value: 'event', label: '🎉 Attend a social event', points: 8 },
            { value: 'reach_out', label: '📱 Reach out to someone', points: 8 },
            { value: 'volunteer', label: '🤝 Volunteer', points: 8 }
          ],
          emoji: '👥',
          category: 'growth'
        }
      }
    };
    
    // Find the right context question based on question id and answer
    const questionsForId = contextQuestions[question.id];
    if (questionsForId) {
      const contextQuestion = questionsForId[answer];
      return contextQuestion || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating context-based question:', error);
    return null;
  }
};

// Calculate points based on question type and answer
export const calculatePoints = (question, answer) => {
  if (question.type === QUESTION_TYPES.CHOICE) {
    const option = question.options?.find(opt => opt.value === answer);
    return option?.points || 0;
  } else if (question.type === QUESTION_TYPES.SCALE) {
    // For scale questions, give points based on value (higher = better)
    return Math.max(1, Math.ceil(answer / 2));
  } else if (question.type === QUESTION_TYPES.BOOLEAN) {
    return question.points?.[answer] || (answer ? 5 : 2);
  } else if (question.type === QUESTION_TYPES.TEXT) {
    return question.points || 5;
  }
  return 0;
};

export default {
  QUESTION_CATEGORIES,
  QUESTION_TYPES,
  BASE_QUESTIONS,
  FOLLOW_UP_QUESTIONS,
  getDailyQuestion,
  getFollowUpQuestion,
  getThirdQuestion,
  getContextBasedQuestion,
  calculatePoints
};
