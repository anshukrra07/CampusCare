import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import RecommendationEngine from '../utils/recommendationEngine';
import { useLanguage } from '../contexts/LanguageContext';

export const useRecommendations = () => {
  const [user] = useAuthState(auth);
  const { currentLanguage } = useLanguage();
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({});

  // Initialize recommendation engine with current language
  const recommendationEngine = new RecommendationEngine(currentLanguage);

  // Fetch user profile for personalization
  const fetchUserProfile = async () => {
    if (!user) return {};

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          age: userData.age || 20,
          gender: userData.gender || null,
          interests: userData.interests || ['music', 'games'],
          personality: userData.personality || 'balanced',
          language: userData.preferredLanguage || currentLanguage
        };
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    
    return {
      age: 20,
      interests: ['music', 'games'],
      personality: 'balanced'
    };
  };

  // Fetch recent mood history
  const fetchMoodHistory = async () => {
    if (!user) return [];

    try {
      const moodRef = collection(db, 'users', user.uid, 'moods');
      const q = query(moodRef, orderBy('date', 'desc'), limit(30));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date
      }));
    } catch (error) {
      console.error('Error fetching mood history:', error);
      return [];
    }
  };

  // Fetch recent assessment scores
  const fetchAssessmentScores = async () => {
    if (!user) return {};

    try {
      const assessmentRef = collection(db, 'users', user.uid, 'assessments');
      const q = query(assessmentRef, orderBy('date', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      
      const scores = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const testType = data.testName?.toLowerCase().replace('-', '') || 'unknown';
        
        if (testType.includes('phq')) {
          scores.phq9 = data.score;
        } else if (testType.includes('gad')) {
          scores.gad7 = data.score;
        } else if (testType.includes('stress')) {
          scores.stress = data.score;
        }
      });
      
      return scores;
    } catch (error) {
      console.error('Error fetching assessment scores:', error);
      return {};
    }
  };

  // Generate recommendations for a specific assessment score
  const generateRecommendationsForAssessment = async (assessmentType, score, currentMood = null) => {
    setLoading(true);

    try {
      const profile = await fetchUserProfile();
      const moodHistory = await fetchMoodHistory();
      const existingScores = await fetchAssessmentScores();
      
      // Add the new assessment score
      const assessmentScores = {
        ...existingScores,
        [assessmentType]: score
      };

      setUserProfile(profile);

      const recs = recommendationEngine.generateRecommendations({
        assessmentScores,
        moodHistory,
        userProfile: profile,
        currentMood
      });

      // Enhance recommendations with additional details
      const enhancedRecs = enhanceRecommendations(recs, assessmentType, score);
      
      setRecommendations(enhancedRecs);
      return enhancedRecs;
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generate recommendations based on mood entry
  const generateRecommendationsForMood = async (moodValue, energyValue = null, stressValue = null) => {
    setLoading(true);

    try {
      const profile = await fetchUserProfile();
      const moodHistory = await fetchMoodHistory();
      const assessmentScores = await fetchAssessmentScores();

      setUserProfile(profile);

      const recs = recommendationEngine.generateRecommendations({
        assessmentScores,
        moodHistory,
        userProfile: profile,
        currentMood: moodValue
      });

      const enhancedRecs = enhanceRecommendationsForMood(recs, moodValue, energyValue, stressValue);
      
      setRecommendations(enhancedRecs);
      return enhancedRecs;
      
    } catch (error) {
      console.error('Error generating mood recommendations:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Enhance recommendations with additional context and benefits
  const enhanceRecommendations = (recs, assessmentType, score) => {
    if (!recs) return null;

    const enhancedRecs = { ...recs };

    // Add assessment-specific context
    const contextMessages = {
      phq9: {
        low: "Your depression screening shows minimal symptoms. These activities can help maintain your positive mental health.",
        moderate: "Your depression screening indicates mild to moderate symptoms. These evidence-based activities can help improve your mood.",
        high: "Your depression screening shows significant symptoms. Please consider professional support alongside these helpful activities."
      },
      gad7: {
        low: "Your anxiety screening shows minimal symptoms. These activities can help you stay calm and centered.",
        moderate: "Your anxiety screening indicates moderate anxiety levels. These techniques are proven to help reduce anxiety.",
        high: "Your anxiety screening shows significant anxiety. Please consider professional support along with these calming strategies."
      },
      stress: {
        low: "Your stress levels appear manageable. These activities can help maintain your resilience.",
        moderate: "Your stress levels are elevated. These proven techniques can help you better manage stress.",
        high: "Your stress levels are quite high. Consider professional support along with these stress-reduction strategies."
      }
    };

    const severity = score < 5 ? 'low' : score < 15 ? 'moderate' : 'high';
    const context = contextMessages[assessmentType]?.[severity] || "Based on your assessment, here are personalized recommendations to support your mental wellness.";

    enhancedRecs.context = context;
    enhancedRecs.assessmentInfo = {
      type: assessmentType,
      score,
      severity
    };

    // Add benefits and tips to recommendations
    if (enhancedRecs.immediate) {
      enhancedRecs.immediate = enhancedRecs.immediate.map(addBenefitsAndTips);
    }
    if (enhancedRecs.shortTerm) {
      enhancedRecs.shortTerm = enhancedRecs.shortTerm.map(addBenefitsAndTips);
    }
    if (enhancedRecs.longTerm) {
      enhancedRecs.longTerm = enhancedRecs.longTerm.map(addBenefitsAndTips);
    }

    return enhancedRecs;
  };

  const enhanceRecommendationsForMood = (recs, moodValue, energyValue, stressValue) => {
    if (!recs) return null;

    const enhancedRecs = { ...recs };
    
    let moodContext = "Here are some activities to help with your current mood.";
    if (moodValue <= 2) {
      moodContext = "I notice you're feeling low today. These activities are specifically chosen to help boost your mood and energy.";
    } else if (moodValue >= 4) {
      moodContext = "Great to see you're feeling good! These activities can help you maintain and build on your positive mood.";
    }

    enhancedRecs.context = moodContext;
    enhancedRecs.moodInfo = {
      mood: moodValue,
      energy: energyValue,
      stress: stressValue
    };

    return enhancedRecs;
  };

  const addBenefitsAndTips = (recommendation) => {
    const benefitsAndTips = {
      // Exercise recommendations
      "Daily Walk": {
        benefits: ["Releases mood-boosting endorphins", "Reduces stress and anxiety", "Improves sleep quality", "Boosts energy levels"],
        tips: ["Start with just 10 minutes if you're new to exercise", "Choose scenic routes to enhance the experience", "Invite a friend for social support", "Listen to music or podcasts"]
      },
      "Yoga Stretches": {
        benefits: ["Reduces muscle tension and stress", "Improves flexibility and balance", "Calms the mind", "Enhances body awareness"],
        tips: ["Use YouTube videos for guided sessions", "Start with gentle poses", "Focus on breathing", "Practice in a quiet, comfortable space"]
      },
      "5-Minute Energy Boost": {
        benefits: ["Quick mood lift", "Increases blood flow", "Releases tension", "Boosts alertness"],
        tips: ["Put on upbeat music", "Do jumping jacks or dance", "Take deep breaths between movements", "Smile while you move - it helps!"]
      },
      
      // Counseling recommendations
      "Individual Therapy": {
        benefits: ["Professional guidance and support", "Learn coping strategies", "Safe space to express feelings", "Develop self-awareness"],
        tips: ["Research therapists covered by your insurance", "Prepare questions before your first session", "Be honest about your concerns", "Give it a few sessions to see if it's a good fit"]
      },
      "Peer Support Group": {
        benefits: ["Connect with people who understand", "Learn from others' experiences", "Feel less alone", "Build social connections"],
        tips: ["Look for campus support groups", "Online groups are available if in-person feels intimidating", "Listen more than you speak initially", "Respect others' privacy and experiences"]
      },
      
      // Mindfulness recommendations
      "Breathing Exercise": {
        benefits: ["Immediate stress relief", "Calms the nervous system", "Improves focus", "Can be done anywhere"],
        tips: ["Try the 4-7-8 technique: breathe in for 4, hold for 7, out for 8", "Place one hand on chest, one on belly", "Focus on the belly rising and falling", "Use apps like Headspace or Calm for guidance"]
      },
      "Gratitude Practice": {
        benefits: ["Shifts focus to positive aspects of life", "Improves mood and life satisfaction", "Strengthens relationships", "Reduces negative thinking"],
        tips: ["Write down 3 specific things you're grateful for", "Include small details like a good cup of coffee", "Think about people who have helped you", "Make it a daily habit, perhaps before bed"]
      }
    };

    const enhanced = { ...recommendation };
    const match = benefitsAndTips[recommendation.title];
    if (match) {
      enhanced.benefits = match.benefits;
      enhanced.tips = match.tips;
    }

    return enhanced;
  };

  return {
    recommendations,
    loading,
    userProfile,
    generateRecommendationsForAssessment,
    generateRecommendationsForMood,
    setRecommendations
  };
};