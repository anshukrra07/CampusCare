import { useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import {
  HeartIcon,
  FaceSmileIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function Login() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null); // null, 'student', 'counselor', 'institution'
  const [institutionCode, setInstitutionCode] = useState("");

  // ✅ Redirect if already logged in based on role
  useEffect(() => {
    if (user) {
      // Get user role from localStorage or fetch from Firestore
      const userRole = localStorage.getItem('userRole');
      switch(userRole) {
        case 'institution':
          navigate('/institution-dashboard');
          break;
        case 'counselor':
          navigate('/counselor-dashboard');
          break;
        case 'student':
        default:
          navigate('/');
          break;
      }
    }
  }, [user, navigate]);

  // Google login (student only)
  const loginWithGoogle = async () => {
    if (selectedRole !== 'student') {
      setError('🛡️ Google login is only available for students.');
      return;
    }
    
    setIsLoading(true);
    setError("");
    setSuccessMsg("");
    
    try {
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      const cred = await signInWithPopup(auth, provider);

      // Validate Google account data
      if (!cred.user.email) {
        setError('📧 Unable to get email from Google account. Please try email login instead.');
        return;
      }

      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || cred.user.email,
          role: "student",
          createdAt: new Date(),
          lastLoginAt: new Date(),
          loginMethod: "google"
        },
        { merge: true }
      );

      localStorage.setItem('userRole', 'student');
      setSuccessMsg('✓ Successfully signed in with Google! Redirecting...');
      
      // Small delay to show success message
      setTimeout(() => {
        navigate("/");
      }, 1000);
      
    } catch (err) {
      console.error("Google Auth error:", err.code, err.message);
      
      // Handle Google-specific errors
      switch (err.code) {
        case "auth/popup-closed-by-user":
          setError('❌ Google sign-in was cancelled. Please try again.');
          break;
        case "auth/popup-blocked":
          setError('🚫 Popup blocked! Please allow popups for this site and try again.');
          break;
        case "auth/cancelled-popup-request":
          setError('⏹️ Sign-in was cancelled. Please try again.');
          break;
        case "auth/network-request-failed":
          setError('🌐 Network error. Please check your internet connection and try again.');
          break;
        case "auth/too-many-requests":
          setError('⏰ Too many attempts. Please wait a few minutes and try again.');
          break;
        case "auth/account-exists-with-different-credential":
          setError('📧 An account with this email already exists. Please sign in with email/password instead.');
          break;
        default:
          if (err.message.includes('popup')) {
            setError('📝 Google sign-in popup issue. Please try again or use email login.');
          } else {
            setError('❗ Google sign-in failed. Please try again or use email login.');
          }
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email login/register (for all roles)
  const loginWithEmail = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setSuccessMsg('');
    
    // Role validation
    if (!selectedRole) {
      setError('👤 Please select a role first.');
      return;
    }
    
    // Email validation (client-side)
    if (!email.trim()) {
      setError('📧 Email address is required.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('📧 Please enter a valid email address (e.g., user@example.com).');
      return;
    }
    
    // Password validation (client-side)
    if (!password.trim()) {
      setError('🔒 Password is required.');
      return;
    }
    
    if (isRegister && password.length < 6) {
      setError('🔒 Password must be at least 6 characters long.');
      return;
    }
    
    // Name validation for registration
    if (isRegister) {
      if (!name.trim()) {
        setError('👤 Full name is required for registration.');
        return;
      }
      
      if (name.trim().length < 2) {
        setError('👤 Name must be at least 2 characters long.');
        return;
      }
      
      if (name.trim().length > 50) {
        setError('👤 Name must be less than 50 characters.');
        return;
      }
      
      // Basic name validation (allow letters, spaces, hyphens, apostrophes)
      const nameRegex = /^[a-zA-Z\s\-']+$/;
      if (!nameRegex.test(name.trim())) {
        setError('👤 Name can only contain letters, spaces, hyphens, and apostrophes.');
        return;
      }
    }
    
    // Institution code validation for institution login
    if (selectedRole === 'institution') {
      if (!institutionCode.trim()) {
        setError('🏫 Institution code is required for institutional login.');
        return;
      }
      
      if (institutionCode.length < 3) {
        setError('🏫 Institution code must be at least 3 characters long.');
        return;
      }
      
      if (institutionCode.length > 20) {
        setError('🏫 Institution code must be less than 20 characters.');
        return;
      }
      
      // Only allow alphanumeric characters and basic symbols
      const validCodePattern = /^[A-Z0-9_-]+$/;
      if (!validCodePattern.test(institutionCode)) {
        setError('🏫 Institution code can only contain uppercase letters, numbers, hyphens, and underscores.');
        return;
      }
      
      // Check if institution code exists in database (only for login, not registration)
      if (!isRegister) {
        try {
          const institutionDoc = doc(db, 'institutions', institutionCode);
          const institutionSnap = await getDoc(institutionDoc);
          
          if (!institutionSnap.exists()) {
            setError('🏫 Institution code not found. Please check your institution code or contact your administrator.');
            return;
          }
          
          // Institution exists, validation passed
          // Note: We don't check admin email here - any valid user can be an admin
          console.log(`✅ Institution ${institutionCode} exists and is valid`);
          
        } catch (error) {
          console.error('Error checking institution:', error);
          setError('🌐 Unable to verify institution code. Please check your internet connection and try again.');
          return;
        }
      }
    }
    
    setIsLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      let cred;
      if (isRegister) {
        // Only allow registration for students and institutions
        if (selectedRole === 'counselor') {
          setError('Counselor accounts can only be created by institution administrators. Please contact your institution.');
          return;
        }
        
        cred = await createUserWithEmailAndPassword(auth, email, password);

        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name });
        }

        const userRole = selectedRole;
        await setDoc(
          doc(db, "users", cred.user.uid),
          {
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: name || cred.user.email,
            role: userRole,
            institutionCode: selectedRole === 'institution' ? institutionCode : null,
            createdAt: new Date(),
          },
          { merge: true }
        );
        
        // Create institution document structure if user is institution admin
        if (selectedRole === 'institution' && institutionCode) {
          await setDoc(
            doc(db, "institutions", institutionCode),
            {
              institutionCode: institutionCode,
              name: `Institution ${institutionCode}`, // Can be updated later
              adminEmail: cred.user.email,
              adminName: name || cred.user.email,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            { merge: true }
          );
        }

        await signOut(auth);
        setIsRegister(false);
        setSuccessMsg(`✓ ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} account created successfully! You can now sign in.`);
      } else {
        // Authenticate user first
        cred = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Authentication successful for:', cred.user.email);
        
        // Check user's actual role immediately after authentication
        const userDoc = await getDoc(doc(db, "users", cred.user.uid));
        console.log('🔍 User document exists:', userDoc.exists());
        
        let userRole = selectedRole;
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('📊 User document data:', userData);
          
          if (userData.role) {
            const actualRole = userData.role;
            console.log('👤 Found actual role:', actualRole, '| Selected role:', selectedRole);
            
            // If roles don't match, show warning and sign out immediately
            if (actualRole !== selectedRole) {
              console.warn('⚠️ Role mismatch detected - signing out');
              await signOut(auth);
              setError(`⚠️ Role mismatch! You selected "${selectedRole}" but your account is registered as "${actualRole}". Please select "${actualRole}" instead and try again.`);
              return;
            }
            
            userRole = actualRole;
            console.log('✅ Role validation passed. Proceeding with role:', userRole);
          } else {
            console.warn('⚠️ User document exists but no role field found');
            console.log('📊 Available fields:', Object.keys(userData));
          }
        } else {
          console.warn('⚠️ No user document found for UID:', cred.user.uid);
          console.log('🔍 Will proceed with selected role:', selectedRole);
        }
        // Update login timestamp
        await setDoc(
          doc(db, "users", cred.user.uid),
          {
            uid: cred.user.uid,
            email: cred.user.email,
            displayName: cred.user.displayName || email,
            role: userRole,
            institutionCode: userRole === 'institution' ? institutionCode : null,
            lastLoginAt: new Date(),
            loginMethod: "email"
          },
          { merge: true }
        );

        console.log('💾 Saving role to localStorage:', userRole);
        localStorage.setItem('userRole', userRole);
        
        // Show success message and redirect
        setSuccessMsg(`✓ Welcome back! Redirecting to your ${userRole} dashboard...`);
        
        console.log('🚀 Redirecting to dashboard for role:', userRole);
        setTimeout(() => {
          switch(userRole) {
            case 'institution':
              console.log('🚀 Navigating to /institution-dashboard');
              navigate('/institution-dashboard');
              break;
            case 'counselor':
              console.log('🚀 Navigating to /counselor-dashboard');
              navigate('/counselor-dashboard');
              break;
            case 'student':
            default:
              console.log('🚀 Navigating to / (student home)');
              navigate('/');
              break;
          }
        }, 1500);
      }
    } catch (err) {
      console.error("Auth error:", err.code, err.message);

      // Comprehensive error handling with accurate warnings
      switch (err.code) {
        // Registration errors
        case "auth/weak-password":
          setError("⚠️ Password is too weak. Please use at least 6 characters with a mix of letters and numbers.");
          break;
        case "auth/email-already-in-use":
          if (isRegister) {
            setError("✋ This email is already registered. Try signing in instead, or use a different email address.");
          } else {
            setError("🔍 Account found! Please check your password and try again.");
          }
          break;
        case "auth/invalid-email":
          setError("📧 Please enter a valid email address (e.g., user@example.com).");
          break;
        case "auth/missing-email":
          setError("📧 Email address is required. Please enter your email.");
          break;
        case "auth/invalid-password":
          setError("🔒 Please enter a valid password.");
          break;
        case "auth/missing-password":
          setError("🔒 Password is required. Please enter your password.");
          break;
          
        // Login errors
        case "auth/user-not-found":
          if (selectedRole === 'counselor') {
            setError("👩‍⚕️ Counselor account not found. Contact your institution administrator to create your account.");
          } else {
            setError("🚫 No account found with this email. Please register first or check your email address.");
          }
          break;
        case "auth/wrong-password":
          setError("🔐 Incorrect password. Please try again or reset your password.");
          break;
        case "auth/invalid-credential":
          setError("❌ Invalid email or password combination. Please check your credentials and try again.");
          break;
        case "auth/user-disabled":
          setError("🚫 Your account has been disabled. Please contact support for assistance.");
          break;
        case "auth/too-many-requests":
          setError("⏰ Too many failed attempts. Please wait a few minutes before trying again.");
          break;
          
        // Network and Firebase errors  
        case "auth/network-request-failed":
          setError("🌐 Network error. Please check your internet connection and try again.");
          break;
        case "auth/internal-error":
          setError("⚡ Server error. Please try again in a moment.");
          break;
        case "auth/configuration-not-found":
          setError("⚙️ Authentication configuration error. Please contact support.");
          break;
          
        // Google sign-in specific errors
        case "auth/popup-closed-by-user":
          setError("❌ Sign-in was cancelled. Please try again if you want to sign in with Google.");
          break;
        case "auth/popup-blocked":
          setError("🚫 Popup was blocked by your browser. Please allow popups and try again.");
          break;
        case "auth/cancelled-popup-request":
          setError("⏹️ Sign-in request was cancelled. Please try again.");
          break;
          
        // Account linking errors
        case "auth/account-exists-with-different-credential":
          setError("📧 An account already exists with this email using a different sign-in method. Try signing in with email/password.");
          break;
        case "auth/credential-already-in-use":
          setError("🔗 This credential is already associated with another account.");
          break;
          
        // Validation errors (custom)
        case "auth/invalid-display-name":
          setError("👤 Please enter a valid name (2-50 characters, letters only).");
          break;
          
        // Firestore/Database errors
        case "permission-denied":
          setError("🛡️ Permission denied. You don't have access to this resource.");
          break;
        case "unavailable":
          setError("📡 Service temporarily unavailable. Please try again later.");
          break;
        case "deadline-exceeded":
          setError("⏱️ Request timed out. Please check your connection and try again.");
          break;
          
        // Institution-specific errors
        default:
          if (err.message && err.message.includes('Institution code')) {
            setError("🏫 " + err.message);
          } else if (err.message && err.message.includes('role')) {
            setError("👤 " + err.message);
          } else if (err.message && err.message.includes('network')) {
            setError("🌐 Connection issue. Please check your internet and try again.");
          } else {
            setError("❗ An unexpected error occurred. Please try again or contact support if the problem persists.");
          }
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/login"); // ✅ send back to login
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!user ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-8 text-center">
              <div className="bg-white/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <HeartIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome to CampusCare</h1>
              <p className="text-indigo-100 text-sm">
                Your mental wellness journey starts here
              </p>
            </div>

            <div className="px-8 py-8">
              {/* Role Selection */}
              {!selectedRole ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">
                    Choose Your Access Type
                  </h3>
                  
                  {/* Student Login */}
                  <button
                    onClick={() => setSelectedRole('student')}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-medium transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg flex items-center justify-center space-x-3"
                  >
                    <UserIcon className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Student Login</div>
                      <div className="text-sm opacity-90">Access mental health support & resources</div>
                    </div>
                  </button>
                  
                  {/* Counselor Login */}
                  <button
                    onClick={() => setSelectedRole('counselor')}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-medium transition-all duration-200 hover:from-green-600 hover:to-green-700 hover:shadow-lg flex items-center justify-center space-x-3"
                  >
                    <HeartIcon className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Counselor Login</div>
                      <div className="text-sm opacity-90">Manage student wellness & support</div>
                    </div>
                  </button>
                  
                  {/* Institution Login */}
                  <button
                    onClick={() => setSelectedRole('institution')}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-xl font-medium transition-all duration-200 hover:from-purple-600 hover:to-purple-700 hover:shadow-lg flex items-center justify-center space-x-3"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="text-left">
                      <div className="font-semibold">Institution Admin</div>
                      <div className="text-sm opacity-90">Manage students, counselors & analytics</div>
                    </div>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      {selectedRole === 'student' && <UserIcon className="h-6 w-6 text-blue-500" />}
                      {selectedRole === 'counselor' && <HeartIcon className="h-6 w-6 text-green-500" />}
                      {selectedRole === 'institution' && <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {selectedRole} Login
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedRole === 'student' && 'Student Access Portal'}
                          {selectedRole === 'counselor' && 'Counselor Dashboard'}
                          {selectedRole === 'institution' && 'Administrative Panel'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRole(null);
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="text-gray-400 hover:text-gray-600 p-2"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Student Login Options */}
                  {selectedRole === 'student' && (
                    <>
                      <button
                        onClick={loginWithGoogle}
                        disabled={isLoading}
                        className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:border-gray-400 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-4"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Sign in with Google
                          </>
                        )}
                      </button>
                    </>
                  )}
                  
                  {/* Email/Password Form for all roles */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">
                        {selectedRole === 'student' ? 'Or continue with email' : 
                         selectedRole === 'counselor' ? 'Counselor Login' : 'Institution Admin Login'}
                      </span>
                    </div>
                  </div>

                      {/* Email/Password Form */}
                      <form onSubmit={loginWithEmail} className="space-y-4">
                        {isRegister && (
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                              required
                            />
                          </div>
                        )}
                        
                        {/* Institution Code for Institution Login */}
                        {selectedRole === 'institution' && (
                          <div className="relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <input
                              type="text"
                              placeholder="Institution Code (e.g., INST001)"
                              value={institutionCode}
                              onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                              required
                            />
                          </div>
                        )}
                        
                        <div className="relative">
                          <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            required
                          />
                        </div>
                        
                        <div className="relative">
                          <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isLoading}
                          className={`w-full text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                            selectedRole === 'counselor' 
                              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                              : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                          }`}
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>{isRegister ? `Create ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account` : "Sign In"}</>
                          )}
                        </button>
                        
                        {/* Show register option only for students and institutions */}
                        {selectedRole !== 'counselor' && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsRegister(!isRegister);
                              setError("");
                              setSuccessMsg("");
                            }}
                            className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
                          >
                            {isRegister
                              ? "Already have an account? Sign in"
                              : "Need an account? Create one"}
                          </button>
                        )}
                        
                        {/* Note for counselors */}
                        {selectedRole === 'counselor' && (
                          <div className="text-center">
                            <p className="text-sm text-gray-600 font-medium">
                              Counselor accounts are created by institution administrators.
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Contact your institution if you need an account.
                            </p>
                          </div>
                        )}
                      </form>
                </div>
              )}

              {/* Messages */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}
              {successMsg && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-700 text-sm font-medium">{successMsg}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-600 mb-3">
                {!selectedRole 
                  ? 'Choose your role to access the appropriate login method'
                  : selectedRole === 'student'
                  ? 'Students can use Google or email login'
                  : selectedRole === 'counselor'
                  ? 'Counselors: Contact your institution for account creation'
                  : 'Institution admins use email registration'
                }
              </p>
              
              {/* Report Concern Link */}
              <div className="border-t border-gray-200 pt-3">
                <a 
                  href="/report-concern"
                  className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors duration-200"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Report a Concern (No Login Required)
                </a>
                <p className="text-xs text-gray-500 mt-1">
                  Worried about a friend or classmate? Report concerns anonymously
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center animate-fadeIn">
            <div className="bg-green-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <FaceSmileIcon className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
            <p className="text-gray-600 mb-6">
              {user.displayName ? user.displayName : user.email}
            </p>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}