import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { supabase } from '../lib/supabaseClient';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  limit 
} from 'firebase/firestore';

// Create the context
const UserDataContext = createContext();

// Action types for reducer
const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_CHAT_SUMMARY: 'SET_CHAT_SUMMARY',
  SET_PLATFORM_DATA: 'SET_PLATFORM_DATA',
  SET_ERROR: 'SET_ERROR',
  REFRESH_DATA: 'REFRESH_DATA',
  CLEAR_DATA: 'CLEAR_DATA'
};

// Initial state
const initialState = {
  loading: true,
  user: null,
  error: null,
  lastUpdated: null,
  
  // Chat AI Summary (previous 6 chats)
  chatSummary: {
    previousChats: [],
    totalChats: 0,
    conversationContext: '',
    lastChatTime: null,
    sentimentPattern: 'neutral'
  },
  
  // Platform Data Summary (mood, assessments, appointments)
  platformData: {
    // Mood data
    mood: {
      recent: [], // last 7 mood entries
      average: null,
      trend: 'stable', // improving, declining, stable
      lastEntry: null,
      weeklyPattern: []
    },
    
    // Assessment data
    assessments: {
      latest: [],
      riskLevel: 'unknown', // low, moderate, high, unknown
      scores: {
        phq9: null,
        gad7: null,
        stress: null
      },
      trends: [],
      lastAssessment: null
    },
    
    // Appointment data
    appointments: {
      total: 0,
      upcoming: 0,
      completed: 0,
      cancelled: 0,
      completionRate: 0,
      nextAppointment: null,
      recentAppointments: []
    },
    
    // User activity
    activity: {
      lastActive: null,
      engagementScore: 0,
      platformUsage: {
        chatSessions: 0,
        moodEntries: 0,
        assessmentsCompleted: 0,
        appointmentsBooked: 0
      }
    }
  }
};

// Reducer function
function userDataReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case ACTION_TYPES.SET_USER:
      return { ...state, user: action.payload };
      
    case ACTION_TYPES.SET_CHAT_SUMMARY:
      return { 
        ...state, 
        chatSummary: { ...state.chatSummary, ...action.payload },
        lastUpdated: new Date()
      };
      
    case ACTION_TYPES.SET_PLATFORM_DATA:
      return { 
        ...state, 
        platformData: { ...state.platformData, ...action.payload },
        lastUpdated: new Date()
      };
      
    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
      
    case ACTION_TYPES.REFRESH_DATA:
      return { ...state, loading: true, error: null };
      
    case ACTION_TYPES.CLEAR_DATA:
      return { ...initialState, loading: false };
      
    default:
      return state;
  }
}

