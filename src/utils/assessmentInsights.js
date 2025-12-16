// Assessment Insights Utility Functions
// Provides detailed analysis and summaries for targeted AI assessments

/**
 * Generate comprehensive profile summary from targeted assessment data
 * @param {Object} assessmentData - Complete assessment data from Firestore
 * @returns {Object} Formatted profile summary for counselors and tracking
 */
export const generateProfileSummary = (assessmentData) => {
  if (!assessmentData || !assessmentData.detailedAnalysis) {
    return null;
  }

  const {
    detailedAnalysis,
    profileSummary,
    sessionInfo,
    questionFlow,
    selectedAreas,
    severity,
    percentage,
    created_at,
    metadata
  } = assessmentData;

  // Extract key concern patterns
  const concernPatterns = Object.entries(detailedAnalysis).map(([areaId, analysis]) => ({
    area: analysis.areaInfo.name,
    concernLevel: analysis.assessment.concernLevel,
    percentage: analysis.assessment.percentage,
    keyResponses: analysis.questionsAndAnswers
      .filter(qa => qa.answer >= 2)
      .map(qa => ({
        question: qa.questionText,
        answer: qa.answerLabel,
        concernLevel: qa.concernLevel
      }))
  }));

  // Identify patterns in AI-generated questions
  const aiQuestionInsights = questionFlow
    .filter(q => q.questionType === 'ai-generated')
    .map(q => ({
      focusArea: q.focusArea,
      question: q.questionText,
      answer: q.answerLabel,
      concernLevel: q.concernLevel
    }));

  // Generate timeline insights
  const timelineInsights = {
    assessmentDate: created_at?.toDate ? created_at.toDate().toLocaleDateString() : new Date(created_at).toLocaleDateString(),
    duration: Math.round(sessionInfo.duration / 60), // in minutes
    questioningEffectiveness: {
      totalQuestions: sessionInfo.totalQuestions,
      aiGenerated: metadata.aiQuestionsGenerated,
      fallbacksUsed: metadata.fallbacksUsed,
      completionRate: sessionInfo.completionRate
    }
  };

  // Risk assessment based on patterns
  const riskIndicators = {
    highConcernAreas: concernPatterns.filter(p => p.concernLevel === 'High'),
    consistentlyHighResponses: questionFlow.filter(q => q.answer >= 2).length,
    areaSpread: selectedAreas.length,
    overallSeverity: severity
  };

  // Counselor notes and recommendations
  const counselorInsights = {
    primaryFocusAreas: profileSummary.primaryConcernAreas.map(area => ({
      area: area.name,
      level: area.level,
      specificConcerns: detailedAnalysis[area.areaId]?.questionsAndAnswers
        .filter(qa => qa.answer >= 2)
        .map(qa => qa.questionText) || []
    })),
    
    strengths: profileSummary.strengthAreas.map(area => ({
      area: area.name,
      level: area.level,
      positiveIndicators: detailedAnalysis[area.areaId]?.questionsAndAnswers
        .filter(qa => qa.answer <= 1)
        .map(qa => qa.questionText) || []
    })),

    recommendations: generateRecommendations(concernPatterns, riskIndicators, aiQuestionInsights)
  };

  return {
    assessmentOverview: {
      type: 'Targeted AI Assessment',
      date: timelineInsights.assessmentDate,
      duration: `${timelineInsights.duration} minutes`,
      overallSeverity: severity,
      overallPercentage: percentage,
      areasAssessed: selectedAreas.length
    },
    
    detailedInsights: {
      concernPatterns,
      riskIndicators,
      timelineInsights,
      aiQuestionInsights: {
        totalAIQuestions: aiQuestionInsights.length,
        focusAreaBreakdown: groupBy(aiQuestionInsights, 'focusArea'),
        highConcernAIQuestions: aiQuestionInsights.filter(q => q.concernLevel === 'High')
      }
    },

    counselorNotes: counselorInsights,

    technicalDetails: {
      sessionId: metadata.sessionId,
      questioningStrategy: `${metadata.aiQuestionsGenerated ? 'AI-driven' : 'Standard'} with ${metadata.fallbacksUsed} fallback questions`,
      completionMetrics: {
        questionsAnswered: sessionInfo.questionsAnswered,
        avgResponseTime: `${sessionInfo.averageResponseTime}s`,
        completionRate: `${sessionInfo.completionRate}%`
      }
    }
  };
};

/**
 * Generate actionable recommendations based on assessment patterns
 */
