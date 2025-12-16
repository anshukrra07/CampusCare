// Combined Standardized Assessment: PHQ-9, GAD-7, and PSS-10
// Questions presented in random order each time

export const ASSESSMENT_TYPES = {
  COMBINED: 'combined',
  AI_DYNAMIC: 'ai_dynamic'
};

// Standard response options for PHQ-9 and GAD-7 (0-3 scale)
export const CLINICAL_OPTIONS = [
  { value: 0, label: 'Not at all', description: '0 days in the past 2 weeks' },
  { value: 1, label: 'Several days', description: '1-6 days in the past 2 weeks' },
  { value: 2, label: 'More than half the days', description: '7-11 days in the past 2 weeks' },
  { value: 3, label: 'Nearly every day', description: '12-14 days in the past 2 weeks' }
];

// PSS response options (0-4 scale)
export const PSS_OPTIONS = [
  { value: 0, label: 'Never', description: 'Never experienced this' },
  { value: 1, label: 'Almost never', description: 'Very rarely experienced this' },
  { value: 2, label: 'Sometimes', description: 'Occasionally experienced this' },
  { value: 3, label: 'Fairly often', description: 'Often experienced this' },
  { value: 4, label: 'Very often', description: 'Very frequently experienced this' }
];

// PHQ-9 Questions (Depression Assessment)
export const PHQ9_QUESTIONS = [
  {
    id: 'phq9_1',
    text: 'Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?',
    type: 'PHQ9',
    domain: 'anhedonia',
    options: CLINICAL_OPTIONS,
    isCore: true,
    isCritical: false,
    category: 'Depression'
  },
  {
    id: 'phq9_2',
    text: 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
    type: 'PHQ9',
    domain: 'depressed_mood',
    options: CLINICAL_OPTIONS,
    isCore: true,
    isCritical: false,
    category: 'Depression'
  },
  {
    id: 'phq9_3',
    text: 'Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?',
    type: 'PHQ9',
    domain: 'sleep',
    options: CLINICAL_OPTIONS,
    isCore: false,
    isCritical: false,
    category: 'Depression'
  },
  {
    id: 'phq9_4',
    text: 'Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?',
    type: 'PHQ9',
    domain: 'fatigue',
    options: CLINICAL_OPTIONS,
    isCore: false,
    isCritical: false,
    category: 'Depression'
  },
  {
    id: 'phq9_5',
    text: 'Over the last 2 weeks, how often have you been bothered by poor appetite or overeating?',
    type: 'PHQ9',
    domain: 'appetite',
    options: CLINICAL_OPTIONS,
    isCore: false,
    isCritical: false,
    category: 'Depression'
  },
  {
    id: 'phq9_6',
    text: 'Over the last 2 weeks, how often have you been bothered by feeling bad about yourself - or that you are a failure or have let yourself or your family down?',
    type: 'PHQ9',
    domain: 'self_worth',
    options: CLINICAL_OPTIONS,
    isCore: false,
    isCritical: false,
    category: 'Depression'
  },
  {
    id: 'phq9_7',
    text: 'Over the last 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading the newspaper or watching television?',
    type: 'PHQ9',
    domain: 'concentration',
    options: CLINICAL_OPTIONS,
    isCore: false,
    isCritical: false,
    category: 'Depression'
  },
  {
    id: 'phq9_8',
    text: 'Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual?',
    type: 'PHQ9',
    domain: 'psychomotor',
    options: CLINICAL_OPTIONS,
    isCore: false,
    isCritical: false,
    category: 'Depression'
  },
  {
    id: 'phq9_9',
    text: 'Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead, or of hurting yourself?',
    type: 'PHQ9',
    domain: 'suicidal_ideation',
    options: CLINICAL_OPTIONS,
    isCore: false,
    isCritical: true, // This requires immediate attention
    category: 'Depression'
  }
];

