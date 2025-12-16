// services/targetedAssessmentService.js - Targeted AI Assessment Service
const { genTextFromGemini, cleanAndParseJSON } = require('../utils/helpers');

/**
 * Generate the first question for a targeted assessment based on selected problem areas
 * @param {Array} selectedAreas - Array of selected problem areas with id, name, description, keywords
 * @param {string} userId - User ID for logging purposes
 * @returns {Object} Generated question data
 */
async function generateTargetedFirstQuestion(selectedAreas, userId = null, db = null) {
  try {
    console.log(`🎯 Generating targeted first question for areas: ${selectedAreas.map(a => a.name).join(', ')}...`);

    // Create AI prompt for targeted first question
    const areaNames = selectedAreas.map(area => area.name).join(', ');
    const areaDescriptions = selectedAreas.map(area => `${area.name}: ${area.description}`).join('; ');
    const areaKeywords = selectedAreas.flatMap(area => area.keywords || []).join(', ');
    
    const prompt = `You are a mental health assessment AI. Generate a personalized first question for a student who selected these problem areas: ${areaNames}.

Area details: ${areaDescriptions}

Keywords: ${areaKeywords}

Create ONE engaging, empathetic first question that:
1. Addresses their selected areas naturally
2. Uses a caring, non-judgmental tone
3. Allows them to share their current stress/concern level
4. Sets a comfortable tone for the assessment
5. Can be answered on a 0-3 scale (Not at all stressful, Mildly stressful, Moderately stressful, Very stressful)

Examples of good targeted first questions:
- "How would you describe your current stress levels when it comes to [specific area]?"
- "Thinking about [area], how much is this affecting your daily life right now?"
- "When you consider [area], how overwhelming do things feel at the moment?"

Respond ONLY with valid JSON in this format:
{
  "question": "Your personalized question here",
  "category": "targeted",
  "focusArea": "${selectedAreas[0].id}",
  "context": "Brief explanation of why this question is relevant"
}`;

    const aiResult = await genTextFromGemini(prompt, 2);
    const response = cleanAndParseJSON(aiResult.text);

    if (!response.question) {
      throw new Error('No question generated from AI response');
    }

    // Save the interaction if user is authenticated
    if (userId && db) {
      try {
        await db.collection("users").doc(userId).collection("targeted_assessments").add({
          selectedAreas: selectedAreas.map(a => ({ 
            id: a.id, 
            name: a.name, 
            description: a.description,
            keywords: a.keywords,
            color: a.color
          })),
          generatedFirstQuestion: response.question,
          category: response.category,
          focusArea: response.focusArea,
          context: response.context,
          created_at: new Date(),
          type: 'first_question',
          sessionId: `targeted-${Date.now()}`,
          questionGenerationTime: new Date(),
          areasCount: selectedAreas.length,
          primaryArea: selectedAreas[0]?.name || 'Unknown'
        });
      } catch (saveError) {
        console.warn('Failed to save targeted first question:', saveError);
      }
    }

    return {
      ok: true,
      question: response.question,
      category: response.category || 'targeted',
      focusArea: response.focusArea || selectedAreas[0].id,
      context: response.context || 'AI-generated targeted first question'
    };

  } catch (error) {
    console.error('❌ generateTargetedFirstQuestion error:', error);
    throw error;
  }
}

/**
 * Generate a contextual follow-up question based on conversation history and selected areas
 * @param {Object} questionContext - Context including selected areas, conversation history, etc.
 * @param {string} userId - User ID for logging purposes
 * @returns {Object} Generated question data
 */
