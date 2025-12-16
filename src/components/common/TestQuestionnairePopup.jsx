import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  StarIcon,
  TrophyIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { 
  getDailyQuestion, 
  getFollowUpQuestion, 
  getThirdQuestion, 
  calculatePoints,
  getContextBasedQuestion,
  QUESTION_TYPES,
  BASE_QUESTIONS,
  QUESTION_CATEGORIES 
} from '../../data/questionDatabase';

const TestQuestionnairePopup = ({ onClose, onComplete, testScenario, testCounter }) => {
  const [user] = useAuthState(auth);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(1);
  const [showSummary, setShowSummary] = useState(false);
  const [animationState, setAnimationState] = useState('entering');

  useEffect(() => {
    if (user) {
      initializeQuestionnaire();
    }
  }, [user, testScenario, testCounter]);

  // Test scenarios for different question types
  const getTestScenarios = () => {
    return {
      'random': null, // Use normal random selection
      'wellness_tired': {
        question: {
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
          category: 'wellness'
        }
      },
      'academic_overwhelmed': {
        question: {
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
          category: 'academic'
        }
      },
      'social_scale': {
        question: {
          id: 'social_1',
          text: "How connected do you feel to others today?",
          type: QUESTION_TYPES.SCALE,
          min: 1,
          max: 10,
          labels: { 1: '😔 Very Isolated', 10: '🤗 Super Connected' },
          emoji: '👥',
          category: 'social'
        }
      },
      'personal_down': {
        question: {
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
          category: 'personal'
        }
      },
      'with_context': {
        previousData: {
          question: { id: 'wellness_1', category: 'wellness' },
          answer: 'exhausted'
        }
      }
    };
  };

  const initializeQuestionnaire = async () => {
    try {
      // Create a unique test date to avoid conflicts
      const testDate = `test-${Date.now()}-${testCounter}`;
      
      const scenarios = getTestScenarios();
      const currentScenario = scenarios[testScenario];
      
      let firstQuestion;
      
      if (testScenario === 'with_context' && currentScenario?.previousData) {
        // Test context-based questions
        firstQuestion = getDailyQuestion(user.uid, testDate, currentScenario.previousData);
        console.log('Testing with previous context:', currentScenario.previousData);
      } else if (currentScenario?.question) {
        // Use specific test question
        firstQuestion = currentScenario.question;
        console.log('Testing specific scenario:', testScenario);
      } else {
        // Use random question but with unique test date
        firstQuestion = getDailyQuestion(user.uid, testDate);
        console.log('Testing random question with test date:', testDate);
      }
      
      if (!firstQuestion) {
        console.error('Could not get test question');
        onClose();
        return;
      }
      
      setQuestions([firstQuestion]);
      
      // Set random streak for testing
      setStreak(Math.floor(Math.random() * 10) + 1);
      
      setTimeout(() => setAnimationState('active'), 100);
    } catch (error) {
      console.error('Error initializing test questionnaire:', error);
      onClose();
    }
  };

  const generateComplementaryQuestion = (firstQuestion) => {
    const category = firstQuestion.category;
    
    const complementaryQuestions = {
      [QUESTION_CATEGORIES.WELLNESS]: [
        {
          id: 'complementary_academic',
          text: "How confident are you feeling about your academic workload right now?",
          type: QUESTION_TYPES.SCALE,
          min: 1,
          max: 10,
          labels: { 1: '😰 Very overwhelmed', 10: '💪 Totally in control' },
          emoji: '📚',
          category: QUESTION_CATEGORIES.ACADEMIC
        }
      ],
      [QUESTION_CATEGORIES.ACADEMIC]: [
        {
          id: 'complementary_social',
          text: "How supported do you feel by your friends and family?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'very_supported', label: '🤗 Very supported', points: 10 },
            { value: 'somewhat', label: '🙂 Somewhat supported', points: 7 },
            { value: 'little', label: '😐 Little support', points: 4 },
            { value: 'alone', label: '😔 Feel quite alone', points: 2 }
          ],
          emoji: '👥',
          category: QUESTION_CATEGORIES.SOCIAL
        }
      ],
      [QUESTION_CATEGORIES.SOCIAL]: [
        {
          id: 'complementary_wellness',
          text: "How well are you taking care of your physical health lately?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'excellent', label: '💪 Excellent - exercise, sleep, nutrition', points: 10 },
            { value: 'good', label: '😊 Pretty good overall', points: 8 },
            { value: 'okay', label: '😐 Could be better', points: 5 },
            { value: 'poor', label: '😓 Not taking good care', points: 3 }
          ],
          emoji: '🏃‍♀️',
          category: QUESTION_CATEGORIES.WELLNESS
        }
      ],
      [QUESTION_CATEGORIES.PERSONAL]: [
        {
          id: 'complementary_goals',
          text: "How clear do you feel about your short-term goals (next 1-3 months)?",
          type: QUESTION_TYPES.CHOICE,
          options: [
            { value: 'very_clear', label: '🎯 Very clear and focused', points: 10 },
            { value: 'somewhat', label: '🤔 Somewhat clear', points: 7 },
            { value: 'unclear', label: '😕 Pretty unclear', points: 4 },
            { value: 'lost', label: '😵 Completely lost', points: 2 }
          ],
          emoji: '🗺️',
          category: QUESTION_CATEGORIES.GOALS
        }
      ],
      [QUESTION_CATEGORIES.GOALS]: [
        {
          id: 'complementary_personal',
          text: "How would you describe your overall life satisfaction right now?",
          type: QUESTION_TYPES.SCALE,
          min: 1,
          max: 10,
          labels: { 1: '😞 Very dissatisfied', 10: '😄 Extremely satisfied' },
          emoji: '💝',
          category: QUESTION_CATEGORIES.PERSONAL
        }
      ]
    };
    
    const complementaryOptions = complementaryQuestions[category];
    if (complementaryOptions && complementaryOptions.length > 0) {
      return complementaryOptions[0];
    }
    
    return {
      id: 'complementary_general',
      text: "On a scale of 1-10, how are you feeling overall today?",
      type: QUESTION_TYPES.SCALE,
      min: 1,
      max: 10,
      labels: { 1: '😔 Really struggling', 10: '🌟 Feeling fantastic' },
      emoji: '💫',
      category: 'general'
    };
  };

  const handleAnswer = (answer) => {
    setCurrentAnswer(answer);
  };

  const handleNext = async () => {
    if (!currentAnswer && currentAnswer !== 0 && currentAnswer !== false) return;

    const currentQuestion = questions[currentQuestionIndex];
    const answerData = {
      question: currentQuestion,
      value: currentAnswer,
      timestamp: new Date().toISOString()
    };

    const newAnswers = [...answers, answerData];
    setAnswers(newAnswers);

    const points = calculatePoints(currentQuestion, currentAnswer);
    setTotalPoints(prev => prev + points);

    if (currentQuestionIndex === 0) {
      const followUp = getFollowUpQuestion(currentQuestion.id, answerData, currentAnswer);
      let secondQuestion;
      
      if (followUp) {
        secondQuestion = followUp;
      } else {
        secondQuestion = generateComplementaryQuestion(currentQuestion);
      }
      
      setQuestions(prev => [...prev, secondQuestion]);
      setCurrentQuestionIndex(1);
      setCurrentAnswer('');
      return;
      
    } else if (currentQuestionIndex === 1) {
      const thirdQuestion = getThirdQuestion(newAnswers[0], newAnswers[1]);
      setQuestions(prev => [...prev, thirdQuestion]);
      setCurrentQuestionIndex(2);
      setCurrentAnswer('');
      return;
      
    } else if (currentQuestionIndex === 2) {
      await completeQuestionnaire(newAnswers, totalPoints + points);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setCurrentAnswer(answers[currentQuestionIndex - 1]?.value || '');
      setAnswers(prev => prev.slice(0, -1));
      const pointsToRemove = calculatePoints(questions[currentQuestionIndex], currentAnswer);
      setTotalPoints(prev => prev - pointsToRemove);
    }
  };

  const completeQuestionnaire = async (finalAnswers, finalPoints) => {
    setIsSubmitting(true);
    
    try {
      // For testing, we'll save with a test prefix to avoid conflicts
      const testDate = `test-${Date.now()}`;
      const lastAnswer = finalAnswers[finalAnswers.length - 1];
      
      // Save test data (optional - you might want to skip this for tests)
      // await setDoc(doc(db, 'users', user.uid, 'questionnaire', testDate), {
      //   answers: finalAnswers,
      //   totalPoints: finalPoints,
      //   completedAt: serverTimestamp(),
      //   streak: streak,
      //   testMode: true,
      //   testScenario: testScenario
      // });

      console.log('Test questionnaire completed:', {
        scenario: testScenario,
        answers: finalAnswers.map(a => ({ question: a.question.text, answer: a.value })),
        totalPoints: finalPoints,
        streak: streak
      });

      setShowSummary(true);
      
      setTimeout(() => {
        onComplete?.(finalAnswers, finalPoints, streak);
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Error saving test questionnaire:', error);
      alert('Test completed but failed to save. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAnimationState('leaving');
    setTimeout(onClose, 300);
  };

  const renderQuestion = (question) => {
    switch (question.type) {
      case QUESTION_TYPES.CHOICE:
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                  currentAnswer === option.value
                    ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 font-medium">{option.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">+{option.points}pts</span>
                    <StarIcon className={`w-4 h-4 ${currentAnswer === option.value ? 'text-yellow-500' : 'text-gray-300'}`} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        );

      case QUESTION_TYPES.SCALE:
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>{question.labels[question.min]}</span>
              <span>{question.labels[question.max]}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={question.min}
                max={question.max}
                value={currentAnswer || question.min}
                onChange={(e) => handleAnswer(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((currentAnswer || question.min) - question.min) / (question.max - question.min) * 100}%, #E5E7EB ${((currentAnswer || question.min) - question.min) / (question.max - question.min) * 100}%, #E5E7EB 100%)`
                }}
              />
              <div className="flex justify-center mt-4">
                <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-lg font-bold">
                  {currentAnswer || question.min}
                </div>
              </div>
            </div>
          </div>
        );

      case QUESTION_TYPES.BOOLEAN:
        return (
          <div className="space-y-3">
            <button
              onClick={() => handleAnswer(true)}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                currentAnswer === true
                  ? 'border-green-500 bg-green-50 shadow-lg transform scale-105'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-800 font-medium">{question.trueLabel}</span>
                <StarIcon className={`w-4 h-4 ${currentAnswer === true ? 'text-yellow-500' : 'text-gray-300'}`} />
              </div>
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                currentAnswer === false
                  ? 'border-red-500 bg-red-50 shadow-lg transform scale-105'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-800 font-medium">{question.falseLabel}</span>
                <StarIcon className={`w-4 h-4 ${currentAnswer === false ? 'text-yellow-500' : 'text-gray-300'}`} />
              </div>
            </button>
          </div>
        );

      case QUESTION_TYPES.TEXT:
        return (
          <div className="space-y-4">
            <textarea
              value={currentAnswer || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder={question.placeholder || 'Type your answer...'}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none h-24"
              maxLength={200}
            />
            <div className="text-right text-sm text-gray-400">
              {(currentAnswer || '').length}/200
            </div>
          </div>
        );

      default:
        return <div>Unknown question type</div>;
    }
  };

  if (showSummary) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center animate-bounce">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Test Complete!</h2>
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-center space-x-2">
              <StarIcon className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-semibold">{totalPoints} points earned!</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <TrophyIcon className="w-5 h-5 text-orange-500" />
              <span className="text-lg font-semibold">{streak} day streak!</span>
            </div>
            <div className="text-sm text-gray-600 mt-4">
              Test Scenario: <span className="font-medium">{testScenario}</span>
            </div>
          </div>
          <p className="text-gray-600">
            Check the console for detailed test results!
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        animationState === 'entering' ? 'scale-95 opacity-0' :
        animationState === 'active' ? 'scale-100 opacity-100' :
        'scale-95 opacity-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{currentQuestion?.emoji || '💭'}</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">TEST: Daily Check-in</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Question {currentQuestionIndex + 1}/3</span>
                </span>
                <span className="flex items-center space-x-1">
                  <TrophyIcon className="w-4 h-4" />
                  <span>{streak} day streak</span>
                </span>
                <span className="flex items-center space-x-1">
                  <StarIcon className="w-4 h-4" />
                  <span>{totalPoints} pts</span>
                </span>
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Scenario: {testScenario}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentQuestionIndex + 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          {currentQuestion && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {currentQuestion.text}
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {currentQuestion.category} • {currentQuestion.type}
                </p>
              </div>

              {renderQuestion(currentQuestion)}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={handleBack}
                  disabled={currentQuestionIndex === 0}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentQuestionIndex === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleNext}
                  disabled={!currentAnswer && currentAnswer !== 0 && currentAnswer !== false || isSubmitting}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all transform ${
                    (!currentAnswer && currentAnswer !== 0 && currentAnswer !== false) || isSubmitting
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg hover:scale-105'
                  }`}
                >
                  <span>
                    {isSubmitting ? 'Saving...' : 
                     currentQuestionIndex === 2 ? 'Complete' : 'Next'}
                  </span>
                  {!isSubmitting && <ArrowRightIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestQuestionnairePopup;