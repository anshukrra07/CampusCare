import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import {
  XMarkIcon,
  SparklesIcon,
  FireIcon,
  HeartIcon,
  CheckCircleIcon,
  StarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

const MOOD_OPTIONS = [
  {
    emoji: '😢',
    label: 'Struggling',
    value: 1,
    color: 'from-red-400 to-red-500',
    hoverColor: 'hover:from-red-300 hover:to-red-400',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    message: "It's okay to have tough days. You're brave for checking in! 💪",
    celebration: '🫂'
  },
  {
    emoji: '😔',
    label: 'Down',
    value: 2,
    color: 'from-orange-400 to-orange-500',
    hoverColor: 'hover:from-orange-300 hover:to-orange-400',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    message: "Tomorrow is a new day filled with possibilities! 🌅",
    celebration: '🤗'
  },
  {
    emoji: '😐',
    label: 'Okay',
    value: 3,
    color: 'from-yellow-400 to-yellow-500',
    hoverColor: 'hover:from-yellow-300 hover:to-yellow-400',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    message: "Steady as you go! Every day matters. 🚶‍♀️",
    celebration: '👍'
  },
  {
    emoji: '🙂',
    label: 'Good',
    value: 4,
    color: 'from-green-400 to-green-500',
    hoverColor: 'hover:from-green-300 hover:to-green-400',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    message: "Great to see you feeling good! Keep it up! 🌟",
    celebration: '🎉'
  },
  {
    emoji: '😃',
    label: 'Amazing',
    value: 5,
    color: 'from-blue-400 to-purple-500',
    hoverColor: 'hover:from-blue-300 hover:to-purple-400',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    message: "You're absolutely glowing today! Spread that joy! ✨",
    celebration: '🎊'
  },
];

const MOTIVATIONAL_MESSAGES = [
  "How's your vibe today? ✨",
  "Ready to check in with yourself? 🌟",
  "Your mood matters! Let's see how you're doing 💫",
  "Time for your daily wellness moment! 🌸",
  "Let's capture today's energy! ⚡",
];

const STREAK_REWARDS = {
  1: { emoji: '🌱', message: 'Great start!' },
  3: { emoji: '🔥', message: 'On fire!' },
  7: { emoji: '⭐', message: 'Week warrior!' },
  14: { emoji: '💎', message: 'Diamond streak!' },
  30: { emoji: '👑', message: 'Mood master!' },
  100: { emoji: '🏆', message: 'Legend status!' },
};

export default function DailyMoodPopup() {
  const [user] = useAuthState(auth);
  const [show, setShow] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [streak, setStreak] = useState(0);
  const [todayLogged, setTodayLogged] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [showStreakReward, setShowStreakReward] = useState(false);
  const [streakReward, setStreakReward] = useState(null);

  useEffect(() => {
    if (user) {
      checkShouldShow();
    }
  }, [user]);

  useEffect(() => {
    if (show) {
      // Animate in after a small delay
      setTimeout(() => setAnimateIn(true), 100);
      // Set random motivational message
      setMotivationalMessage(MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]);
    }
  }, [show]);

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const checkShouldShow = async () => {
    try {
      const today = getTodayDate();
      
      // Check if already logged today
      const moodDoc = await getDoc(doc(db, 'users', user.uid, 'moods', today));
      if (moodDoc.exists()) {
        setTodayLogged(true);
        return;
      }

      // Check if popup was already dismissed today
      const dismissedToday = localStorage.getItem(`moodPopupDismissed_${today}`);
      if (dismissedToday) {
        return;
      }

      // Get current streak
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setStreak(userData.moodStreak || 0);
      }

      // Show popup after a delay (2 seconds after page load)
      setTimeout(() => {
        setShow(true);
      }, 2000);

    } catch (error) {
      console.error('Error checking mood status:', error);
    }
  };

  const handleMoodSelect = async (moodValue) => {
    if (todayLogged || submitting) return;

    setSubmitting(true);
    setSelectedMood(moodValue);

    try {
      const today = getTodayDate();
      const moodData = {
        mood: moodValue,
        date: today,
        timestamp: serverTimestamp(),
        userId: user.uid,
        source: 'daily_popup' // Track that this came from popup
      };

      // Save mood entry
      await setDoc(doc(db, 'users', user.uid, 'moods', today), moodData);

      // Update user's mood streak
      const newStreak = streak + 1;
      await setDoc(doc(db, 'users', user.uid), {
        moodStreak: newStreak,
        lastMoodDate: today,
        totalMoodEntries: (await getDoc(doc(db, 'users', user.uid))).data()?.totalMoodEntries + 1 || 1,
      }, { merge: true });

      setStreak(newStreak);
      setTodayLogged(true);
      setShowSuccess(true);

      // Check for streak rewards
      if (STREAK_REWARDS[newStreak]) {
        setStreakReward(STREAK_REWARDS[newStreak]);
        setTimeout(() => {
          setShowStreakReward(true);
        }, 1000);
      }

      // Auto-close after celebration
      setTimeout(() => {
        setShow(false);
      }, 4000);

    } catch (error) {
      console.error('Error saving mood:', error);
      setSelectedMood(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    const today = getTodayDate();
    localStorage.setItem(`moodPopupDismissed_${today}`, 'true');
    setShow(false);
  };

  const selectedMoodData = MOOD_OPTIONS.find(mood => mood.value === selectedMood);

  if (!show || !user || todayLogged) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-40 transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`} />
      
      {/* Popup */}
      <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-500 ${
        animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-md w-full mx-4">
          {/* Floating elements */}
          <div className="absolute top-4 right-4 opacity-20">
            <SparklesIcon className="h-8 w-8 text-purple-500 animate-pulse" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-20">
            <HeartIcon className="h-6 w-6 text-pink-500 animate-bounce" />
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
          >
            <XMarkIcon className="h-4 w-4 text-gray-500 hover:text-gray-700" />
          </button>

          {!showSuccess ? (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 px-8 py-6 text-center text-white">
                <div className="text-4xl mb-3">🌈</div>
                <h2 className="text-xl font-bold mb-2">Daily Mood Check-in!</h2>
                <p className="text-purple-100 text-sm">{motivationalMessage}</p>
                {streak > 0 && (
                  <div className="mt-3 flex items-center justify-center space-x-1 bg-white bg-opacity-20 rounded-full px-3 py-1">
                    <FireIcon className="h-4 w-4 text-orange-300" />
                    <span className="text-sm font-medium">{streak} day streak!</span>
                  </div>
                )}
              </div>

              {/* Mood Options */}
              <div className="p-6">
                <p className="text-center text-gray-600 mb-6 text-sm">
                  Tap the emoji that matches your energy right now:
                </p>
                
                <div className="grid grid-cols-5 gap-3">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => handleMoodSelect(mood.value)}
                      disabled={submitting}
                      className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-110 hover:shadow-lg ${
                        selectedMood === mood.value
                          ? `${mood.bgColor} ${mood.borderColor} shadow-lg scale-105`
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      } ${submitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1 group-hover:scale-125 transition-transform duration-200">
                          {mood.emoji}
                        </div>
                        <p className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                          {mood.label}
                        </p>
                      </div>
                      
                      {/* Hover glow effect */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${mood.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    </button>
                  ))}
                </div>

                {submitting && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-purple-50 rounded-full">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-3"></div>
                      <span className="text-sm text-purple-700">Saving your mood...</span>
                    </div>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    💫 Building your wellness journey, one day at a time
                  </p>
                </div>
              </div>
            </>
          ) : (
            // Success state
            <div className="p-8 text-center">
              {!showStreakReward ? (
                <>
                  <div className="text-6xl mb-4 animate-bounce">{selectedMoodData?.celebration}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Awesome!</h3>
                  <p className="text-gray-600 mb-4">{selectedMoodData?.message}</p>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4">
                    <div className="flex items-center justify-center space-x-2 text-green-700">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span className="font-medium">Day {streak} completed!</span>
                    </div>
                    {streak > 1 && (
                      <p className="text-sm text-green-600 mt-2">
                        You're building an incredible habit! 🌟
                      </p>
                    )}
                  </div>
                </>
              ) : (
                // Streak reward celebration
                <div className="animate-fadeIn">
                  <div className="text-8xl mb-4 animate-pulse">{streakReward?.emoji}</div>
                  <h3 className="text-2xl font-bold text-purple-900 mb-2">
                    {streak} Day Streak!
                  </h3>
                  <p className="text-xl text-purple-700 font-semibold mb-4">
                    {streakReward?.message}
                  </p>
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4">
                    <TrophyIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-purple-800">
                      You're doing amazing! Keep up the fantastic work! 🎊
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}