async function generateTargetedContextualQuestion(questionContext, userId = null, db = null) {
  try {
    const { 
      selectedAreas, 
      currentQuestion, 
      selectedAnswer, 
      answerLabel, 
      conversationHistory,
      questionNumber,
      targetQuestionCount 
    } = questionContext;

    console.log(`🎯 Generating targeted contextual question ${questionNumber + 1} for areas: ${selectedAreas.map(a => a.name).join(', ')}...`);

    // Build conversation context
    const historyText = conversationHistory.map((item, index) => 
      `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer} (Score: ${item.score})${item.focusArea ? ` [${item.focusArea}]` : ''}`
    ).join('\n\n');

    const areaNames = selectedAreas.map(area => area.name).join(', ');
    const areaDescriptions = selectedAreas.map(area => `${area.name}: ${area.description}`).join('; ');
    
    // Determine which area to focus on based on conversation history and highest concerns
    const highConcernAreas = selectedAreas.filter(area => 
      conversationHistory.some(item => item.focusArea === area.id && item.score >= 2)
    );
    
    const nextFocusArea = highConcernAreas.length > 0 
      ? highConcernAreas[Math.floor(Math.random() * highConcernAreas.length)]
      : selectedAreas[Math.floor(Math.random() * selectedAreas.length)];
    
    const prompt = `You are a mental health assessment AI conducting a targeted assessment. The student selected these problem areas: ${areaNames}.

Area details: ${areaDescriptions}

Current conversation:
${historyText}

The student just answered: "${answerLabel}" (score: ${selectedAnswer}) to: "${currentQuestion}"

Generate the next question (${questionNumber + 1}/${targetQuestionCount}) that:
1. Builds naturally on their previous responses
2. Focuses on "${nextFocusArea.name}" if appropriate, or explores a related concern
3. Uses an empathetic, conversational tone
4. Addresses their selected problem areas
5. Can be answered on a 0-3 scale (Not at all stressful, Mildly stressful, Moderately stressful, Very stressful)
6. Helps assess severity and impact in their chosen areas
7. Explores different aspects (timing, coping, impact, triggers, support, etc.)

Guidelines for good follow-up questions:
- If they scored high (2-3): Ask about impact, coping strategies, or support
- If they scored low (0-1): Gently explore other aspects or switch focus areas
- Consider asking about: frequency, triggers, coping mechanisms, support systems, impact on daily life, specific situations

Avoid:
- Repeating similar questions
- Being too clinical or formal
- Ignoring their previous responses
- Generic questions that don't connect to their specific areas

Respond ONLY with valid JSON:
{
  "question": "Your contextual question here",
  "category": "contextual",
  "focusArea": "${nextFocusArea.id}",
  "context": "Brief explanation of the focus",
  "priority": "normal" or "high"
}`;

    const aiResult = await genTextFromGemini(prompt, 2);
    const response = cleanAndParseJSON(aiResult.text);

    if (!response.question) {
      throw new Error('No contextual question generated from AI response');
    }

    // Save the interaction if user is authenticated
    if (userId && db) {
      try {
        const questionAnalysis = {
          followsHighConcernResponse: selectedAnswer >= 2,
          isAreaSwitch: conversationHistory.length > 0 && 
                       conversationHistory[conversationHistory.length - 1].focusArea !== response.focusArea,
          conversationDepth: conversationHistory.length,
          cumulativeScore: conversationHistory.reduce((sum, item) => sum + (item.score || 0), 0) + selectedAnswer
        };
        
        await db.collection("users").doc(userId).collection("targeted_questions").add({
          questionNumber: questionNumber + 1,
          selectedAreas: selectedAreas.map(a => ({ 
            id: a.id, 
            name: a.name,
            description: a.description,
            keywords: a.keywords 
          })),
          previousQuestion: currentQuestion,
          previousAnswer: answerLabel,
          previousScore: selectedAnswer,
          generatedQuestion: response.question,
          category: response.category,
          focusArea: response.focusArea,
          context: response.context,
          priority: response.priority,
          conversationHistory: conversationHistory.map(item => ({
            question: item.question,
            answer: item.answer,
            score: item.score,
            focusArea: item.focusArea
          })),
          questionAnalysis,
          created_at: new Date(),
          type: 'contextual_question',
          sessionInfo: {
            totalQuestions: questionNumber + 1,
            targetQuestionCount,
            remainingQuestions: targetQuestionCount - (questionNumber + 1),
            progressPercentage: Math.round(((questionNumber + 1) / targetQuestionCount) * 100)
          }
        });
      } catch (saveError) {
        console.warn('Failed to save targeted contextual question:', saveError);
      }
    }

    return {
      ok: true,
      question: response.question,
      category: response.category || 'contextual',
      focusArea: response.focusArea || nextFocusArea.id,
      context: response.context || 'AI-generated targeted contextual question',
      priority: response.priority || 'normal'
    };

  } catch (error) {
    console.error('❌ generateTargetedContextualQuestion error:', error);
    throw error;
  }
}