// GAD-7 Questions (Anxiety Assessment)
export const GAD7_QUESTIONS = [
  {
    id: 'gad7_1',
    text: 'Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?',
    type: 'GAD7',
    domain: 'nervousness',
    options: CLINICAL_OPTIONS,
    category: 'Anxiety'
  },
  {
    id: 'gad7_2',
    text: 'Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?',
    type: 'GAD7',
    domain: 'uncontrollable_worry',
    options: CLINICAL_OPTIONS,
    category: 'Anxiety'
  },
  {
    id: 'gad7_3',
    text: 'Over the last 2 weeks, how often have you been bothered by worrying too much about different things?',
    type: 'GAD7',
    domain: 'excessive_worry',
    options: CLINICAL_OPTIONS,
    category: 'Anxiety'
  },
  {
    id: 'gad7_4',
    text: 'Over the last 2 weeks, how often have you been bothered by trouble relaxing?',
    type: 'GAD7',
    domain: 'relaxation_difficulty',
    options: CLINICAL_OPTIONS,
    category: 'Anxiety'
  },
  {
    id: 'gad7_5',
    text: 'Over the last 2 weeks, how often have you been bothered by being so restless that it is hard to sit still?',
    type: 'GAD7',
    domain: 'restlessness',
    options: CLINICAL_OPTIONS,
    category: 'Anxiety'
  },
  {
    id: 'gad7_6',
    text: 'Over the last 2 weeks, how often have you been bothered by becoming easily annoyed or irritable?',
    type: 'GAD7',
    domain: 'irritability',
    options: CLINICAL_OPTIONS,
    category: 'Anxiety'
  },
  {
    id: 'gad7_7',
    text: 'Over the last 2 weeks, how often have you been bothered by feeling afraid, as if something awful might happen?',
    type: 'GAD7',
    domain: 'fear',
    options: CLINICAL_OPTIONS,
    category: 'Anxiety'
  }
];

// PSS-10 Questions (Perceived Stress Scale)
export const PSS10_QUESTIONS = [
  {
    id: 'pss_1',
    text: 'In the last month, how often have you been upset because of something that happened unexpectedly?',
    type: 'PSS',
    domain: 'upset_unexpected',
    options: PSS_OPTIONS,
    isReverse: false,
    category: 'Stress'
  },
  {
    id: 'pss_2',
    text: 'In the last month, how often have you felt that you were unable to control the important things in your life?',
    type: 'PSS',
    domain: 'unable_control',
    options: PSS_OPTIONS,
    isReverse: false,
    category: 'Stress'
  },
  {
    id: 'pss_3',
    text: 'In the last month, how often have you felt nervous and "stressed"?',
    type: 'PSS',
    domain: 'nervous_stressed',
    options: PSS_OPTIONS,
    isReverse: false,
    category: 'Stress'
  },
  {
    id: 'pss_4',
    text: 'In the last month, how often have you felt confident about your ability to handle your personal problems?',
    type: 'PSS',
    domain: 'confident_handle',
    options: PSS_OPTIONS,
    isReverse: true, // Reverse scored
    category: 'Stress'
  },
  {
    id: 'pss_5',
    text: 'In the last month, how often have you felt that things were going your way?',
    type: 'PSS',
    domain: 'things_going_way',
    options: PSS_OPTIONS,
    isReverse: true, // Reverse scored
    category: 'Stress'
  },
  {
    id: 'pss_6',
    text: 'In the last month, how often have you found that you could not cope with all the things that you had to do?',
    type: 'PSS',
    domain: 'could_not_cope',
    options: PSS_OPTIONS,
    isReverse: false,
    category: 'Stress'
  },
  {
    id: 'pss_7',
    text: 'In the last month, how often have you been able to control irritations in your life?',
    type: 'PSS',
    domain: 'control_irritations',
    options: PSS_OPTIONS,
    isReverse: true, // Reverse scored
    category: 'Stress'
  },
  {
    id: 'pss_8',
    text: 'In the last month, how often have you felt that you were on top of things?',
    type: 'PSS',
    domain: 'on_top_things',
    options: PSS_OPTIONS,
    isReverse: true, // Reverse scored
    category: 'Stress'
  },
  {
    id: 'pss_9',
    text: 'In the last month, how often have you been angered because of things that were outside of your control?',
    type: 'PSS',
    domain: 'angered_outside_control',
    options: PSS_OPTIONS,
    isReverse: false,
    category: 'Stress'
  },
  {
    id: 'pss_10',
    text: 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?',
    type: 'PSS',
    domain: 'difficulties_piling_up',
    options: PSS_OPTIONS,
    isReverse: false,
    category: 'Stress'
  }
];

// Combine all questions
export const ALL_QUESTIONS = [
  ...PHQ9_QUESTIONS,
  ...GAD7_QUESTIONS,
  ...PSS10_QUESTIONS
];

