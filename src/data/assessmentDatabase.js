// Comprehensive Mental Health Assessment Database
// Combines PHQ-9, GAD-7, and Stress Assessment questions in a gamified 10-question format

export const ASSESSMENT_TYPES = {
  DEPRESSION: 'depression', // PHQ-9 based
  ANXIETY: 'anxiety',       // GAD-7 based
  STRESS: 'stress',         // Stress level assessment
  MIXED: 'mixed'            // Combined assessment
};

export const QUESTION_FORMATS = {
  FREQUENCY: 'frequency',     // How often (PHQ-9/GAD-7 style)
  SEVERITY: 'severity',       // How severe/intense
  AGREEMENT: 'agreement',     // Agree/disagree scale
  IMPACT: 'impact'            // How much it affects you
};

// Standard clinical scoring for frequency questions (PHQ-9/GAD-7 style)
export const FREQUENCY_OPTIONS = [
  { value: 0, label: '🟢 Not at all', description: 'Never or almost never', points: 0, color: 'green' },
  { value: 1, label: '🟡 Several days', description: 'A few days in the past 2 weeks', points: 1, color: 'yellow' },
  { value: 2, label: '🟠 More than half the days', description: 'Most days in the past 2 weeks', points: 2, color: 'orange' },
  { value: 3, label: '🔴 Nearly every day', description: 'Almost daily for 2+ weeks', points: 3, color: 'red' }
];

// Severity scale for stress and intensity questions
export const SEVERITY_OPTIONS = [
  { value: 0, label: '🟢 Not at all severe', description: 'No impact on daily life', points: 0, color: 'green' },
  { value: 1, label: '🟡 Mildly severe', description: 'Minor impact, manageable', points: 1, color: 'yellow' },
  { value: 2, label: '🟠 Moderately severe', description: 'Noticeable impact on activities', points: 2, color: 'orange' },
  { value: 3, label: '🔴 Very severe', description: 'Significant disruption to life', points: 3, color: 'red' }
];

// Agreement scale for behavioral and cognitive questions
export const AGREEMENT_OPTIONS = [
  { value: 0, label: '🟢 Strongly disagree', description: 'This doesn\'t describe me at all', points: 0, color: 'green' },
  { value: 1, label: '🟡 Somewhat disagree', description: 'This describes me a little', points: 1, color: 'yellow' },
  { value: 2, label: '🟠 Somewhat agree', description: 'This describes me quite a bit', points: 2, color: 'orange' },
  { value: 3, label: '🔴 Strongly agree', description: 'This describes me very well', points: 3, color: 'red' }
];

// Impact scale for functional impairment
export const IMPACT_OPTIONS = [
  { value: 0, label: '🟢 No impact', description: 'Doesn\'t affect my daily activities', points: 0, color: 'green' },
  { value: 1, label: '🟡 Minor impact', description: 'Slightly affects some activities', points: 1, color: 'yellow' },
  { value: 2, label: '🟠 Moderate impact', description: 'Affects many daily activities', points: 2, color: 'orange' },
  { value: 3, label: '🔴 Major impact', description: 'Severely limits daily functioning', points: 3, color: 'red' }
];

