import React, { useEffect, useState } from "react";
import { useRecommendations } from '../../hooks/useRecommendations';
import RecommendationDisplay from './RecommendationDisplay';
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function AssessmentForm({
  title,
  questions,
  options,
  answers,
  handleChange,
  submitted,
  calculateResult,
  score,
  severity,
  assessmentType = 'phq9' // Add assessment type prop
}) {
  const { recommendations, loading: recLoading, generateRecommendationsForAssessment } = useRecommendations();
  const [showRecommendations, setShowRecommendations] = useState(false);
  const allAnswered = Array.isArray(answers) && answers.every((a) => a !== null && a !== undefined);
  
  // Generate recommendations when assessment is submitted
  useEffect(() => {
    if (submitted && score !== null && score !== undefined) {
      generateRecommendationsForAssessment(assessmentType, score);
    }
  }, [submitted, score, assessmentType]);
  
  const handleGetRecommendations = async () => {
    setShowRecommendations(true);
    if (!recommendations) {
      await generateRecommendationsForAssessment(assessmentType, score);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>

      {!submitted ? (
        <>
          {questions.map((q, i) => (
            <div key={i} className="mb-4 p-4 bg-white rounded shadow">
              <p className="mb-2 font-medium">
                {i + 1}. {q}
              </p>
              <div className="flex flex-col gap-2">
                {options.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q${i}`}
                      value={opt.value}
                      checked={answers[i] === opt.value}
                      onChange={() => handleChange(i, opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={calculateResult}
            disabled={!allAnswered}
            className={`bg-blue-600 text-white px-4 py-2 rounded ${!allAnswered ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Submit
          </button>
        </>
      ) : (
        <div className="space-y-6">
          {/* Assessment Results */}
          <div className="p-6 bg-green-100 border border-green-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Your Assessment Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Total Score</p>
                <p className="text-2xl font-bold text-gray-900">{score}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Severity Level</p>
                <p className="text-xl font-semibold text-gray-900">{severity}</p>
              </div>
            </div>
            
            {/* Recommendations Button */}
            {!showRecommendations && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleGetRecommendations}
                  disabled={recLoading}
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
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
                <p className="text-sm text-gray-600 mt-2">
                  Get activities, exercises, and resources tailored to your results
                </p>
              </div>
            )}
          </div>
          
          {/* Recommendations Display */}
          {showRecommendations && recommendations && (
            <RecommendationDisplay 
              recommendations={recommendations}
              title="Your Personalized Recommendations"
              subtitle={recommendations.context || "Based on your assessment results and profile"}
            />
          )}
        </div>
      )}
    </div>
  );
}