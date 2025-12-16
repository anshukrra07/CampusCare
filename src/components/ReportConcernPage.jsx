import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ReportConcernForm from './reports/ReportConcernForm';

export default function ReportConcernPage() {
  const [user] = useAuthState(auth);
  const [institutionCode, setInstitutionCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInstitution = async () => {
      if (!user) {
        // For anonymous users, use INST001 as the default institution code
        console.log('No user logged in, using INST001 for concern reporting');
        setInstitutionCode('INST001');
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setInstitutionCode(userData.institutionCode || 'INST001');
        } else {
          setInstitutionCode('INST001');
        }
      } catch (error) {
        console.error('Error fetching user institution:', error);
        setInstitutionCode('INST001');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInstitution();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return <ReportConcernForm institutionCode={institutionCode} />;
}