// Comprehensive 10-question assessment bank
export const ASSESSMENT_QUESTIONS = [
  // Depression-focused questions (PHQ-9 inspired)
  {
    id: 'dep_1',
    text: "Over the past 2 weeks, how often have you felt down, depressed, or hopeless?",
    category: ASSESSMENT_TYPES.DEPRESSION,
    format: QUESTION_FORMATS.FREQUENCY,
    options: FREQUENCY_OPTIONS,
    emoji: '😔',
    clinical_ref: 'PHQ-9 Item 2',
    weight: 1.0
  },
  {
    id: 'dep_2', 
    text: "How often have you had little interest or pleasure in doing things you usually enjoy?",
    category: ASSESSMENT_TYPES.DEPRESSION,
    format: QUESTION_FORMATS.FREQUENCY,
    options: FREQUENCY_OPTIONS,
    emoji: '😐',
    clinical_ref: 'PHQ-9 Item 1',
    weight: 1.0
  },
  {
    id: 'dep_3',
    text: "How often have you had trouble falling or staying asleep, or sleeping too much?",
    category: ASSESSMENT_TYPES.DEPRESSION,
    format: QUESTION_FORMATS.FREQUENCY,
    options: FREQUENCY_OPTIONS,
    emoji: '😴',
    clinical_ref: 'PHQ-9 Item 3',
    weight: 1.0
  },
  {
    id: 'dep_4',
    text: "How often have you felt tired or had little energy?",
    category: ASSESSMENT_TYPES.DEPRESSION,
    format: QUESTION_FORMATS.FREQUENCY,
    options: FREQUENCY_OPTIONS,
    emoji: '🔋',
    clinical_ref: 'PHQ-9 Item 4',
    weight: 1.0
  },
  
  // Anxiety-focused questions (GAD-7 inspired)
  {
    id: 'anx_1',
    text: "Over the past 2 weeks, how often have you felt nervous, anxious, or on edge?",
    category: ASSESSMENT_TYPES.ANXIETY,
    format: QUESTION_FORMATS.FREQUENCY,
    options: FREQUENCY_OPTIONS,
    emoji: '😰',
    clinical_ref: 'GAD-7 Item 1',
    weight: 1.0
  },
  {
    id: 'anx_2',
    text: "How often have you been unable to stop or control your worrying?",
    category: ASSESSMENT_TYPES.ANXIETY,
    format: QUESTION_FORMATS.FREQUENCY,
    options: FREQUENCY_OPTIONS,
    emoji: '😟',
    clinical_ref: 'GAD-7 Item 2',
    weight: 1.0
  },
  {
    id: 'anx_3',
    text: "How often have you had trouble relaxing?",
    category: ASSESSMENT_TYPES.ANXIETY,
    format: QUESTION_FORMATS.FREQUENCY,
    options: FREQUENCY_OPTIONS,
    emoji: '😤',
    clinical_ref: 'GAD-7 Item 5',
    weight: 1.0
  },
  
  // Stress-focused questions
  {
    id: 'str_1',
    text: "How severe has your overall stress level been in the past 2 weeks?",
    category: ASSESSMENT_TYPES.STRESS,
    format: QUESTION_FORMATS.SEVERITY,
    options: SEVERITY_OPTIONS,
    emoji: '🤯',
    clinical_ref: 'Perceived Stress Scale',
    weight: 1.0
  },
  {
    id: 'str_2',
    text: "How much do you agree: 'I often feel overwhelmed by my responsibilities'?",
    category: ASSESSMENT_TYPES.STRESS,
    format: QUESTION_FORMATS.AGREEMENT,
    options: AGREEMENT_OPTIONS,
    emoji: '📚',
    clinical_ref: 'Stress Response Scale',
    weight: 1.0
  },
  
  // Functional impairment (important for all assessments)
  {
    id: 'imp_1',
    text: "How much have these feelings impacted your work, school, or daily activities?",
    category: ASSESSMENT_TYPES.MIXED,
    format: QUESTION_FORMATS.IMPACT,
    options: IMPACT_OPTIONS,
    emoji: '⚡',
    clinical_ref: 'Functional Impairment',
    weight: 1.2 // Weighted higher as it's clinically significant
  }
];

