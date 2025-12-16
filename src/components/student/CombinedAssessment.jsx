import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { 
  getRandomizedQuestions, 
  calculateScores, 
  COMBINED_ASSESSMENT_INFO,
  ASSESSMENT_TYPES
} from '../../data/combinedAssessment';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  HeartIcon,
  BoltIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function CombinedAssessment({ onBack }) {
  const [user] = useAuthState(auth);
  
  // Assessment state
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [scores, setScores] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Initialize questions on component mount
  useEffect(() => {
    const randomizedQuestions = getRandomizedQuestions();
    setQuestions(randomizedQuestions);
    console.log('Initialized with randomized questions:', randomizedQuestions.length);
  }, []);

  const getCurrentQuestion = () => questions[currentQuestionIndex];
  const getProgress = () => ({
    current: currentQuestionIndex + 1,
    total: questions.length,
    percentage: Math.round(((currentQuestionIndex + 1) / questions.length) * 100)
  });

  const handleAnswerSelect = (value) => {
    const currentQuestion = getCurrentQuestion();
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        value: value,
        questionText: currentQuestion.text,
        questionType: currentQuestion.type,
        category: currentQuestion.category
      }
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeAssessment = async () => {
    setIsLoading(true);
    
    try {
      // Convert answers object to array for scoring
      const responseArray = Object.values(answers);
      console.log('Calculating scores for responses:', responseArray);
      
      // Calculate scores using the combined assessment scoring
      const assessmentScores = calculateScores(responseArray);
      console.log('Assessment scores:', assessmentScores);
      
      setScores(assessmentScores);
      
      // Save to Firestore - Save each assessment separately
      if (user) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const timestamp = now.getTime();
        
        // Helper function to determine risk level
        const getRiskLevel = (severity, hasSuicidalIdeation = false) => {
          if (hasSuicidalIdeation) return 'high';
          if (severity === 'severe' || severity === 'moderately_severe') return 'high';
          if (severity === 'moderate' || severity === 'high') return 'medium';
          return 'low';
        };
        
        // Filter responses by assessment type
        const phq9Responses = responseArray.filter(r => r.questionType === 'PHQ9');
        const gad7Responses = responseArray.filter(r => r.questionType === 'GAD7');
        const pssResponses = responseArray.filter(r => r.questionType === 'PSS');
        
        console.log('📄 Saving three separate assessments:');
        console.log(`- PHQ-9: ${phq9Responses.length} responses`);
        console.log(`- GAD-7: ${gad7Responses.length} responses`);
        console.log(`- PSS-10: ${pssResponses.length} responses`);
        
        // 1. Save PHQ-9 Assessment
        const phq9Data = {
          testName: 'PHQ-9 Depression Assessment',
          score: assessmentScores.phq9.score,
          maxScore: assessmentScores.phq9.maxScore,
          severity: assessmentScores.phq9.interpretation.title,
          riskLevel: getRiskLevel(assessmentScores.phq9.severity, assessmentScores.overall.hasSuicidalIdeation),
          date: today,
          created_at: now,
          type: 'PHQ9',
          responses: phq9Responses,
          totalQuestions: phq9Responses.length,
          completionDate: now.toISOString(),
          userId: user.uid,
          hasSuicidalIdeation: assessmentScores.overall.hasSuicidalIdeation,
          interpretation: assessmentScores.phq9.interpretation,
          isClinical: true,
          isDynamic: false,
          assessmentSource: 'combined_clinical'
        };
        
        // 2. Save GAD-7 Assessment  
        const gad7Data = {
          testName: 'GAD-7 Anxiety Assessment',
          score: assessmentScores.gad7.score,
          maxScore: assessmentScores.gad7.maxScore,
          severity: assessmentScores.gad7.interpretation.title,
          riskLevel: getRiskLevel(assessmentScores.gad7.severity),
          date: today,
          created_at: now,
          type: 'GAD7',
          responses: gad7Responses,
          totalQuestions: gad7Responses.length,
          completionDate: now.toISOString(),
          userId: user.uid,
          interpretation: assessmentScores.gad7.interpretation,
          isClinical: true,
          isDynamic: false,
          assessmentSource: 'combined_clinical'
        };
        
        // 3. Save PSS-10 Assessment
        const pssData = {
          testName: 'PSS-10 Perceived Stress Scale',
          score: assessmentScores.pss.score,
          maxScore: assessmentScores.pss.maxScore,
          severity: assessmentScores.pss.interpretation.title,
          riskLevel: getRiskLevel(assessmentScores.pss.level),
          date: today,
          created_at: now,
          type: 'PSS',
          responses: pssResponses,
          totalQuestions: pssResponses.length,
          completionDate: now.toISOString(),
          userId: user.uid,
          interpretation: assessmentScores.pss.interpretation,
          isClinical: true,
          isDynamic: false,
          assessmentSource: 'combined_clinical'
        };
        
        // Save all three assessments as separate documents
        const savePromises = [
          setDoc(
            doc(db, 'users', user.uid, 'assessments', `phq9-${today}-${timestamp}`),
            phq9Data
          ),
          setDoc(
            doc(db, 'users', user.uid, 'assessments', `gad7-${today}-${timestamp + 1}`),
            gad7Data
          ),
          setDoc(
            doc(db, 'users', user.uid, 'assessments', `pss-${today}-${timestamp + 2}`),
            pssData
          )
        ];
        
        await Promise.all(savePromises);
        
        console.log('✅ All three assessments saved successfully!');
        console.log('📄 Assessment summaries:');
        console.log(`- PHQ-9: ${phq9Data.score}/${phq9Data.maxScore} (${phq9Data.severity}) - Risk: ${phq9Data.riskLevel}`);
        console.log(`- GAD-7: ${gad7Data.score}/${gad7Data.maxScore} (${gad7Data.severity}) - Risk: ${gad7Data.riskLevel}`);
        console.log(`- PSS-10: ${pssData.score}/${pssData.maxScore} (${pssData.severity}) - Risk: ${pssData.riskLevel}`);
        
        // Verify all saves
        try {
          const verifyPromises = [
            getDoc(doc(db, 'users', user.uid, 'assessments', `phq9-${today}-${timestamp}`)),
            getDoc(doc(db, 'users', user.uid, 'assessments', `gad7-${today}-${timestamp + 1}`)),
            getDoc(doc(db, 'users', user.uid, 'assessments', `pss-${today}-${timestamp + 2}`))
          ];
          
          const [phq9Doc, gad7Doc, pssDoc] = await Promise.all(verifyPromises);
          
          console.log('✅ Verification results:');
          console.log(`- PHQ-9 saved: ${phq9Doc.exists() ? 'YES' : 'NO'}`);
          console.log(`- GAD-7 saved: ${gad7Doc.exists() ? 'YES' : 'NO'}`);
          console.log(`- PSS-10 saved: ${pssDoc.exists() ? 'YES' : 'NO'}`);
          
        } catch (verifyError) {
          console.error('❌ Verification error:', verifyError);
        }
      } else {
        console.error('❌ No user found, cannot save assessments');
      }
      
      setIsCompleted(true);
      setShowResults(true);
      
    } catch (error) {
      console.error('Error completing assessment:', error);
      alert('Error saving assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Preparing your assessment...</p>
        </div>
      </div>
    );
  }

  // Results display
  if (showResults && scores) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Completion Header */}
          <div className="text-center mb-8">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
            <p className="text-gray-600">Here are your results from the comprehensive mental health assessment</p>
          </div>

          {/* Crisis Alert */}
          {scores.overall.hasSuicidalIdeation && (
            <div className="bg-red-100 border-l-4 border-red-500 p-6 mb-8">
              <div className="flex">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800">Immediate Support Available</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Your responses indicate you may be having thoughts of self-harm. Please reach out for support immediately:</p>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
                      <li><strong>National Suicide Prevention Lifeline:</strong> 988</li>
                      <li><strong>Campus Counseling:</strong> Contact your student services immediately</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overall Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <ChartBarIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{scores.overall.totalQuestions}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <HeartIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{scores.phq9.responses}</div>
                <div className="text-sm text-gray-600">Depression (PHQ-9)</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <ExclamationTriangleIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{scores.gad7.responses}</div>
                <div className="text-sm text-gray-600">Anxiety (GAD-7)</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <BoltIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{scores.pss.responses}</div>
                <div className="text-sm text-gray-600">Stress (PSS-10)</div>
              </div>
            </div>
          </div>

          {/* Individual Assessment Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* PHQ-9 Results */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <HeartIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">PHQ-9 Depression</h3>
                  <p className="text-sm text-gray-600">Patient Health Questionnaire-9</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-gray-900">{scores.phq9.score}</span>
                  <span className="text-sm text-gray-600">/ {scores.phq9.maxScore}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      scores.phq9.interpretation.color === 'green' ? 'bg-green-500' :
                      scores.phq9.interpretation.color === 'yellow' ? 'bg-yellow-500' :
                      scores.phq9.interpretation.color === 'orange' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${(scores.phq9.score / scores.phq9.maxScore) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${
                scores.phq9.interpretation.color === 'green' ? 'bg-green-50 text-green-800' :
                scores.phq9.interpretation.color === 'yellow' ? 'bg-yellow-50 text-yellow-800' :
                scores.phq9.interpretation.color === 'orange' ? 'bg-orange-50 text-orange-800' :
                'bg-red-50 text-red-800'
              }`}>
                <div className="font-medium">{scores.phq9.interpretation.title}</div>
                {scores.phq9.interpretation.actionRequired && (
                  <div className="text-sm mt-1">Professional support recommended</div>
                )}
              </div>
            </div>

            {/* GAD-7 Results */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">GAD-7 Anxiety</h3>
                  <p className="text-sm text-gray-600">Generalized Anxiety Disorder-7</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-gray-900">{scores.gad7.score}</span>
                  <span className="text-sm text-gray-600">/ {scores.gad7.maxScore}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      scores.gad7.interpretation.color === 'green' ? 'bg-green-500' :
                      scores.gad7.interpretation.color === 'yellow' ? 'bg-yellow-500' :
                      scores.gad7.interpretation.color === 'orange' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${(scores.gad7.score / scores.gad7.maxScore) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${
                scores.gad7.interpretation.color === 'green' ? 'bg-green-50 text-green-800' :
                scores.gad7.interpretation.color === 'yellow' ? 'bg-yellow-50 text-yellow-800' :
                scores.gad7.interpretation.color === 'orange' ? 'bg-orange-50 text-orange-800' :
                'bg-red-50 text-red-800'
              }`}>
                <div className="font-medium">{scores.gad7.interpretation.title}</div>
                {scores.gad7.interpretation.actionRequired && (
                  <div className="text-sm mt-1">Professional support recommended</div>
                )}
              </div>
            </div>

            {/* PSS Results */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <BoltIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">PSS-10 Stress</h3>
                  <p className="text-sm text-gray-600">Perceived Stress Scale-10</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-gray-900">{scores.pss.score}</span>
                  <span className="text-sm text-gray-600">/ {scores.pss.maxScore}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      scores.pss.interpretation.color === 'green' ? 'bg-green-500' :
                      scores.pss.interpretation.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-orange-500'
                    }`}
                    style={{ width: `${(scores.pss.score / scores.pss.maxScore) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${
                scores.pss.interpretation.color === 'green' ? 'bg-green-50 text-green-800' :
                scores.pss.interpretation.color === 'yellow' ? 'bg-yellow-50 text-yellow-800' :
                'bg-orange-50 text-orange-800'
              }`}>
                <div className="font-medium">{scores.pss.interpretation.title}</div>
                {scores.pss.interpretation.actionRequired && (
                  <div className="text-sm mt-1">Support strategies recommended</div>
                )}
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={onBack}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Back to Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Assessment in progress
  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();
  const currentAnswer = answers[currentQuestion?.id]?.value;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{COMBINED_ASSESSMENT_INFO.name}</h1>
              <p className="text-gray-600 mt-1">{COMBINED_ASSESSMENT_INFO.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Question {progress.current} of {progress.total}</div>
              <div className="text-sm text-gray-500">{progress.percentage}% Complete</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            
            {/* Question Header */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentQuestion.category === 'Depression' ? 'bg-blue-100 text-blue-800' :
                  currentQuestion.category === 'Anxiety' ? 'bg-orange-100 text-orange-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {currentQuestion.category} • {currentQuestion.type}
                </span>
                {currentQuestion.isCritical && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Important Question
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
                {currentQuestion.text}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label 
                  key={option.value} 
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    currentAnswer === option.value 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question_${currentQuestionIndex}`}
                    value={option.value}
                    checked={currentAnswer === option.value}
                    onChange={() => handleAnswerSelect(option.value)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="ml-4">
                    <div className="text-gray-900 font-medium">{option.label}</div>
                    <div className="text-gray-600 text-sm">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentAnswer === undefined || isLoading}
            className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : currentQuestionIndex === questions.length - 1 ? (
              <>
                Complete Assessment
                <CheckCircleIcon className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>

        {/* Assessment Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This assessment combines standardized clinical tools: PHQ-9, GAD-7, and PSS-10</p>
          <p className="mt-1">Questions are presented in random order for each session</p>
        </div>
      </div>
    </div>
  );
}