const generateRecommendations = (concernPatterns, riskIndicators, aiQuestionInsights) => {
  const recommendations = [];

  // High-risk recommendations
  if (riskIndicators.highConcernAreas.length > 0) {
    recommendations.push({
      priority: 'High',
      category: 'Immediate Attention',
      recommendation: `Schedule follow-up session to address concerns in: ${riskIndicators.highConcernAreas.map(a => a.area).join(', ')}`,
      rationale: `Multiple high-concern responses in these areas indicate need for targeted intervention`
    });
  }

  // Pattern-based recommendations
  if (riskIndicators.consistentlyHighResponses >= 5) {
    recommendations.push({
      priority: 'Medium',
      category: 'Assessment Pattern',
      recommendation: 'Consider comprehensive clinical assessment',
      rationale: `${riskIndicators.consistentlyHighResponses} high-concern responses across multiple areas`
    });
  }

  // AI questioning effectiveness
  const aiEffectiveness = aiQuestionInsights.filter(q => q.concernLevel === 'High').length;
  if (aiEffectiveness > 0) {
    recommendations.push({
      priority: 'Low',
      category: 'Follow-up Strategy',
      recommendation: 'AI questioning revealed specific concerns - use targeted approach in counseling',
      rationale: `AI-generated questions identified ${aiEffectiveness} high-concern responses`
    });
  }

  // Area-specific recommendations
  concernPatterns.forEach(pattern => {
    if (pattern.concernLevel === 'Moderate' && pattern.keyResponses.length > 0) {
      recommendations.push({
        priority: 'Medium',
        category: `${pattern.area} Support`,
        recommendation: `Provide targeted resources and coping strategies for ${pattern.area.toLowerCase()}`,
        rationale: `Moderate concern level with specific issues identified`
      });
    }
  });

  return recommendations;
};

/**
 * Utility function to group array by property
 */
const groupBy = (array, property) => {
  return array.reduce((groups, item) => {
    const group = item[property] || 'Other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
};

/**
 * Generate trend analysis comparing multiple assessments
 * @param {Array} assessments - Array of assessment data sorted by date
 * @returns {Object} Trend analysis
 */
export const generateTrendAnalysis = (assessments) => {
  if (!assessments || assessments.length < 2) {
    return { insufficient_data: true };
  }

  const sortedAssessments = assessments
    .filter(a => a.assessmentType === 'targeted-ai')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (sortedAssessments.length < 2) {
    return { insufficient_data: true };
  }

  const latest = sortedAssessments[0];
  const previous = sortedAssessments[1];

  // Overall trend
  const scoreTrend = {
    direction: latest.percentage > previous.percentage ? 'increasing' : 
              latest.percentage < previous.percentage ? 'decreasing' : 'stable',
    change: latest.percentage - previous.percentage,
    significance: Math.abs(latest.percentage - previous.percentage) > 10 ? 'significant' : 'minor'
  };

  // Area-specific trends
  const areaTrends = {};
  Object.keys(latest.areaInsights || {}).forEach(areaId => {
    const latestArea = latest.areaInsights[areaId];
    const previousArea = previous.areaInsights?.[areaId];
    
    if (previousArea) {
      areaTrends[areaId] = {
        area: latestArea.name,
        trend: latestArea.score > previousArea.score ? 'worsening' : 
               latestArea.score < previousArea.score ? 'improving' : 'stable',
        change: Math.round((latestArea.score - previousArea.score) * 10) / 10,
        currentLevel: latestArea.level,
        previousLevel: previousArea.level
      };
    }
  });

  return {
    overall: scoreTrend,
    areas: areaTrends,
    assessmentCount: sortedAssessments.length,
    timespan: {
      latest: new Date(latest.created_at).toLocaleDateString(),
      previous: new Date(previous.created_at).toLocaleDateString(),
      daysBetween: Math.round((new Date(latest.created_at) - new Date(previous.created_at)) / (1000 * 60 * 60 * 24))
    }
  };
};

/**
 * Generate summary statistics for multiple targeted assessments
 * @param {Array} assessments - Array of targeted assessment data
 * @returns {Object} Summary statistics
 */
export const generateSummaryStats = (assessments) => {
  const targetedAssessments = assessments.filter(a => a.assessmentType === 'targeted-ai');
  
  if (targetedAssessments.length === 0) {
    return { no_data: true };
  }

  // Frequency analysis
  const areasFrequency = {};
  const concernLevelFreq = { 'Low': 0, 'Mild': 0, 'Moderate': 0, 'High': 0 };
  
  targetedAssessments.forEach(assessment => {
    // Track area selection frequency
    (assessment.selectedAreas || []).forEach(area => {
      const areaName = area.name || area;
      areasFrequency[areaName] = (areasFrequency[areaName] || 0) + 1;
    });

    // Track concern level frequency
    const severity = assessment.severity || 'Low';
    if (severity.includes('High')) concernLevelFreq['High']++;
    else if (severity.includes('Moderate')) concernLevelFreq['Moderate']++;
    else if (severity.includes('Mild')) concernLevelFreq['Mild']++;
    else concernLevelFreq['Low']++;
  });

  return {
    totalAssessments: targetedAssessments.length,
    mostSelectedAreas: Object.entries(areasFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([area, count]) => ({ area, count })),
    concernLevelDistribution: concernLevelFreq,
    averageQuestionsPerAssessment: Math.round(
      targetedAssessments.reduce((sum, a) => sum + (a.sessionInfo?.totalQuestions || 0), 0) / 
      targetedAssessments.length
    ),
    averageDuration: Math.round(
      targetedAssessments.reduce((sum, a) => sum + (a.sessionInfo?.duration || 0), 0) / 
      targetedAssessments.length / 60
    ), // in minutes
    aiQuestionUtilization: Math.round(
      targetedAssessments.reduce((sum, a) => sum + (a.metadata?.aiQuestionsGenerated || 0), 0) / 
      targetedAssessments.reduce((sum, a) => sum + (a.sessionInfo?.totalQuestions || 0), 0) * 100
    ) // percentage
  };
};

export default {
  generateProfileSummary,
  generateTrendAnalysis,
  generateSummaryStats
};