// Advanced question selection algorithm
export const getAssessmentQuestions = (userId, assessmentType = ASSESSMENT_TYPES.MIXED, difficulty = 'standard') => {
  try {
    let selectedQuestions = [];
    
    if (assessmentType === ASSESSMENT_TYPES.MIXED) {
      // Balanced selection across all categories
      const depQuestions = ASSESSMENT_QUESTIONS.filter(q => q.category === ASSESSMENT_TYPES.DEPRESSION);
      const anxQuestions = ASSESSMENT_QUESTIONS.filter(q => q.category === ASSESSMENT_TYPES.ANXIETY);
      const stressQuestions = ASSESSMENT_QUESTIONS.filter(q => q.category === ASSESSMENT_TYPES.STRESS);
      const impactQuestions = ASSESSMENT_QUESTIONS.filter(q => q.category === ASSESSMENT_TYPES.MIXED);
      
      // Select 4 depression, 3 anxiety, 2 stress, 1 impact = 10 total
      selectedQuestions = [
        ...shuffleArray(depQuestions).slice(0, 4),
        ...shuffleArray(anxQuestions).slice(0, 3),
        ...shuffleArray(stressQuestions).slice(0, 2),
        ...impactQuestions.slice(0, 1)
      ];
    } else {
      // Focused assessment on specific category
      const categoryQuestions = ASSESSMENT_QUESTIONS.filter(q => q.category === assessmentType);
      const impactQuestions = ASSESSMENT_QUESTIONS.filter(q => q.category === ASSESSMENT_TYPES.MIXED);
      
      selectedQuestions = [
        ...shuffleArray(categoryQuestions).slice(0, 9),
        ...impactQuestions.slice(0, 1)
      ];
    }
    
    // Shuffle the final selection to avoid predictable order
    return shuffleArray(selectedQuestions).slice(0, 10);
    
  } catch (error) {
    console.error('Error selecting assessment questions:', error);
    return ASSESSMENT_QUESTIONS.slice(0, 10); // Fallback to first 10
  }
};

// Comprehensive scoring algorithm
export const calculateAssessmentScores = (answers) => {
  try {
    let totalScore = 0;
    let depressionScore = 0;
    let anxietyScore = 0; 
    let stressScore = 0;
    let impactScore = 0;
    
    let depressionCount = 0;
    let anxietyCount = 0;
    let stressCount = 0;
    let impactCount = 0;
    
    answers.forEach(answer => {
      const question = answer.question;
      const score = answer.value * (question.weight || 1.0);
      
      totalScore += score;
      
      // Categorize scores
      switch (question.category) {
        case ASSESSMENT_TYPES.DEPRESSION:
          depressionScore += score;
          depressionCount++;
          break;
        case ASSESSMENT_TYPES.ANXIETY:
          anxietyScore += score;
          anxietyCount++;
          break;
        case ASSESSMENT_TYPES.STRESS:
          stressScore += score;
          stressCount++;
          break;
        case ASSESSMENT_TYPES.MIXED:
          impactScore += score;
          impactCount++;
          break;
      }
    });
    
    // Calculate percentages and interpretations
    const maxPossibleScore = answers.length * 3; // Max 3 points per question
    const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);
    
    return {
      totalScore: Math.round(totalScore),
      percentageScore,
      maxPossibleScore,
      categoryScores: {
        depression: {
          score: Math.round(depressionScore),
          average: depressionCount > 0 ? Math.round((depressionScore / depressionCount) * 10) / 10 : 0,
          interpretation: getDepressionInterpretation(depressionScore, depressionCount)
        },
        anxiety: {
          score: Math.round(anxietyScore),
          average: anxietyCount > 0 ? Math.round((anxietyScore / anxietyCount) * 10) / 10 : 0,
          interpretation: getAnxietyInterpretation(anxietyScore, anxietyCount)
        },
        stress: {
          score: Math.round(stressScore),
          average: stressCount > 0 ? Math.round((stressScore / stressCount) * 10) / 10 : 0,
          interpretation: getStressInterpretation(stressScore, stressCount)
        },
        impact: {
          score: Math.round(impactScore),
          interpretation: getImpactInterpretation(impactScore)
        }
      },
      overallInterpretation: getOverallInterpretation(totalScore, maxPossibleScore),
      riskLevel: getRiskLevel(totalScore, maxPossibleScore),
      recommendations: getRecommendations(totalScore, maxPossibleScore, {
        depression: depressionScore / Math.max(depressionCount, 1),
        anxiety: anxietyScore / Math.max(anxietyCount, 1), 
        stress: stressScore / Math.max(stressCount, 1),
        impact: impactScore
      })
    };
    
  } catch (error) {
    console.error('Error calculating assessment scores:', error);
    return null;
  }
};

