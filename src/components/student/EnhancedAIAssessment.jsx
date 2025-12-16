import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRecommendations } from '../../hooks/useRecommendations';
import RecommendationDisplay from './RecommendationDisplay';
import { 
  SparklesIcon, 
  ArrowPathIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  AcademicCapIcon,
  UsersIcon,
  HomeIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  FaceSmileIcon,
  ShieldExclamationIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

// Problem areas that students can select
const PROBLEM_AREAS = [
  {
    id: 'relationships',
    name: 'Relationships',
    description: 'Dating, friendships, family conflicts, social connections',
    icon: HeartIcon,
    color: 'rose',
    keywords: ['relationship', 'dating', 'friendship', 'family', 'social', 'loneliness', 'breakup']
  },
  {
    id: 'academics',
    name: 'Academics',
    description: 'Study pressure, grades, exams, course workload, time management',
    icon: AcademicCapIcon,
    color: 'blue',
    keywords: ['study', 'exam', 'grades', 'academic', 'coursework', 'deadline', 'performance']
  },
  {
    id: 'social',
    name: 'Social Life',
    description: 'Making friends, fitting in, social anxiety, peer pressure',
    icon: UsersIcon,
    color: 'purple',
    keywords: ['friends', 'social anxiety', 'peer pressure', 'fitting in', 'social skills']
  },
  {
    id: 'family',
    name: 'Family Issues',
    description: 'Family expectations, conflicts, homesickness, family pressure',
    icon: HomeIcon,
    color: 'green',
    keywords: ['family pressure', 'expectations', 'homesickness', 'parents', 'siblings']
  },
  {
    id: 'career',
    name: 'Career Concerns',
    description: 'Future planning, job anxiety, career confusion, internships',
    icon: BriefcaseIcon,
    color: 'indigo',
    keywords: ['career', 'job', 'future', 'internship', 'placement', 'career anxiety']
  },
  {
    id: 'financial',
    name: 'Financial Stress',
    description: 'Money worries, student loans, part-time work, expenses',
    icon: CurrencyDollarIcon,
    color: 'yellow',
    keywords: ['money', 'financial', 'loans', 'expenses', 'budget', 'financial stress']
  },
  {
    id: 'personal',
    name: 'Personal Issues',
    description: 'Self-esteem, body image, identity, personal growth',
    icon: FaceSmileIcon,
    color: 'pink',
    keywords: ['self-esteem', 'confidence', 'identity', 'body image', 'personal growth']
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    description: 'Physical health, sleep issues, eating, exercise, mental health',
    icon: ShieldExclamationIcon,
    color: 'emerald',
    keywords: ['health', 'sleep', 'eating', 'exercise', 'physical health', 'wellness']
  }
];

const ASSESSMENT_PHASES = {
  AREA_SELECTION: 'area_selection',
  ASSESSMENT: 'assessment',
  RESULTS: 'results'
};

const EnhancedAIAssessment = () => {
  const [user] = useAuthState(auth);
  const { recommendations, loading: recLoading, generateRecommendationsForAssessment } = useRecommendations();
  
  // Phase management
  const [currentPhase, setCurrentPhase] = useState(ASSESSMENT_PHASES.AREA_SELECTION);
  const [selectedAreas, setSelectedAreas] = useState([]);
  
  // Assessment state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [severity, setSeverity] = useState('');
  const [areaSpecificInsights, setAreaSpecificInsights] = useState({});
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGeneratingNextQuestion, setIsGeneratingNextQuestion] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const getAreaColor = (colorName) => {
    const colorMap = {
      rose: 'from-rose-500 to-rose-600',
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      indigo: 'from-indigo-500 to-indigo-600',
      yellow: 'from-yellow-500 to-yellow-600',
      pink: 'from-pink-500 to-pink-600',
      emerald: 'from-emerald-500 to-emerald-600'
    };
    return colorMap[colorName] || colorMap.blue;
  };

  const getAreaBorderColor = (colorName) => {
    const colorMap = {
      rose: 'border-rose-200 hover:border-rose-400',
      blue: 'border-blue-200 hover:border-blue-400',
      purple: 'border-purple-200 hover:border-purple-400',
      green: 'border-green-200 hover:border-green-400',
      indigo: 'border-indigo-200 hover:border-indigo-400',
      yellow: 'border-yellow-200 hover:border-yellow-400',
      pink: 'border-pink-200 hover:border-pink-400',
      emerald: 'border-emerald-200 hover:border-emerald-400'
    };
    return colorMap[colorName] || colorMap.blue;
  };

  const handleAreaToggle = (areaId) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const startAssessment = async () => {
    if (selectedAreas.length === 0) {
      setError({ type: 'error', message: 'Please select at least one area you\'d like to focus on.' });
      return;
    }

    setError(null);
    setCurrentPhase(ASSESSMENT_PHASES.ASSESSMENT);
    await generateFirstQuestion();
  };

  const generateFirstQuestion = async () => {
    try {
      setIsLoading(true);
      
      const selectedAreaData = PROBLEM_AREAS.filter(area => selectedAreas.includes(area.id));
      
      const response = await fetch('https://asia-south1-campuscare-45120.cloudfunctions.net/generateTargetedFirstQuestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedAreas: selectedAreaData,
          userId: user?.uid
        })
      });

      const data = await response.json();
      
      if (data.ok && data.question) {
        const firstQuestion = {
          id: 0,
          question: data.question,
          options: getStandardOptions(),
          type: 'ai-generated',
          category: data.category || 'targeted',
          focusArea: data.focusArea,
          questionNumber: 1
        };
        setQuestions([firstQuestion]);
      } else {
        // Fallback question based on selected areas
        const fallbackQuestion = generateFallbackQuestion();
        setQuestions([fallbackQuestion]);
      }
    } catch (error) {
      console.error('Error generating first question:', error);
      const fallbackQuestion = generateFallbackQuestion();
      setQuestions([fallbackQuestion]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackQuestion = () => {
    const areaNames = PROBLEM_AREAS
      .filter(area => selectedAreas.includes(area.id))
      .map(area => area.name.toLowerCase())
      .join(', ');
    
    return {
      id: 0,
      question: `How would you describe your current stress level regarding ${areaNames}?`,
      options: getStandardOptions(),
      type: 'fallback',
      category: 'general',
      questionNumber: 1
    };
  };

  const getStandardOptions = () => [
    { label: "Not at all stressful", value: 0 },
    { label: "Mildly stressful", value: 1 },
    { label: "Moderately stressful", value: 2 },
    { label: "Very stressful", value: 3 }
  ];

  const handleAnswerSelect = async (value) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
    
    const currentQuestion = questions[currentQuestionIndex];
    
    if (shouldContinueAssessment(newAnswers.length)) {
      await generateNextQuestion(currentQuestion, value, newAnswers);
    } else {
      setTimeout(() => {
        completeAssessment();
      }, 1000);
    }
  };

  const shouldContinueAssessment = (questionsAnswered) => {
    // Aim for 8-12 questions depending on selected areas
    const targetCount = Math.min(12, Math.max(8, selectedAreas.length * 2));
    return questionsAnswered < targetCount;
  };

  const generateNextQuestion = async (currentQuestion, selectedAnswer, allAnswers) => {
    try {
      setIsGeneratingNextQuestion(true);
      
      const conversationHistory = allAnswers.slice(0, currentQuestionIndex + 1).map((answer, index) => ({
        question: questions[index]?.question,
        answer: questions[index]?.options?.find(opt => opt.value === answer)?.label || answer,
        score: answer,
        focusArea: questions[index]?.focusArea
      }));
      
      const selectedAreaData = PROBLEM_AREAS.filter(area => selectedAreas.includes(area.id));
      
      const questionContext = {
        selectedAreas: selectedAreaData,
        currentQuestion: currentQuestion.question,
        selectedAnswer,
        answerLabel: currentQuestion.options.find(opt => opt.value === selectedAnswer)?.label || selectedAnswer,
        questionNumber: currentQuestion.questionNumber || currentQuestionIndex + 1,
        conversationHistory,
        totalQuestionsAsked: questions.length,
        targetQuestionCount: Math.min(12, Math.max(8, selectedAreas.length * 2))
      };

      const response = await fetch('https://asia-south1-campuscare-45120.cloudfunctions.net/generateTargetedContextualQuestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionContext,
          userId: user?.uid
        })
      });

      const data = await response.json();
      
      if (data.ok && data.question) {
        const aiQuestion = {
          id: questions.length,
          question: data.question,
          options: getStandardOptions(),
          type: 'ai-generated',
          context: data.context,
          category: data.category,
          focusArea: data.focusArea,
          questionNumber: questions.length + 1,
          priority: data.priority || 'normal'
        };
        
        setQuestions(prev => [...prev, aiQuestion]);
        
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
        }, 800);
      } else {
        completeAssessment();
      }
    } catch (error) {
      console.error('Error generating next question:', error);
      if (questions.length >= 5) {
        completeAssessment();
      } else {
        generateGenericFollowup();
      }
    } finally {
      setIsGeneratingNextQuestion(false);
    }
  };

  const generateGenericFollowup = () => {
    const genericQuestions = [
      "How has this been affecting your daily routine?",
      "When do you notice these feelings the most?",
      "How would you rate your ability to cope with these challenges?",
      "What support do you feel would be most helpful right now?"
    ];
    
    const randomQuestion = genericQuestions[Math.floor(Math.random() * genericQuestions.length)];
    
    const fallbackQuestion = {
      id: questions.length,
      question: randomQuestion,
      options: getStandardOptions(),
      type: 'fallback',
      category: 'followup',
      questionNumber: questions.length + 1
    };
    
    setQuestions(prev => [...prev, fallbackQuestion]);
    
    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1);
    }, 500);
  };

  const completeAssessment = async () => {
    setIsLoading(true);
    try {
      const validAnswers = answers.filter(answer => answer !== undefined && answer !== null);
      const total = validAnswers.reduce((sum, answer) => sum + answer, 0);
      const maxPossible = validAnswers.length * 3;
      const percentage = Math.round((total / maxPossible) * 100);
      
      let severityLevel;
      if (percentage >= 75) severityLevel = 'High Concern';
      else if (percentage >= 50) severityLevel = 'Moderate Concern';
      else if (percentage >= 25) severityLevel = 'Mild Concern';
      else severityLevel = 'Low Concern';
      
      setScore(total);
      setSeverity(severityLevel);
      
      // Generate comprehensive area-specific insights
      const insights = {};
      const detailedAreaAnalysis = {};
      
      selectedAreas.forEach(areaId => {
        const area = PROBLEM_AREAS.find(a => a.id === areaId);
        const areaQuestions = questions.filter(q => q.focusArea === areaId);
        const areaAnswers = areaQuestions.map((q, index) => ({ 
          questionId: q.id, 
          answer: answers[q.id], 
          questionText: q.question,
          questionType: q.type,
          questionNumber: index + 1
        })).filter(a => a.answer !== undefined);
        
        const scores = areaAnswers.map(a => a.answer);
        const areaScore = scores.length > 0 ? scores.reduce((sum, ans) => sum + ans, 0) / scores.length : 0;
        const totalAreaScore = scores.reduce((sum, ans) => sum + ans, 0);
        const maxAreaScore = scores.length * 3;
        
        // Calculate trends within this area
        const concernLevel = areaScore >= 2.5 ? 'High' : areaScore >= 1.5 ? 'Moderate' : areaScore >= 0.5 ? 'Mild' : 'Low';
        const highConcernAnswers = areaAnswers.filter(a => a.answer >= 2).length;
        const lowConcernAnswers = areaAnswers.filter(a => a.answer === 0).length;
        
        insights[areaId] = {
          name: area.name,
          score: areaScore,
          level: concernLevel,
          questionsAnswered: areaAnswers.length,
          totalScore: totalAreaScore,
          maxScore: maxAreaScore,
          percentage: maxAreaScore > 0 ? Math.round((totalAreaScore / maxAreaScore) * 100) : 0
        };
        
        // Detailed analysis for profile summary
        detailedAreaAnalysis[areaId] = {
          areaInfo: {
            id: areaId,
            name: area.name,
            description: area.description,
            keywords: area.keywords,
            color: area.color
          },
          assessment: {
            averageScore: areaScore,
            totalScore: totalAreaScore,
            maxPossibleScore: maxAreaScore,
            percentage: maxAreaScore > 0 ? Math.round((totalAreaScore / maxAreaScore) * 100) : 0,
            concernLevel: concernLevel,
            questionsAsked: areaAnswers.length,
            highConcernResponses: highConcernAnswers,
            lowConcernResponses: lowConcernAnswers
          },
          questionsAndAnswers: areaAnswers.map(qa => ({
            questionId: qa.questionId,
            questionText: qa.questionText,
            questionType: qa.questionType,
            questionNumber: qa.questionNumber,
            answer: qa.answer,
            answerLabel: getStandardOptions().find(opt => opt.value === qa.answer)?.label || 'Unknown',
            concernLevel: qa.answer >= 2.5 ? 'High' : qa.answer >= 1.5 ? 'Moderate' : qa.answer >= 0.5 ? 'Mild' : 'Low'
          })),
          aiGeneratedQuestions: areaQuestions.filter(q => q.type === 'ai-generated').length,
          fallbackQuestions: areaQuestions.filter(q => q.type === 'fallback').length
        };
      });
      
      setAreaSpecificInsights(insights);
      
      // Save to Firestore
      if (user) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const timestamp = now.getTime();
        
        // Calculate assessment completion time
        const assessmentStartTime = new Date(now.getTime() - (questions.length * 45000)); // Estimate 45 seconds per question
        const completionTime = Math.round((now.getTime() - assessmentStartTime.getTime()) / 1000); // in seconds
        
        // Generate session summary
        const sessionSummary = {
          totalTimeSpent: completionTime,
          avgTimePerQuestion: Math.round(completionTime / questions.length),
          selectedAreasCount: selectedAreas.length,
          aiGeneratedQuestions: questions.filter(q => q.type === 'ai-generated').length,
          fallbackQuestions: questions.filter(q => q.type === 'fallback').length,
          highestConcernArea: Object.entries(insights).reduce((prev, current) => 
            prev[1].score > current[1].score ? prev : current)[0],
          lowestConcernArea: Object.entries(insights).reduce((prev, current) => 
            prev[1].score < current[1].score ? prev : current)[0]
        };

        await setDoc(doc(db, 'users', user.uid, 'assessments', `targeted-ai-${today}-${timestamp}`), {
          // Basic Assessment Info
          testName: 'Targeted AI Assessment',
          assessmentType: 'targeted-ai',
          version: '2.0',
          score: total,
          maxPossible,
          percentage,
          severity: severityLevel,
          date: today,
          created_at: now,
          completed_at: now,
          userId: user.uid,
          
          // Assessment Configuration
          selectedAreas: selectedAreas.map(areaId => {
            const area = PROBLEM_AREAS.find(a => a.id === areaId);
            return {
              id: areaId,
              name: area.name,
              description: area.description,
              keywords: area.keywords,
              color: area.color
            };
          }),
          
          // Quick Insights (for dashboard/summary views)
          areaInsights: insights,
          
          // Detailed Analysis (for profile summaries)
          detailedAnalysis: detailedAreaAnalysis,
          
          // Session Information
          sessionInfo: {
            totalQuestions: questions.length,
            questionsAnswered: validAnswers.length,
            completionRate: Math.round((validAnswers.length / questions.length) * 100),
            startTime: assessmentStartTime,
            endTime: now,
            duration: completionTime,
            averageResponseTime: Math.round(completionTime / questions.length)
          },
          
          // Question Flow Analysis
          questionFlow: questions.map((q, index) => ({
            questionId: q.id,
            questionNumber: index + 1,
            questionText: q.question,
            questionType: q.type, // 'ai-generated' or 'fallback'
            category: q.category,
            focusArea: q.focusArea,
            priority: q.priority || 'normal',
            answer: validAnswers[index],
            answerLabel: q.options?.find(opt => opt.value === validAnswers[index])?.label || 'Not answered',
            concernLevel: validAnswers[index] >= 2.5 ? 'High' : validAnswers[index] >= 1.5 ? 'Moderate' : validAnswers[index] >= 0.5 ? 'Mild' : 'Low'
          })),
          
          // Assessment Summary for Profile
          profileSummary: {
            overallConcernLevel: severityLevel,
            primaryConcernAreas: Object.entries(insights)
              .filter(([_, data]) => data.level === 'High' || data.level === 'Moderate')
              .map(([areaId, data]) => ({ areaId, name: data.name, level: data.level, score: data.score })),
            strengthAreas: Object.entries(insights)
              .filter(([_, data]) => data.level === 'Low')
              .map(([areaId, data]) => ({ areaId, name: data.name, level: data.level, score: data.score })),
            keyInsights: [
              `Completed ${questions.length} targeted questions across ${selectedAreas.length} areas`,
              `Primary concerns in: ${Object.entries(insights).filter(([_, data]) => data.level === 'High').map(([_, data]) => data.name).join(', ') || 'None identified'}`,
              `${questions.filter(q => q.type === 'ai-generated').length} AI-generated personalized questions`,
              `Assessment completed in approximately ${Math.round(completionTime / 60)} minutes`
            ].filter(insight => !insight.includes('None identified') || Object.entries(insights).filter(([_, data]) => data.level === 'High').length === 0)
          },
          
          // Technical Metadata
          metadata: {
            platform: 'web',
            userAgent: navigator.userAgent,
            sessionId: `targeted-${timestamp}`,
            isDynamic: true,
            isTargeted: true,
            aiQuestionsGenerated: questions.filter(q => q.type === 'ai-generated').length > 0,
            fallbacksUsed: questions.filter(q => q.type === 'fallback').length
          }
        });
      }
      
      setCurrentPhase(ASSESSMENT_PHASES.RESULTS);
      
    } catch (error) {
      console.error('Error completing assessment:', error);
      setError({ type: 'error', message: 'Failed to process assessment. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    setShowRecommendations(true);
    if (!recommendations) {
      await generateRecommendationsForAssessment('targeted', score, selectedAreas);
    }
  };

  const resetAssessment = () => {
    setCurrentPhase(ASSESSMENT_PHASES.AREA_SELECTION);
    setSelectedAreas([]);
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSeverity('');
    setAreaSpecificInsights({});
    setError(null);
    setShowRecommendations(false);
  };

  // Area Selection Phase
  if (currentPhase === ASSESSMENT_PHASES.AREA_SELECTION) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full p-4">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Targeted Assessment</h1>
            <p className="text-xl text-gray-600 mb-2">
              Let's focus on what matters most to you right now
            </p>
            <p className="text-gray-500">
              Select the areas you'd like to explore. This helps us ask more relevant questions.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 rounded-lg border bg-yellow-50 border-yellow-200">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800">{error.message}</span>
              </div>
            </div>
          )}

          {/* Area Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
            {PROBLEM_AREAS.map((area) => {
              const Icon = area.icon;
              const isSelected = selectedAreas.includes(area.id);
              
              return (
                <div
                  key={area.id}
                  onClick={() => handleAreaToggle(area.id)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? `bg-gradient-to-r ${getAreaColor(area.color)} text-white border-transparent shadow-lg transform scale-105`
                      : `bg-white hover:bg-gray-50 ${getAreaBorderColor(area.color)} hover:shadow-md`
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      isSelected 
                        ? 'bg-white bg-opacity-20' 
                        : `bg-${area.color}-100`
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isSelected 
                          ? 'text-white' 
                          : `text-${area.color}-600`
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg mb-2 ${
                        isSelected ? 'text-white' : 'text-gray-900'
                      }`}>
                        {area.name}
                      </h3>
                      <p className={`text-sm ${
                        isSelected ? 'text-white text-opacity-90' : 'text-gray-600'
                      }`}>
                        {area.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Areas Summary */}
          {selectedAreas.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Selected Areas ({selectedAreas.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedAreas.map(areaId => {
                  const area = PROBLEM_AREAS.find(a => a.id === areaId);
                  return (
                    <span
                      key={areaId}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getAreaColor(area.color)} text-white`}
                    >
                      {area.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Start Assessment Button */}
          <div className="text-center">
            <button
              onClick={startAssessment}
              disabled={selectedAreas.length === 0 || isLoading}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Starting Assessment...
                </>
              ) : (
                <>
                  Start Targeted Assessment
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 mt-3">
              The assessment will take 5-8 minutes with personalized questions
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Assessment Phase
  if (currentPhase === ASSESSMENT_PHASES.ASSESSMENT) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = {
      current: currentQuestionIndex + 1,
      total: questions.length,
      percentage: Math.round(((currentQuestionIndex + 1) / Math.max(questions.length, 8)) * 100)
    };

    if (!currentQuestion) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <ArrowPathIcon className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Preparing your personalized questions...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Targeted Assessment</h1>
                <p className="text-gray-600 mt-1">
                  Questions focused on: {selectedAreas.map(id => 
                    PROBLEM_AREAS.find(a => a.id === id)?.name
                  ).join(', ')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Question {progress.current} of ~{Math.max(8, selectedAreas.length * 2)}</div>
                <div className="text-sm text-gray-500">{Math.min(100, progress.percentage)}% Complete</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, progress.percentage)}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {currentQuestion.type === 'ai-generated' ? '🤖 AI Generated' : 'Standard'}
                </span>
                {currentQuestion.focusArea && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {PROBLEM_AREAS.find(a => a.id === currentQuestion.focusArea)?.name}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <label 
                  key={option.value} 
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    answers[currentQuestionIndex] === option.value 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question_${currentQuestionIndex}`}
                    value={option.value}
                    checked={answers[currentQuestionIndex] === option.value}
                    onChange={() => handleAnswerSelect(option.value)}
                    className="text-indigo-600 focus:ring-indigo-500"
                    disabled={isGeneratingNextQuestion}
                  />
                  <div className="ml-4">
                    <div className="text-gray-900 font-medium">{option.label}</div>
                  </div>
                </label>
              ))}
            </div>
            
            {/* AI Generation Indicator */}
            {isGeneratingNextQuestion && (
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center text-indigo-700">
                  <ArrowPathIcon className="w-5 h-5 mr-3 animate-spin" />
                  <div>
                    <div className="font-medium">AI is analyzing your response...</div>
                    <div className="text-sm text-indigo-600">Generating your next personalized question</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                }
              }}
              disabled={currentQuestionIndex === 0}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="text-center text-gray-500 text-sm">
              {answers[currentQuestionIndex] !== undefined ? 
                'Answer recorded! Next question will appear automatically.' : 
                'Please select an answer to continue.'
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Phase
  if (currentPhase === ASSESSMENT_PHASES.RESULTS) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Completion Header */}
          <div className="text-center mb-8">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
            <p className="text-gray-600">Here are your personalized insights based on your selected areas</p>
          </div>

          {/* Overall Results */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Assessment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{score}</div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-xl font-bold text-indigo-900">{severity}</div>
                <div className="text-sm text-indigo-600">Concern Level</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">{questions.length}</div>
                <div className="text-sm text-purple-600">Questions Asked</div>
              </div>
            </div>
          </div>

          {/* Area-Specific Insights */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Area-Specific Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(areaSpecificInsights).map(([areaId, insight]) => {
                const area = PROBLEM_AREAS.find(a => a.id === areaId);
                const Icon = area?.icon || SparklesIcon;
                
                return (
                  <div key={areaId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${getAreaColor(area?.color || 'blue')}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">{insight.name}</h3>
                        <p className="text-sm text-gray-600">{insight.level} concern level</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${getAreaColor(area?.color || 'blue')}`}
                        style={{ width: `${(insight.score / 3) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Based on {insight.questionsAnswered} questions
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="text-center space-y-4">
            {!showRecommendations && (
              <button
                onClick={handleGetRecommendations}
                disabled={recLoading}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 mr-4"
              >
                {recLoading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                    Generating Recommendations...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Get Personalized Recommendations
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={resetAssessment}
              className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Take Another Assessment
            </button>
          </div>

          {/* Recommendations Display */}
          {showRecommendations && recommendations && (
            <div className="mt-8">
              <RecommendationDisplay 
                recommendations={recommendations}
                title="Your Personalized Recommendations"
                subtitle={`Based on your assessment results for: ${selectedAreas.map(id => 
                  PROBLEM_AREAS.find(a => a.id === id)?.name
                ).join(', ')}`}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default EnhancedAIAssessment;