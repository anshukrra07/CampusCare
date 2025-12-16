import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CombinedAssessment from "./CombinedAssessment";
import {
  ChartBarIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";

export default function Assessments() {
  const navigate = useNavigate();
  const [showCombinedAssessment, setShowCombinedAssessment] = useState(false);

  const handleStartCombinedAssessment = () => {
    setShowCombinedAssessment(true);
  };

  const handleBackToAssessments = () => {
    setShowCombinedAssessment(false);
  };

  // Show combined assessment if selected
  if (showCombinedAssessment) {
    return (
      <CombinedAssessment 
        onBack={handleBackToAssessments}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mental Health Assessment
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose between personalized AI-powered assessment or standardized clinical evaluation
          </p>
        </div>

        {/* Assessment Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* Enhanced AI Assessment */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white">
            <div className="flex justify-center mb-4">
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <UserGroupIcon className="h-12 w-12" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-center">🎯 AI-Powered Assessment</h2>
            <p className="text-lg mb-6 opacity-90 text-center">
              Choose specific problem areas first, then get AI-generated questions tailored to your concerns.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <AcademicCapIcon className="w-4 h-4 mr-2" />
                <span>Select your problem areas first</span>
              </div>
              <div className="flex items-center text-sm">
                <SparklesIcon className="w-4 h-4 mr-2" />
                <span>AI questions tailored to you</span>
              </div>
              <div className="flex items-center text-sm">
                <BoltIcon className="w-4 h-4 mr-2" />
                <span>8-12 targeted questions</span>
              </div>
              <div className="flex items-center text-sm">
                <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                <span>Real-time personalization</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/assessments/targeted-ai')}
              className="w-full bg-white text-emerald-600 font-bold py-4 px-8 rounded-xl hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 text-lg shadow-lg"
            >
              Start AI Assessment →
            </button>
          </div>

          {/* Combined Clinical Assessment */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 rounded-full p-4">
                <ChartBarIcon className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-center text-gray-900">🏥 Clinical Assessment</h2>
            <p className="text-lg mb-6 text-gray-600 text-center">
              Standardized PHQ-9, GAD-7, and PSS-10 questions in randomized order for comprehensive evaluation.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-700">
                <HeartIcon className="w-4 h-4 mr-2 text-blue-600" />
                <span>PHQ-9 Depression Assessment</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <ExclamationTriangleIcon className="w-4 h-4 mr-2 text-orange-600" />
                <span>GAD-7 Anxiety Assessment</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <BoltIcon className="w-4 h-4 mr-2 text-purple-600" />
                <span>PSS-10 Stress Assessment</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <SparklesIcon className="w-4 h-4 mr-2 text-green-600" />
                <span>26 questions in random order</span>
              </div>
            </div>
            <button
              onClick={handleStartCombinedAssessment}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transform hover:scale-105 transition-all duration-200 text-lg shadow-lg"
            >
              Start Clinical Assessment →
            </button>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-16 max-w-6xl mx-auto">
          <div className="bg-gray-50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">About These Assessments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">AI-Powered Assessment</h4>
                <p className="mb-3">Select specific problem areas (relationships, academics, stress, etc.) and receive AI-generated questions tailored to your selected concerns.</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Personalized question generation</li>
                  <li>Focus on your selected areas</li>
                  <li>Adaptive follow-up questions</li>
                  <li>Real-time AI analysis</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Clinical Assessment</h4>
                <p className="mb-3">Uses standardized, clinically-validated tools (PHQ-9, GAD-7, PSS-10) with questions presented in random order to provide consistent, comparable results.</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Clinically validated instruments</li>
                  <li>Standardized scoring system</li>
                  <li>Professional benchmark comparison</li>
                  <li>Comprehensive mental health coverage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ color, title, subtitle, icon: Icon }) {
  return (
    <div className={`bg-gradient-to-br ${color} text-white p-6 rounded-xl shadow-lg text-center transform hover:scale-105 transition-all duration-200`}>
      {Icon && <Icon className="h-8 w-8 mx-auto mb-3" />}
      <p className="text-3xl font-bold mb-1">{title}</p>
      <p className="text-sm opacity-90">{subtitle}</p>
    </div>
  );
}
