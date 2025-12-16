import { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const useCounselorAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create counselor account with email and password
  const createCounselorAccount = async (counselorData, password = null) => {
    setLoading(true);
    setError(null);
    
    try {
      let authResult = null;
      let isExistingAccount = false;
      
      // Option 1: Create with password (if provided)
      if (password) {
        try {
          authResult = await createUserWithEmailAndPassword(
            auth, 
            counselorData.email, 
            password
          );
          
          // Update auth profile
          await updateProfile(authResult.user, {
            displayName: counselorData.name
          });
        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            // Email exists - we'll handle this by updating the existing account
            console.log('Email already exists, will update existing account');
            isExistingAccount = true;
            // Note: We can't change the password of existing Firebase Auth accounts from client-side
            // The account will keep its existing password
          } else {
            throw authError;
          }
        }
      }

      // Create counselor user document
      console.log('🏢 institutionCode from counselorData:', counselorData.institutionCode);
      const userData = {
        uid: authResult?.user?.uid || null,
        email: counselorData.email,
        name: counselorData.name,
        firstName: counselorData.firstName,
        lastName: counselorData.lastName,
        role: 'counselor',
        institutionCode: counselorData.institutionCode,
        counselorId: counselorData.counselorId,
        specialization: counselorData.specialization,
        department: counselorData.department,
        qualification: counselorData.qualification,
        experience: counselorData.experience,
        licenseNumber: counselorData.licenseNumber,
        phone: counselorData.phone,
        maxStudentsLoad: counselorData.maxStudentsLoad,
        workingHours: counselorData.workingHours,
        workingDays: counselorData.workingDays,
        bio: counselorData.bio,
        status: counselorData.status,
        assignedStudents: [],
        totalSessions: 0,
        activeCases: 0,
        profileComplete: true,
        emailVerified: false,
        passwordSet: !!password,
        createdAt: isExistingAccount ? new Date() : new Date(), // Always update timestamp
        updatedAt: new Date()
      };

      if (authResult?.user?.uid) {
        // Create user document if auth was successful
        console.log('🔧 Creating user document for UID:', authResult.user.uid);
        console.log('📄 User data:', userData);
        await setDoc(doc(db, 'users', authResult.user.uid), userData);
        console.log('✅ User document created successfully');
      } else if (isExistingAccount) {
        // For existing accounts, we need to find the UID and create/update the user document
        console.log('Existing account detected - attempting to find UID and create user document');
        
        try {
          // Try to find existing user document by email
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', counselorData.email),
            where('role', '==', 'counselor')
          );
          const usersSnapshot = await getDocs(usersQuery);
          
          if (!usersSnapshot.empty) {
            // User document exists, update it
            const existingUserDoc = usersSnapshot.docs[0];
            const existingData = existingUserDoc.data();
            
            await updateDoc(doc(db, 'users', existingUserDoc.id), {
              ...userData,
              uid: existingData.uid, // Preserve existing UID
              createdAt: existingData.createdAt || new Date(), // Preserve creation date
            });
            console.log('✅ Updated existing user document');
          } else {
            console.warn('⚠️ No user document found for existing auth account');
            console.log('🔄 The user will need to be created through other means or login system updated');
          }
        } catch (error) {
          console.warn('⚠️ Could not update user document for existing account:', error.message);
        }
      } else {
        console.warn('⚠️ No UID found and not an existing account - user document not created');
        console.warn('⚠️ This counselor will not be able to log in without a user document');
      }

      // Option 2: Send password setup email (if no password provided)
      if (!password) {
        await sendPasswordResetEmail(auth, counselorData.email);
        console.log('Password setup email sent to counselor');
      }

      return {
        success: true,
        uid: authResult?.user?.uid || null,
        userData,
        isExistingAccount,
        message: isExistingAccount 
          ? 'Counselor profile updated successfully! (Email already had an account)' 
          : (password 
            ? 'Counselor account created successfully!' 
            : 'Counselor added! Password setup email sent.')
      };

    } catch (error) {
      console.error('Error creating counselor account:', error);
      setError(error.message);
      
      let userFriendlyMessage = 'Failed to create counselor account. Please try again.';
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        userFriendlyMessage = 'This email is already registered. The counselor may already have an account, or you can try using a different email address.';
      } else if (error.code === 'auth/invalid-email') {
        userFriendlyMessage = 'Please provide a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        userFriendlyMessage = 'Password is too weak. Please use a stronger password with at least 6 characters.';
      } else if (error.code === 'auth/network-request-failed') {
        userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      return {
        success: false,
        error: error.message,
        code: error.code,
        message: userFriendlyMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Send welcome email to counselor
  const sendWelcomeEmail = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login?role=counselor`,
        handleCodeInApp: true
      });
      
      return {
        success: true,
        message: 'Welcome email sent successfully!'
      };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      setError(error.message);
      
      return {
        success: false,
        error: error.message,
        message: 'Failed to send welcome email. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  // Check if counselor email already exists
  const checkCounselorExists = async (email, institutionCode) => {
    try {
      // First try to check in users collection - this should always be accessible
      try {
        const usersQuery = query(
          collection(db, 'users'), 
          where('email', '==', email),
          where('role', '==', 'counselor')
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        if (!usersSnapshot.empty) {
          return { exists: true, location: 'users' };
        }
      } catch (usersError) {
        console.warn('Could not check users collection:', usersError.message);
        // Continue to check counselors collection
      }

      // Then try to check in root-level counselors collection
      try {
        const counselorsQuery = query(
          collection(db, 'counselors'),
          where('email', '==', email),
          where('institutionCode', '==', institutionCode)
        );
        const counselorsSnapshot = await getDocs(counselorsQuery);
        
        if (!counselorsSnapshot.empty) {
          return { exists: true, location: 'counselors' };
        }
      } catch (counselorsError) {
        console.warn('Could not check counselors collection:', counselorsError.message);
        // If we can't check counselors collection due to permissions,
        // assume it doesn't exist and let the creation attempt proceed
        // The actual creation will fail if there's a real conflict
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking counselor existence:', error);
      // If we can't check existence due to permissions, assume it doesn't exist
      // and let the creation attempt proceed - Firebase Auth will handle duplicates
      return { exists: false, error: error.message };
    }
  };

  // Update counselor profile
  const updateCounselorProfile = async (counselorId, institutionCode, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      // Update in root-level counselors collection
      const counselorRef = doc(db, 'counselors', counselorId);
      await updateDoc(counselorRef, {
        ...updates,
        updatedAt: new Date()
      });

      // Also update in users collection if uid exists
      const counselorDoc = await getDoc(counselorRef);
      if (counselorDoc.exists() && counselorDoc.data().uid) {
        const userRef = doc(db, 'users', counselorDoc.data().uid);
        await updateDoc(userRef, {
          ...updates,
          updatedAt: new Date()
        });
      }

      return {
        success: true,
        message: 'Counselor profile updated successfully!'
      };
    } catch (error) {
      console.error('Error updating counselor profile:', error);
      setError(error.message);
      
      return {
        success: false,
        error: error.message,
        message: 'Failed to update counselor profile. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  // Get counselor data by email
  const getCounselorByEmail = async (email) => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email),
        where('role', '==', 'counselor')
      );
      const snapshot = await getDocs(usersQuery);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          exists: true,
          data: { id: doc.id, ...doc.data() }
        };
      }
      
      return { exists: false };
    } catch (error) {
      console.error('Error getting counselor by email:', error);
      return { exists: false, error: error.message };
    }
  };

  // Fix existing counselor's institutionCode in user document
  const fixCounselorInstitutionCode = async (email, institutionCode) => {
    setLoading(true);
    setError(null);
    
    try {
      // Find the counselor user document
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email),
        where('role', '==', 'counselor')
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        const userId = userDoc.id;
        
        // Update the user document with the correct institutionCode
        await updateDoc(doc(db, 'users', userId), {
          institutionCode: institutionCode,
          updatedAt: new Date()
        });
        
        console.log(`✅ Updated counselor ${email} with institutionCode: ${institutionCode}`);
        
        return {
          success: true,
          message: 'Counselor institutionCode updated successfully!'
        };
      } else {
        return {
          success: false,
          message: 'Counselor user document not found'
        };
      }
    } catch (error) {
      console.error('Error fixing counselor institutionCode:', error);
      setError(error.message);
      
      return {
        success: false,
        error: error.message,
        message: 'Failed to fix counselor institutionCode'
      };
    } finally {
      setLoading(false);
    }
  };

  // Assign students to counselor
  const assignStudentsToCounselor = async (counselorId, institutionCode, studentIds) => {
    setLoading(true);
    setError(null);
    
    try {
      const counselorRef = doc(db, 'counselors', counselorId);
      const counselorDoc = await getDoc(counselorRef);
      
      if (counselorDoc.exists()) {
        const currentData = counselorDoc.data();
        const currentStudents = currentData.assignedStudents || [];
        const newStudents = [...new Set([...currentStudents, ...studentIds])]; // Remove duplicates
        
        await updateDoc(counselorRef, {
          assignedStudents: newStudents,
          activeCases: newStudents.length,
          updatedAt: new Date()
        });

        // Update students to reference this counselor
        for (const studentId of studentIds) {
          const studentRef = doc(db, 'students', studentId);
          await updateDoc(studentRef, {
            assignedCounselor: counselorId,
            counselorAssigned: currentData.name,
            updatedAt: new Date()
          });
        }

        return {
          success: true,
          message: `${studentIds.length} student(s) assigned to counselor successfully!`
        };
      } else {
        throw new Error('Counselor not found');
      }
    } catch (error) {
      console.error('Error assigning students to counselor:', error);
      setError(error.message);
      
      return {
        success: false,
        error: error.message,
        message: 'Failed to assign students to counselor. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createCounselorAccount,
    sendWelcomeEmail,
    checkCounselorExists,
    updateCounselorProfile,
    getCounselorByEmail,
    assignStudentsToCounselor,
    fixCounselorInstitutionCode
  };
};

export default useCounselorAuth;