// Provider component
export function UserDataProvider({ children }) {
  const [state, dispatch] = useReducer(userDataReducer, initialState);
  const [user] = useAuthState(auth);

  // Chat data subscription
  useEffect(() => {
    if (!user) {
      dispatch({ type: ACTION_TYPES.CLEAR_DATA });
      return;
    }

    dispatch({ type: ACTION_TYPES.SET_USER, payload: user });

    // Subscribe to real-time chat updates
    const chatQuery = query(
      collection(db, 'users', user.uid, 'chats'),
      orderBy('created_at', 'desc'),
      limit(6)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const chatSummary = {
        previousChats: chats.reverse(), // Get chronological order
        totalChats: snapshot.size,
        conversationContext: generateConversationContext(chats),
        lastChatTime: chats[chats.length - 1]?.created_at || null,
        sentimentPattern: analyzeSentimentPattern(chats)
      };

      dispatch({ type: ACTION_TYPES.SET_CHAT_SUMMARY, payload: chatSummary });
    });

    return () => unsubscribe();
  }, [user]);

  // Platform data loading
  useEffect(() => {
    if (!user) return;

    const loadPlatformData = async () => {
      try {
        const [moodData, assessmentData, appointmentData] = await Promise.all([
          loadMoodData(user.uid),
          loadAssessmentData(user.uid),
          loadAppointmentData(user.uid)
        ]);

        const platformSummary = {
          mood: moodData,
          assessments: assessmentData,
          appointments: appointmentData,
          activity: calculateActivityMetrics(moodData, assessmentData, appointmentData)
        };

        dispatch({ type: ACTION_TYPES.SET_PLATFORM_DATA, payload: platformSummary });
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
      } catch (error) {
        console.error('Error loading platform data:', error);
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      }
    };

    loadPlatformData();
  }, [user]);

  // Data loading functions
  const loadMoodData = async (userId) => {
    try {
      const { data: moods } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(7);

      if (!moods || moods.length === 0) {
        return {
          recent: [],
          average: null,
          trend: 'stable',
          lastEntry: null,
          weeklyPattern: []
        };
      }

      const average = moods.reduce((sum, mood) => sum + mood.mood_level, 0) / moods.length;
      const trend = moods.length >= 2 ? 
        (moods[0].mood_level > moods[1].mood_level ? 'improving' : 
         moods[0].mood_level < moods[1].mood_level ? 'declining' : 'stable') : 'stable';

      return {
        recent: moods,
        average: Math.round(average * 10) / 10,
        trend,
        lastEntry: moods[0],
        weeklyPattern: generateWeeklyMoodPattern(moods)
      };
    } catch (error) {
      console.error('Error loading mood data:', error);
      return {
        recent: [],
        average: null,
        trend: 'stable',
        lastEntry: null,
        weeklyPattern: []
      };
    }
  };

  const loadAssessmentData = async (userId) => {
    try {
      const { data: assessments } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!assessments || assessments.length === 0) {
        return {
          latest: [],
          riskLevel: 'unknown',
          scores: { phq9: null, gad7: null, stress: null },
          trends: [],
          lastAssessment: null
        };
      }

      const scores = {
        phq9: assessments.find(a => a.type === 'phq9')?.score || null,
        gad7: assessments.find(a => a.type === 'gad7')?.score || null,
        stress: assessments.find(a => a.type === 'stress')?.score || null
      };

      return {
        latest: assessments,
        riskLevel: calculateOverallRisk(assessments),
        scores,
        trends: generateAssessmentTrends(assessments),
        lastAssessment: assessments[0]
      };
    } catch (error) {
      console.error('Error loading assessment data:', error);
      return {
        latest: [],
        riskLevel: 'unknown',
        scores: { phq9: null, gad7: null, stress: null },
        trends: [],
        lastAssessment: null
      };
    }
  };

  const loadAppointmentData = async (userId) => {
    try {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false });

      if (!appointments || appointments.length === 0) {
        return {
          total: 0,
          upcoming: 0,
          completed: 0,
          cancelled: 0,
          completionRate: 0,
          nextAppointment: null,
          recentAppointments: []
        };
      }

      const total = appointments.length;
      const upcoming = appointments.filter(a => a.status === 'confirmed').length;
      const completed = appointments.filter(a => a.status === 'completed').length;
      const cancelled = appointments.filter(a => a.status === 'cancelled').length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        upcoming,
        completed,
        cancelled,
        completionRate,
        nextAppointment: appointments.find(a => a.status === 'confirmed') || null,
        recentAppointments: appointments.slice(0, 5)
      };
    } catch (error) {
      console.error('Error loading appointment data:', error);
      return {
        total: 0,
        upcoming: 0,
        completed: 0,
        cancelled: 0,
        completionRate: 0,
        nextAppointment: null,
        recentAppointments: []
      };
    }
  };

  // Helper functions
  const generateConversationContext = (chats) => {
    if (!chats || chats.length === 0) return '';
    
    return chats.map((chat, index) => 
      `${index + 1}. ${chat.role}: ${chat.text.substring(0, 100)}...`
    ).join('\n');
  };

  const analyzeSentimentPattern = (chats) => {
    if (!chats || chats.length === 0) return 'neutral';
    
    const userChats = chats.filter(chat => chat.role === 'user');
    if (userChats.length === 0) return 'neutral';
    
    // Simple sentiment analysis based on keywords (can be enhanced)
    let positiveCount = 0;
    let negativeCount = 0;
    
    userChats.forEach(chat => {
      const text = chat.text.toLowerCase();
      if (text.includes('good') || text.includes('better') || text.includes('happy') || text.includes('thanks')) {
        positiveCount++;
      }
      if (text.includes('bad') || text.includes('worse') || text.includes('sad') || text.includes('anxious') || text.includes('depressed')) {
        negativeCount++;
      }
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const generateWeeklyMoodPattern = (moods) => {
    if (!moods || moods.length === 0) return [];
    
    return moods.slice(0, 7).reverse().map(mood => ({
      date: new Date(mood.created_at).toLocaleDateString(),
      mood: mood.mood_level,
      notes: mood.notes
    }));
  };

  const calculateOverallRisk = (assessments) => {
    if (!assessments || assessments.length === 0) return 'unknown';
    
    let highRisk = 0;
    let moderateRisk = 0;
    let lowRisk = 0;
    
    assessments.forEach(assessment => {
      const score = assessment.score;
      const type = assessment.type;
      
      if (type === 'phq9') {
        if (score >= 20) highRisk++;
        else if (score >= 10) moderateRisk++;
        else lowRisk++;
      } else if (type === 'gad7') {
        if (score >= 15) highRisk++;
        else if (score >= 8) moderateRisk++;
        else lowRisk++;
      } else if (type === 'stress') {
        if (score >= 27) highRisk++;
        else if (score >= 14) moderateRisk++;
        else lowRisk++;
      }
    });
    
    if (highRisk > 0) return 'high';
    if (moderateRisk > 0) return 'moderate';
    return 'low';
  };

  const generateAssessmentTrends = (assessments) => {
    if (!assessments || assessments.length < 2) return [];
    
    const trends = {};
    assessments.forEach(assessment => {
      const date = new Date(assessment.created_at).toLocaleDateString();
      if (!trends[date]) {
        trends[date] = { date, phq9: 0, gad7: 0, stress: 0, count: 0 };
      }
      
      if (assessment.type === 'phq9') trends[date].phq9 = assessment.score;
      if (assessment.type === 'gad7') trends[date].gad7 = assessment.score;
      if (assessment.type === 'stress') trends[date].stress = assessment.score;
      trends[date].count++;
    });
    
    return Object.values(trends).slice(0, 5);
  };

  const calculateActivityMetrics = (moodData, assessmentData, appointmentData) => {
    const engagementScore = Math.round(
      ((moodData.recent.length * 10) + 
       (assessmentData.latest.length * 20) + 
       (appointmentData.completed * 30)) / 3
    );

    return {
      lastActive: new Date().toISOString(),
      engagementScore: Math.min(engagementScore, 100),
      platformUsage: {
        chatSessions: state.chatSummary.totalChats,
        moodEntries: moodData.recent.length,
        assessmentsCompleted: assessmentData.latest.length,
        appointmentsBooked: appointmentData.total
      }
    };
  };

  // Public API methods
  const refreshData = async () => {
    if (!user) return;
    
    dispatch({ type: ACTION_TYPES.REFRESH_DATA });
    
    try {
      const [moodData, assessmentData, appointmentData] = await Promise.all([
        loadMoodData(user.uid),
        loadAssessmentData(user.uid),
        loadAppointmentData(user.uid)
      ]);

      const platformSummary = {
        mood: moodData,
        assessments: assessmentData,
        appointments: appointmentData,
        activity: calculateActivityMetrics(moodData, assessmentData, appointmentData)
      };

      dispatch({ type: ACTION_TYPES.SET_PLATFORM_DATA, payload: platformSummary });
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    } catch (error) {
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
    }
  };

  const getChatSummaryForAI = () => {
    return {
      previousChats: state.chatSummary.previousChats,
      conversationContext: state.chatSummary.conversationContext,
      sentimentPattern: state.chatSummary.sentimentPattern
    };
  };

  const getPlatformDataForAI = () => {
    return {
      mood: {
        average: state.platformData.mood.average,
        trend: state.platformData.mood.trend,
        recent: state.platformData.mood.recent.slice(0, 3) // Last 3 moods
      },
      assessments: {
        riskLevel: state.platformData.assessments.riskLevel,
        scores: state.platformData.assessments.scores
      },
      appointments: {
        completionRate: state.platformData.appointments.completionRate,
        upcoming: state.platformData.appointments.upcoming,
        nextAppointment: state.platformData.appointments.nextAppointment
      }
    };
  };

  const getFormattedAIContext = () => {
    const chatSummary = getChatSummaryForAI();
    const platformData = getPlatformDataForAI();
    
    let context = '\n\n=== USER CONTEXT FOR AI ===\n';
    
    // Chat history
    if (chatSummary.previousChats.length > 0) {
      context += 'Recent conversation history:\n';
      chatSummary.previousChats.forEach((chat, i) => {
        context += `${i + 1}. ${chat.role}: ${chat.text.substring(0, 100)}...\n`;
      });
      context += `Conversation sentiment: ${chatSummary.sentimentPattern}\n`;
    }
    
    // Platform data
    if (platformData.mood.average) {
      context += `\nMood Status: Average ${platformData.mood.average}/5 (${platformData.mood.trend})\n`;
    }
    
    if (platformData.assessments.riskLevel !== 'unknown') {
      context += `Mental Health Risk Level: ${platformData.assessments.riskLevel}\n`;
      if (platformData.assessments.scores.phq9) {
        context += `Latest Scores - PHQ-9: ${platformData.assessments.scores.phq9}/27`;
      }
      if (platformData.assessments.scores.gad7) {
        context += ` GAD-7: ${platformData.assessments.scores.gad7}/21`;
      }
      if (platformData.assessments.scores.stress) {
        context += ` Stress: ${platformData.assessments.scores.stress}/40`;
      }
      context += '\n';
    }
    
    if (platformData.appointments.upcoming > 0) {
      context += `Appointments: ${platformData.appointments.upcoming} upcoming (${platformData.appointments.completionRate}% completion rate)\n`;
    }
    
    context += '\nPlease use this context to provide personalized, empathetic responses while maintaining professional counseling standards.\n=== END CONTEXT ===\n\n';
    
    return context;
  };

  // Context value
  const value = {
    // State
    ...state,
    
    // Chat summary (separate)
    chatSummary: state.chatSummary,
    
    // Platform data (separate)
    platformData: state.platformData,
    
    // Methods
    refreshData,
    getChatSummaryForAI,
    getPlatformDataForAI,
    getFormattedAIContext,
    
    // Quick access getters
    isLoading: state.loading,
    hasError: !!state.error,
    hasData: !!state.user && !state.loading,
    lastUpdated: state.lastUpdated
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

// Custom hook for using the context
export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}

// Additional hooks for specific data access
export function useChatSummary() {
  const { chatSummary, getChatSummaryForAI, getFormattedAIContext } = useUserData();
  return {
    ...chatSummary,
    getForAI: getChatSummaryForAI,
    getFormattedContext: getFormattedAIContext
  };
}

export function usePlatformData() {
  const { platformData, getPlatformDataForAI } = useUserData();
  return {
    ...platformData,
    getForAI: getPlatformDataForAI
  };
}

export default UserDataContext;