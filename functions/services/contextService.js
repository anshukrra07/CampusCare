// services/contextService.js - Unified context loading and management
const { getFirestore } = require("firebase-admin/firestore");
const { 
  calculateAge, 
  normalizeToArray, 
  formatDateTime,
  getAppointmentTypeEmoji,
  getAppointmentStatusEmoji
} = require('../utils/helpers');

// Initialize db only when needed
let db;
function getDB() {
  if (!db) {
    db = getFirestore();
  }
  return db;
}

/**
 * Get comprehensive user profile context with caching
 */
async function getUserProfileContext(userId, { forceRefresh = false } = {}) {
  console.log(`📋 Getting profile context for: ${userId}`);

  try {
    const profileCacheRef = getDB().collection("users").doc(userId).collection("meta").doc("profileCache");
    const profileCacheDoc = await profileCacheRef.get();

    // Use cached profile summary if available
    if (profileCacheDoc.exists && !forceRefresh) {
      console.log("⚡ Using cached profile context");
      return profileCacheDoc.data();
    }

    // Build new profile summaries
    const profileSummary = {
      profileSummary: "No profile yet",
      assessmentSummary: "No assessments yet",
      moodSummary: "No mood entries yet", 
      alertSummary: "No alerts yet",
      appointmentsSummary: "No appointments scheduled",
      updatedAt: new Date(),
    };

    // Load all profile data in parallel for efficiency
    const [userProfile, assessments, moods, alerts, appointments] = await Promise.all([
      getUserProfile(userId),
      getAssessmentHistory(userId),
      getMoodHistory(userId),
      getAlertHistory(userId),
      getAppointmentHistory(userId)
    ]);

    // Process each data type
    if (userProfile) {
      profileSummary.profileSummary = formatUserProfile(userProfile);
    }

    if (assessments.length > 0) {
      profileSummary.assessmentSummary = formatAssessments(assessments);
    }

    if (moods.length > 0) {
      profileSummary.moodSummary = formatMoodHistory(moods);
    }

    if (alerts.length > 0) {
      profileSummary.alertSummary = formatAlerts(alerts);
    }

    if (appointments.length > 0) {
      profileSummary.appointmentsSummary = formatAppointments(appointments);
    }

    // Cache the new profile summary
    await profileCacheRef.set(profileSummary);
    console.log("💾 Cached new profile summary");

    return profileSummary;

  } catch (error) {
    console.error("❌ Error in getUserProfileContext:", error);
    return {
      profileSummary: "Error loading profile",
      assessmentSummary: "",
      moodSummary: "", 
      alertSummary: "",
      appointmentsSummary: "",
      updatedAt: new Date(),
    };
  }
}

/**
 * Get user's basic profile information
 */