/**
 * Generate insights and recommendations based on targeted assessment results
 * @param {Array} selectedAreas - Selected problem areas
 * @param {Array} responses - Assessment responses with scores
 * @param {string} userId - User ID for logging purposes
 * @returns {Object} Generated insights and recommendations
 */
async function generateTargetedInsights(selectedAreas, responses, userId = null, db = null) {
  try {
    console.log(`🎯 Generating targeted insights for ${selectedAreas.length} areas and ${responses.length} responses...`);

    const areaNames = selectedAreas.map(area => area.name).join(', ');
    
    // Calculate area-specific scores
    const areaInsights = {};
    selectedAreas.forEach(area => {
      const areaResponses = responses.filter(r => r.focusArea === area.id);
      const areaScores = areaResponses.map(r => r.score);
      const averageScore = areaScores.length > 0 
        ? areaScores.reduce((sum, score) => sum + score, 0) / areaScores.length 
        : 0;
      
      areaInsights[area.id] = {
        name: area.name,
        averageScore,
        responseCount: areaScores.length,
        level: averageScore >= 2.5 ? 'High' : averageScore >= 1.5 ? 'Moderate' : averageScore >= 0.5 ? 'Mild' : 'Low'
      };
    });

    const conversationSummary = responses.map((r, index) => 
      `Q${index + 1} [${r.focusArea || 'general'}]: Score ${r.score}/3 - ${r.answer}`
    ).join('\n');

    const prompt = `You are a mental health assessment AI providing personalized insights. A student completed a targeted assessment focusing on: ${areaNames}.

Assessment Results:
${conversationSummary}

Area-specific insights:
${Object.values(areaInsights).map(insight => 
  `${insight.name}: ${insight.level} concern (avg score: ${insight.averageScore.toFixed(1)}/3, ${insight.responseCount} questions)`
).join('\n')}

Generate personalized insights that:
1. Acknowledge their specific areas of concern
2. Highlight patterns in their responses
3. Provide encouraging but realistic perspective
4. Suggest actionable next steps
5. Use empathetic, supportive language
6. Focus on their selected areas

Respond ONLY with valid JSON:
{
  "insights": {
    "summary": "Overall assessment summary",
    "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
    "areaSpecific": {
      ${selectedAreas.map(area => `"${area.id}": "Insight for ${area.name}"`).join(',\n      ')}
    },
    "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
    "encouragement": "Encouraging message"
  }
}`;

    const aiResult = await genTextFromGemini(prompt, 2);
    const response = cleanAndParseJSON(aiResult.text);

    if (!response.insights) {
      throw new Error('No insights generated from AI response');
    }

    // Save insights if user is authenticated
    if (userId && db) {
      try {
        await db.collection("users").doc(userId).collection("assessment_insights").add({
          selectedAreas: selectedAreas.map(a => ({ id: a.id, name: a.name })),
          areaInsights,
          responses: responses.length,
          generatedInsights: response.insights,
          created_at: new Date(),
          type: 'targeted_insights'
        });
      } catch (saveError) {
        console.warn('Failed to save targeted insights:', saveError);
      }
    }

    return {
      ok: true,
      insights: response.insights,
      areaInsights
    };

  } catch (error) {
    console.error('❌ generateTargetedInsights error:', error);
    throw error;
  }
}

module.exports = {
  generateTargetedFirstQuestion,
  generateTargetedContextualQuestion,
  generateTargetedInsights
};