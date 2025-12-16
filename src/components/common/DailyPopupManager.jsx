import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import DailyMoodPopup from '../shared/DailyMoodPopup';
import DailyQuestionnairePopup from './DailyQuestionnairePopup';

const DailyPopupManager = () => {
  const [user] = useAuthState(auth);
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [showQuestionnairePopup, setShowQuestionnairePopup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (user) {
      checkDailyCompletions();
    }
  }, [user]);

  const checkDailyCompletions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if mood has been recorded today
      const moodDocRef = doc(db, 'users', user.uid, 'moods', today);
      const moodDoc = await getDoc(moodDocRef);
      const moodCompleted = moodDoc.exists();

      // Check if questionnaire has been completed today
      const questionnaireDocRef = doc(db, 'users', user.uid, 'questionnaire', today);
      const questionnaireDoc = await getDoc(questionnaireDocRef);
      const questionnaireCompleted = questionnaireDoc.exists();

      // Show popups in priority order: mood first, then questionnaire
      if (!moodCompleted) {
        setShowMoodPopup(true);
      } else if (!questionnaireCompleted) {
        setShowQuestionnairePopup(true);
      }

      setIsChecking(false);
    } catch (error) {
      console.error('Error checking daily completions:', error);
      setIsChecking(false);
    }
  };

  const handleMoodComplete = async (mood, streak) => {
    console.log('Mood completed:', mood, 'Streak:', streak);
    setShowMoodPopup(false);
    
    // After mood is completed, check if we should show questionnaire
    try {
      const today = new Date().toISOString().split('T')[0];
      const questionnaireDocRef = doc(db, 'users', user.uid, 'questionnaire', today);
      const questionnaireDoc = await getDoc(questionnaireDocRef);
      
      if (!questionnaireDoc.exists()) {
        // Add a small delay before showing questionnaire
        setTimeout(() => {
          setShowQuestionnairePopup(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking questionnaire status:', error);
    }
  };

  const handleQuestionnaireComplete = (answers, points, streak) => {
    console.log('Questionnaire completed:', { answers, points, streak });
    setShowQuestionnairePopup(false);
  };

  const handleMoodClose = () => {
    setShowMoodPopup(false);
    // Don't automatically show questionnaire if mood was dismissed
  };

  const handleQuestionnaireClose = () => {
    setShowQuestionnairePopup(false);
  };

  // Don't render anything while checking or if no user
  if (!user || isChecking) {
    return null;
  }

  return (
    <>
      {showMoodPopup && (
        <DailyMoodPopup 
          onClose={handleMoodClose}
          onComplete={handleMoodComplete}
        />
      )}
      
      {showQuestionnairePopup && (
        <DailyQuestionnairePopup
          onClose={handleQuestionnaireClose}
          onComplete={handleQuestionnaireComplete}
        />
      )}
    </>
  );
};

export default DailyPopupManager;