async function getUserProfile(userId) {
  try {
    const userDoc = await getDB().collection("users").doc(userId).get();
    return userDoc.exists ? userDoc.data() : null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Get user's assessment history
 */
async function getAssessmentHistory(userId, limit = 5) {
  try {
    // Try ordering by created_at first
    const assessSnap = await getDB().collection("users").doc(userId).collection("assessments")
      .orderBy("created_at", "desc").limit(limit).get();
    
    return assessSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    // Fallback to date ordering if created_at index doesn't exist
    console.log('⚠️ Using fallback assessment query with date ordering');
    try {
      const assessSnap = await getDB().collection("users").doc(userId).collection("assessments")
        .orderBy("date", "desc").limit(limit).get();
      return assessSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (fallbackError) {
      console.error("Error fetching assessments:", fallbackError);
      return [];
    }
  }
}

/**
 * Get user's mood history
 */
async function getMoodHistory(userId, limit = 3) {
  try {
    let moodSnap;
    
    // Try different ordering strategies
    try {
      moodSnap = await getDB().collection("users").doc(userId).collection("moods")
        .orderBy("created_at", "desc").limit(limit).get();
    } catch (orderErr) {
      try {
        moodSnap = await getDB().collection("users").doc(userId).collection("moods")
          .orderBy("timestamp", "desc").limit(limit).get();
      } catch (timestampErr) {
        moodSnap = await getDB().collection("users").doc(userId).collection("moods")
          .limit(limit).get();
      }
    }
    
    return moodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching mood history:", error);
    return [];
  }
}

/**
 * Get user's alert history
 */
async function getAlertHistory(userId, limit = 10) {
  try {
    const alertsSnap = await getDB().collection("users").doc(userId).collection("alerts")
      .orderBy("created_at", "desc").limit(limit).get();
    return alertsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }
}

/**
 * Get user's appointment history
 */
async function getAppointmentHistory(userId, limit = 10) {
  try {
    const apptSnap = await getDB().collection('users').doc(userId).collection('appointments')
      .limit(limit).get();
    return apptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
}

/**
 * Get recent chat context
 */
async function getChatContext(userId, limit = 6) {
  try {
    const chatsSnap = await getDB().collection("users").doc(userId).collection("chats")
      .orderBy("created_at", "desc").limit(limit).get();
    
    if (chatsSnap.empty) {
      return "No recent chats";
    }
    
    // Get last messages with emotion data
    const chats = chatsSnap.docs.reverse().map(d => {
      const data = d.data();
      const emotion = data.meta?.emotion;
      let emotionInfo = '';
      
      if (emotion) {
        emotionInfo = ` [${emotion.emotion}:${emotion.intensity}%]`;
      }
      
      return `${data.role}: ${data.text}${emotionInfo}`;
    }).join(" | ");
    
    return chats;
    
  } catch (error) {
    console.error("❌ Error getting chat context:", error);
    return "";
  }
}

/**
 * Format user profile information
 */
function formatUserProfile(profile) {
  const name = profile.name || profile.displayName || "Student";
  const role = profile.role || "student";
  const gender = profile.gender ? ` (${profile.gender})` : "";
  const age = profile.birthDate ? `, age ${calculateAge(profile.birthDate)}` : "";
  
  // Handle interests/hobbies
  let interestsText = "";
  const interestsData = profile.interests || profile.hobbies;
  if (interestsData) {
    const interests = normalizeToArray(interestsData);
    if (interests.length > 0) {
      interestsText = ` | Interests: ${interests.join(", ")}`;
    }
  }
  
  const email = profile.email ? ` | Contact: ${profile.email}` : "";
  
  return `${name}${gender}${age} (${role})${interestsText}${email}`;
}

/**
 * Format assessment history
 */
function formatAssessments(assessments) {
  return assessments.map(assessment => {
    const time = assessment.created_at ? 
      formatDateTime(assessment.created_at).time : '';
    const timeText = time ? ` at ${time}` : '';
    
    return `${assessment.testName || "Test"}: ${assessment.score || "N/A"} (${assessment.severity || "N/A"}) on ${assessment.date || "Unknown"}${timeText}`;
  }).join("; ");
}

/**
 * Format mood history with trends
 */
function formatMoodHistory(moods) {
  const moodEntries = moods.map(mood => {
    const moodValue = mood.mood || mood.moodLevel || mood.feeling || mood.value || 'Unknown';
    const intensity = mood.intensity ? ` (${mood.intensity}/10)` : '';
    
    const dateTime = formatDateTime(mood.created_at || mood.timestamp);
    const timeText = dateTime.time ? ` at ${dateTime.time}` : '';
    
    const notes = mood.notes ? ` - "${mood.notes.slice(0, 30)}..."` : '';
    
    // Handle activities
    const activities = normalizeToArray(mood.activities);
    const activitiesText = activities.length > 0 ? ` | Activities: ${activities.join(', ')}` : '';
    
    return `${moodValue}${intensity} on ${dateTime.date}${timeText}${notes}${activitiesText}`;
  }).join('; ');
  
  // Calculate mood trends
  const moodsList = moods.map(m => m.mood || m.feeling || 'neutral');
  const moodCounts = {};
  moodsList.forEach(mood => moodCounts[mood] = (moodCounts[mood] || 0) + 1);
  const topMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b, 'neutral');
  
  return `Recent: ${moodEntries} | Most common: ${topMood} (${moods.length} total entries)`;
}

/**
 * Format alert history
 */
function formatAlerts(alerts) {
  return alerts.map(alert => {
    const dateTime = formatDateTime(alert.created_at);
    return `${alert.reason || 'Alert'} (${dateTime.date})`;
  }).join("; ");
}

/**
 * Format appointment history
 */
function formatAppointments(appointments) {
  const appointmentDetails = appointments.map(appt => {
    const counselor = appt.counselorName || appt.counselor || appt.doctor || "Counselor";
    const date = appt.scheduledDate || appt.date || appt.appointmentDate || "Unknown date";
    const time = appt.scheduledTime || appt.time || "Time TBD";
    const type = appt.type || "in-person";
    const status = appt.status || "scheduled";
    const notes = appt.notes ? ` | Notes: "${appt.notes.slice(0, 40)}..."` : '';
    
    // Handle specialties
    const specialties = normalizeToArray(appt.counselorSpecialties);
    const specialtiesText = specialties.length > 0 ? ` | Specialties: ${specialties.join(', ')}` : '';
    
    const meetingType = getAppointmentTypeEmoji(type);
    const statusEmoji = getAppointmentStatusEmoji(status);
    
    return `${statusEmoji} ${counselor} | ${date} at ${time} | ${meetingType}${specialtiesText}${notes}`;
  }).join('; ');
  
  // Count appointment types
  const types = appointments.map(a => a.type || 'in-person');
  const typeCounts = {};
  types.forEach(type => typeCounts[type] = (typeCounts[type] || 0) + 1);
  const typesSummary = Object.keys(typeCounts).map(type => `${typeCounts[type]} ${type}`).join(', ');
  
  return `${appointmentDetails} | Total: ${appointments.length} appointments (${typesSummary})`;
}

/**
 * Fast combined user context
 */
async function getUserCompleteContext(userId, { forceRefresh = false } = {}) {
  try {
    // Run profile and chat context in parallel for speed
    const [profileContext, chatSummary] = await Promise.all([
      getUserProfileContext(userId, { forceRefresh }),
      getChatContext(userId)
    ]);
    
    return {
      ...profileContext,
      chatSummary
    };
    
  } catch (error) {
    console.error("❌ Error in getUserCompleteContext:", error);
    return {
      profileSummary: "Error loading profile",
      assessmentSummary: "",
      moodSummary: "",
      alertSummary: "",
      appointmentsSummary: "",
      chatSummary: ""
    };
  }
}

module.exports = {
  getUserProfileContext,
  getUserProfile,
  getAssessmentHistory,
  getMoodHistory,
  getAlertHistory,
  getAppointmentHistory,
  getChatContext,
  getUserCompleteContext,
  formatUserProfile,
  formatAssessments,
  formatMoodHistory,
  formatAlerts,
  formatAppointments
};