// Clinical interpretation functions
const getDepressionInterpretation = (score, count) => {
  if (count === 0) return { level: 'unknown', description: 'No depression questions answered' };
  
  const avgScore = score / count;
  if (avgScore < 0.5) return { level: 'minimal', description: 'Minimal depression symptoms', color: 'green' };
  if (avgScore < 1.0) return { level: 'mild', description: 'Mild depression symptoms', color: 'yellow' };
  if (avgScore < 2.0) return { level: 'moderate', description: 'Moderate depression symptoms', color: 'orange' };
  return { level: 'severe', description: 'Severe depression symptoms', color: 'red' };
};

const getAnxietyInterpretation = (score, count) => {
  if (count === 0) return { level: 'unknown', description: 'No anxiety questions answered' };
  
  const avgScore = score / count;
  if (avgScore < 0.5) return { level: 'minimal', description: 'Minimal anxiety symptoms', color: 'green' };
  if (avgScore < 1.0) return { level: 'mild', description: 'Mild anxiety symptoms', color: 'yellow' };
  if (avgScore < 2.0) return { level: 'moderate', description: 'Moderate anxiety symptoms', color: 'orange' };
  return { level: 'severe', description: 'Severe anxiety symptoms', color: 'red' };
};

const getStressInterpretation = (score, count) => {
  if (count === 0) return { level: 'unknown', description: 'No stress questions answered' };
  
  const avgScore = score / count;
  if (avgScore < 0.5) return { level: 'low', description: 'Low stress levels', color: 'green' };
  if (avgScore < 1.0) return { level: 'mild', description: 'Mild stress levels', color: 'yellow' };
  if (avgScore < 2.0) return { level: 'moderate', description: 'Moderate stress levels', color: 'orange' };
  return { level: 'high', description: 'High stress levels', color: 'red' };
};

const getImpactInterpretation = (score) => {
  if (score < 1) return { level: 'minimal', description: 'Minimal functional impact', color: 'green' };
  if (score < 2) return { level: 'mild', description: 'Mild functional impact', color: 'yellow' };
  if (score < 3) return { level: 'moderate', description: 'Moderate functional impact', color: 'orange' };
  return { level: 'severe', description: 'Severe functional impact', color: 'red' };
};

const getOverallInterpretation = (score, maxScore) => {
  const percentage = (score / maxScore) * 100;
  
  if (percentage < 20) return {
    level: 'excellent',
    title: 'Excellent Mental Health',
    description: 'You\'re doing great! Your responses suggest excellent mental wellbeing.',
    color: 'green',
    emoji: '🌟'
  };
  if (percentage < 40) return {
    level: 'good',
    title: 'Good Mental Health',
    description: 'Overall good mental health with some areas for attention.',
    color: 'blue',
    emoji: '😊'
  };
  if (percentage < 60) return {
    level: 'fair',
    title: 'Fair Mental Health',
    description: 'Moderate concerns that could benefit from some support.',
    color: 'yellow',
    emoji: '😐'
  };
  if (percentage < 80) return {
    level: 'concerning',
    title: 'Concerning Symptoms',
    description: 'Significant symptoms that warrant attention and support.',
    color: 'orange',
    emoji: '😟'
  };
  return {
    level: 'severe',
    title: 'Severe Symptoms',
    description: 'Serious concerns that require immediate attention and professional support.',
    color: 'red',
    emoji: '🆘'
  };
};

const getRiskLevel = (score, maxScore) => {
  const percentage = (score / maxScore) * 100;
  
  if (percentage < 25) return { level: 'low', color: 'green' };
  if (percentage < 50) return { level: 'mild', color: 'yellow' };
  if (percentage < 75) return { level: 'moderate', color: 'orange' };
  return { level: 'high', color: 'red' };
};

