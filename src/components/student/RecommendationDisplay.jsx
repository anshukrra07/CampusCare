import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  SparklesIcon,
  ClockIcon,
  HeartIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  UserGroupIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  FilmIcon,
  FireIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  StarIcon,
} from '@heroicons/react/24/solid';

const ACTIVITY_ICONS = {
  exercise: '🏃‍♂️',
  counseling: '🗣️',
  entertainment: '🎬',
  mindfulness: '🧘‍♀️',
  social: '👥',
  creative: '🎨',
  educational: '📚'
};

const PRIORITY_COLORS = {
  urgent: 'border-red-500 bg-red-50',
  high: 'border-orange-500 bg-orange-50',
  medium: 'border-yellow-500 bg-yellow-50',
  low: 'border-green-500 bg-green-50'
};

export default function RecommendationDisplay({ 
  recommendations, 
  title = "Personalized Recommendations",
  subtitle = "Based on your assessment and profile",
  onActionTaken,
  showEmergency = false
}) {
  const { t } = useLanguage();
  const [completedActions, setCompletedActions] = useState(new Set());
  const [expandedCards, setExpandedCards] = useState(new Set());

  if (!recommendations || Object.keys(recommendations).length === 0) {
    return null;
  }

  const handleActionComplete = (recommendationId) => {
    const newCompleted = new Set(completedActions);
    newCompleted.add(recommendationId);
    setCompletedActions(newCompleted);
    
    if (onActionTaken) {
      onActionTaken(recommendationId);
    }
  };

  const toggleCardExpansion = (cardId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const getActionButton = (recommendation) => {
    const isCompleted = completedActions.has(recommendation.id || recommendation.title);
    
    if (recommendation.action === 'call') {
      return (
        <a
          href={`tel:${recommendation.contact}`}
          className="flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
        >
          <PhoneIcon className="w-5 h-5 mr-2" />
          Call {recommendation.contact}
        </a>
      );
    }
    
    if (recommendation.action === 'visit') {
      return (
        <button className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200">
          <HandRaisedIcon className="w-5 h-5 mr-2" />
          Get Help Now
        </button>
      );
    }

    return (
      <button
        onClick={() => handleActionComplete(recommendation.id || recommendation.title)}
        disabled={isCompleted}
        className={`flex items-center justify-center w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
          isCompleted
            ? 'bg-green-100 text-green-700 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg'
        }`}
      >
        {isCompleted ? (
          <>
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Completed
          </>
        ) : (
          <>
            <PlayIcon className="w-5 h-5 mr-2" />
            Start Activity
          </>
        )}
      </button>
    );
  };

  const RecommendationCard = ({ recommendation, category, index }) => {
    const cardId = `${category}-${index}`;
    const isExpanded = expandedCards.has(cardId);
    const isCompleted = completedActions.has(recommendation.id || recommendation.title);
    const priorityColor = PRIORITY_COLORS[recommendation.priority] || PRIORITY_COLORS.medium;

    return (
      <div className={`border-l-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${priorityColor} ${
        isCompleted ? 'opacity-75' : ''
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">
                {recommendation.icon || ACTIVITY_ICONS[recommendation.type] || '💡'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {recommendation.title}
                </h3>
                {recommendation.priority && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    recommendation.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    recommendation.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {recommendation.priority.toUpperCase()} PRIORITY
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              {recommendation.matchScore && (
                <div className="flex items-center space-x-1">
                  <StarIcon className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-600">
                    {recommendation.matchScore}/5 match
                  </span>
                </div>
              )}
              
              <button
                onClick={() => toggleCardExpansion(cardId)}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors duration-200"
              >
                {isExpanded ? 'Show Less' : 'Learn More'}
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-4">
            {recommendation.description}
          </p>

          {/* Quick Info */}
          <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
            {recommendation.duration && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4" />
                <span>{recommendation.duration}</span>
              </div>
            )}
            
            {recommendation.difficulty && (
              <div className="flex items-center space-x-1">
                <FireIcon className="w-4 h-4" />
                <span className="capitalize">{recommendation.difficulty}</span>
              </div>
            )}
            
            {recommendation.frequency && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4" />
                <span>{recommendation.frequency}</span>
              </div>
            )}
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="border-t pt-4 mt-4 space-y-4">
              {recommendation.platform && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Available On:</h4>
                  <p className="text-gray-600 text-sm">{recommendation.platform}</p>
                </div>
              )}
              
              {recommendation.benefits && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Benefits:</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    {recommendation.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {recommendation.tips && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tips to Get Started:</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    {recommendation.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-0.5">→</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6">
            {getActionButton(recommendation)}
          </div>
        </div>
      </div>
    );
  };

  const EmergencySection = () => {
    if (!recommendations.emergency) return null;

    return (
      <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-xl font-bold text-red-900">Immediate Support Needed</h2>
            <p className="text-red-700">Please consider these urgent resources right away.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.immediate.map((rec, idx) => (
            <RecommendationCard 
              key={idx} 
              recommendation={{...rec, priority: 'urgent'}} 
              category="emergency" 
              index={idx} 
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="bg-indigo-100 p-3 rounded-full">
            <SparklesIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      {/* Emergency Section */}
      <EmergencySection />

      {/* Immediate Recommendations */}
      {recommendations.immediate && recommendations.immediate.length > 0 && !recommendations.emergency && (
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-orange-100 p-2 rounded-full">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Right Now (Next 1-4 Hours)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.immediate.map((rec, idx) => (
              <RecommendationCard 
                key={idx} 
                recommendation={{...rec, priority: 'high'}} 
                category="immediate" 
                index={idx} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Short-term Recommendations */}
      {recommendations.shortTerm && recommendations.shortTerm.length > 0 && (
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-full">
              <HeartIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">This Week</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.shortTerm.map((rec, idx) => (
              <RecommendationCard 
                key={idx} 
                recommendation={{...rec, priority: 'medium'}} 
                category="shortTerm" 
                index={idx} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Long-term Recommendations */}
      {recommendations.longTerm && recommendations.longTerm.length > 0 && (
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-100 p-2 rounded-full">
              <BookOpenIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">This Month</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.longTerm.map((rec, idx) => (
              <RecommendationCard 
                key={idx} 
                recommendation={{...rec, priority: 'low'}} 
                category="longTerm" 
                index={idx} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-6 text-gray-500 text-sm border-t">
        <p>These recommendations are personalized based on your assessment results and profile.</p>
        <p className="mt-2">Remember to consult with healthcare professionals for serious concerns.</p>
      </div>
    </div>
  );
}