// Function to get randomized questions
export const getRandomizedQuestions = () => {
  // Shuffle all questions randomly
  const shuffled = [...ALL_QUESTIONS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Add question numbers for display
  return shuffled.map((question, index) => ({
    ...question,
    questionNumber: index + 1,
    totalQuestions: shuffled.length
  }));
};

// Scoring functions
export const calculateScores = (responses) => {
  let phq9Score = 0;
  let gad7Score = 0;
  let pssScore = 0;
  
  const phq9Responses = [];
  const gad7Responses = [];
  const pssResponses = [];
  let hasSuicidalIdeation = false;

  responses.forEach(response => {
    const question = ALL_QUESTIONS.find(q => q.id === response.questionId);
    
    if (question.type === 'PHQ9') {
      phq9Score += response.value;
      phq9Responses.push(response);
      
      // Check for suicidal ideation
      if (question.id === 'phq9_9' && response.value > 0) {
        hasSuicidalIdeation = true;
      }
    } else if (question.type === 'GAD7') {
      gad7Score += response.value;
      gad7Responses.push(response);
    } else if (question.type === 'PSS') {
      // Handle reverse scoring for PSS
      if (question.isReverse) {
        pssScore += (4 - response.value);
      } else {
        pssScore += response.value;
      }
      pssResponses.push(response);
    }
  });

  return {
    overall: {
      totalQuestions: responses.length,
      completionDate: new Date().toISOString(),
      hasSuicidalIdeation,
      needsImmediateAttention: hasSuicidalIdeation
    },
    phq9: {
      score: phq9Score,
      maxScore: 27,
      severity: getPHQ9Severity(phq9Score),
      interpretation: getPHQ9Interpretation(phq9Score),
      responses: phq9Responses.length
    },
    gad7: {
      score: gad7Score,
      maxScore: 21,
      severity: getGAD7Severity(gad7Score),
      interpretation: getGAD7Interpretation(gad7Score),
      responses: gad7Responses.length
    },
    pss: {
      score: pssScore,
      maxScore: 40,
      level: getPSSLevel(pssScore),
      interpretation: getPSSInterpretation(pssScore),
      responses: pssResponses.length
    }
  };
};

// PHQ-9 Scoring
const getPHQ9Severity = (score) => {
  if (score >= 20) return 'severe';
  if (score >= 15) return 'moderately_severe';
  if (score >= 10) return 'moderate';
  if (score >= 5) return 'mild';
  return 'minimal';
};

const getPHQ9Interpretation = (score) => {
  const severityMap = {
    minimal: { title: 'Minimal Depression', color: 'green', actionRequired: false },
    mild: { title: 'Mild Depression', color: 'yellow', actionRequired: false },
    moderate: { title: 'Moderate Depression', color: 'orange', actionRequired: true },
    moderately_severe: { title: 'Moderately Severe Depression', color: 'red', actionRequired: true },
    severe: { title: 'Severe Depression', color: 'red', actionRequired: true, urgent: true }
  };
  return severityMap[getPHQ9Severity(score)];
};

// GAD-7 Scoring
const getGAD7Severity = (score) => {
  if (score >= 15) return 'severe';
  if (score >= 10) return 'moderate';
  if (score >= 5) return 'mild';
  return 'minimal';
};

const getGAD7Interpretation = (score) => {
  const severityMap = {
    minimal: { title: 'Minimal Anxiety', color: 'green', actionRequired: false },
    mild: { title: 'Mild Anxiety', color: 'yellow', actionRequired: false },
    moderate: { title: 'Moderate Anxiety', color: 'orange', actionRequired: true },
    severe: { title: 'Severe Anxiety', color: 'red', actionRequired: true }
  };
  return severityMap[getGAD7Severity(score)];
};

// PSS Scoring
const getPSSLevel = (score) => {
  if (score >= 27) return 'high';
  if (score >= 14) return 'moderate';
  return 'low';
};

const getPSSInterpretation = (score) => {
  const levelMap = {
    low: { title: 'Low Perceived Stress', color: 'green', actionRequired: false },
    moderate: { title: 'Moderate Perceived Stress', color: 'yellow', actionRequired: false },
    high: { title: 'High Perceived Stress', color: 'orange', actionRequired: true }
  };
  return levelMap[getPSSLevel(score)];
};

// Assessment metadata
export const COMBINED_ASSESSMENT_INFO = {
  name: 'Comprehensive Mental Health Assessment',
  description: 'Combined PHQ-9, GAD-7, and PSS-10 assessment with randomized question order',
  totalQuestions: ALL_QUESTIONS.length, // 26 total questions (9 PHQ-9 + 7 GAD-7 + 10 PSS)
  estimatedTime: '8-12 minutes',
  assessments: [
    { name: 'PHQ-9', fullName: 'Patient Health Questionnaire-9', questions: PHQ9_QUESTIONS.length },
    { name: 'GAD-7', fullName: 'Generalized Anxiety Disorder-7', questions: GAD7_QUESTIONS.length },
    { name: 'PSS-10', fullName: 'Perceived Stress Scale-10', questions: PSS10_QUESTIONS.length }
  ]
};

export default {
  ASSESSMENT_TYPES,
  ALL_QUESTIONS,
  getRandomizedQuestions,
  calculateScores,
  COMBINED_ASSESSMENT_INFO
};