const getRecommendations = (totalScore, maxScore, categoryAverages) => {
  const recommendations = [];
  const percentage = (totalScore / maxScore) * 100;
  
  // Overall recommendations
  if (percentage < 25) {
    recommendations.push({
      type: 'maintenance',
      title: 'Keep Up the Great Work! 🌟',
      description: 'Continue your healthy habits and self-care practices.',
      priority: 'low',
      icon: '✨'
    });
  } else if (percentage < 50) {
    recommendations.push({
      type: 'prevention',
      title: 'Focus on Self-Care 🧘‍♀️',
      description: 'Consider incorporating stress management techniques into your routine.',
      priority: 'medium',
      icon: '🌱'
    });
  } else {
    recommendations.push({
      type: 'intervention',
      title: 'Consider Professional Support 💬',
      description: 'Speaking with a counselor or therapist could be very beneficial.',
      priority: 'high',
      icon: '🤝'
    });
  }
  
  // Category-specific recommendations
  if (categoryAverages.depression > 1.5) {
    recommendations.push({
      type: 'depression',
      title: 'Address Mood Concerns',
      description: 'Consider activities that boost mood: exercise, social connection, pleasant activities.',
      priority: 'high',
      icon: '🌈'
    });
  }
  
  if (categoryAverages.anxiety > 1.5) {
    recommendations.push({
      type: 'anxiety',
      title: 'Manage Anxiety Symptoms',
      description: 'Try relaxation techniques, breathing exercises, and mindfulness practices.',
      priority: 'high',
      icon: '🧘‍♂️'
    });
  }
  
  if (categoryAverages.stress > 1.5) {
    recommendations.push({
      type: 'stress',
      title: 'Reduce Stress Levels',
      description: 'Identify stress triggers and develop healthy coping strategies.',
      priority: 'medium',
      icon: '🏖️'
    });
  }
  
  return recommendations;
};

// Utility functions
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Gamification elements
export const ACHIEVEMENT_BADGES = [
  {
    id: 'first_assessment',
    name: 'Mental Health Warrior',
    description: 'Completed your first comprehensive assessment',
    emoji: '🛡️',
    condition: (assessmentCount) => assessmentCount >= 1
  },
  {
    id: 'consistent_tracker',
    name: 'Consistent Tracker',
    description: 'Completed 5 assessments',
    emoji: '📊',
    condition: (assessmentCount) => assessmentCount >= 5
  },
  {
    id: 'self_aware',
    name: 'Self-Awareness Master',
    description: 'Completed 10 assessments',
    emoji: '🧠',
    condition: (assessmentCount) => assessmentCount >= 10
  },
  {
    id: 'improvement_tracker',
    name: 'Progress Tracker',
    description: 'Showed improvement over consecutive assessments',
    emoji: '📈',
    condition: (currentScore, previousScore) => currentScore < previousScore
  }
];

export const calculateGamificationRewards = (currentScore, previousScores = []) => {
  const basePoints = Math.max(50 - Math.round(currentScore), 10); // Lower scores get more points
  let bonusPoints = 0;
  let badges = [];
  
  // Consistency bonus
  if (previousScores.length > 0) {
    bonusPoints += 10;
  }
  
  // Improvement bonus
  if (previousScores.length > 0 && currentScore < previousScores[previousScores.length - 1]) {
    bonusPoints += 20;
    badges.push('improvement_tracker');
  }
  
  // Assessment count badges
  const totalAssessments = previousScores.length + 1;
  ACHIEVEMENT_BADGES.forEach(badge => {
    if (badge.condition(totalAssessments)) {
      if (!badges.includes(badge.id)) {
        badges.push(badge.id);
      }
    }
  });
  
  return {
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
    badges: badges.map(id => ACHIEVEMENT_BADGES.find(b => b.id === id)).filter(Boolean),
    level: Math.floor(totalAssessments / 5) + 1,
    progressToNextLevel: (totalAssessments % 5) / 5 * 100
  };
};

export default {
  ASSESSMENT_TYPES,
  QUESTION_FORMATS,
  ASSESSMENT_QUESTIONS,
  getAssessmentQuestions,
  calculateAssessmentScores,
  calculateGamificationRewards,
  ACHIEVEMENT_BADGES
};