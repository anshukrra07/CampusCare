import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "./lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { LanguageProvider } from "./contexts/LanguageContext";

// Student Components
import Home from "./components/student/Home";
import Chat from "./components/student/Chat";
import Dashboard from "./components/student/Dashboard";
import Assessments from "./components/student/Assessments";
import MoodTracking from "./components/student/MoodTracking";
import Phq9 from "./components/student/Phq9";
import Gad7 from "./components/student/Gad7";
import StressScale from "./components/student/StressScale";
import EnhancedAIAssessment from "./components/student/EnhancedAIAssessment";
import Notifications from "./components/student/Notifications";
import SupportGroups from "./components/student/SupportGroups";
import Appointments from "./components/student/Appointments";
import ConnectSwitch from "./components/student/ConnectSwitch";
import Resources from "./components/student/Resources";
import CrisisSupport from "./components/student/CrisisSupport";
import ReportConcernPage from "./components/ReportConcernPage";

// Counselor Components
import CounselorDashboard from "./components/counselor/CounselorDashboard";
import CounselorChats from "./components/counselor/CounselorChats";

// Institution Components
import InstitutionDashboard from "./components/institution/InstitutionDashboard";

// Shared Components
import Login from "./components/shared/Login";
import Profile from "./components/shared/Profile";
import Layout from "./components/shared/Layout";
import DailyPopupManager from "./components/common/DailyPopupManager";



function App() {
  const [user, loading] = useAuthState(auth);
  const [role, setRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        console.log('🔍 Fetching role for user:', user.email);
        
        // First check localStorage for cached role
        const cachedRole = localStorage.getItem('userRole');
        console.log('🔍 Checking localStorage for cached role:', cachedRole);
        if (cachedRole) {
          console.log('✅ Using cached role:', cachedRole);
          setRole(cachedRole);
          setCheckingRole(false);
          return;
        }
        
        // If not cached, fetch from Firestore
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data().role) {
            const userRole = docSnap.data().role;
            console.log('✅ Found role in Firestore:', userRole);
            setRole(userRole);
            localStorage.setItem('userRole', userRole);
          } else {
            console.warn('⚠️ No role found for user');
            setRole("none");
          }
        } catch (error) {
          console.error('😨 Error fetching role:', error);
          setRole("none");
        }
      } else {
        console.log('🚪 User logged out, clearing role data');
        setRole(null);
        localStorage.removeItem('userRole');
      }
      
      setCheckingRole(false);
    };

    if (!loading) {
      fetchRole();
    }
  }, [user, loading]);

  if (loading || checkingRole) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/report-concern" element={<ReportConcernPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  if (role === "none") {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h1 className="text-2xl font-bold text-red-800">Access Denied</h1>
          <p className="text-red-700 mt-2">No valid role found for your account.</p>
          <p className="text-sm text-red-600 mt-2">Account: {user.email}</p>
          <button
            onClick={() => {
              auth.signOut();
              localStorage.removeItem('userRole');
            }}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  console.log('🎯 Rendering routes for role:', role);
  
  // Each role gets their own separate route tree - no cross-role access possible
  
  if (role === "student") {
    return (
      <LanguageProvider>
        <DailyPopupManager />
        <Routes>
          {/* Student-only routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/assessments" element={<Layout><Assessments /></Layout>} />
          <Route path="/chat" element={<Layout><Chat /></Layout>} />
          <Route path="/mood-tracking" element={<Layout><MoodTracking /></Layout>} />
          <Route path="/assessments/phq9" element={<Layout><Phq9 /></Layout>} />
          <Route path="/assessments/gad7" element={<Layout><Gad7 /></Layout>} />
          <Route path="/assessments/stress" element={<Layout><StressScale /></Layout>} />
          
          {/* AI Assessment Route */}
          <Route path="/assessments/targeted-ai" element={<Layout><EnhancedAIAssessment /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
          <Route path="/support-groups" element={<Layout><SupportGroups /></Layout>} />
          <Route path="/appointments" element={<Layout><Appointments /></Layout>} />
          <Route path="/connect" element={<Layout><ConnectSwitch /></Layout>} />
          <Route path="/resources" element={<Layout><Resources /></Layout>} />
          <Route path="/crisis-support" element={<Layout><CrisisSupport /></Layout>} />
          <Route path="/report-concern" element={<Layout><ReportConcernPage /></Layout>} />
          
          {/* All other routes redirect to student home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LanguageProvider>
    );
  }
  
  if (role === "counselor") {
    return (
      <LanguageProvider>
        <Routes>
          {/* Counselor-only routes */}
          <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
          <Route path="/chats" element={<Layout><CounselorChats /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
          <Route path="/support-groups" element={<Layout><SupportGroups /></Layout>} />
          <Route path="/appointments" element={<Layout><Appointments /></Layout>} />
          <Route path="/resources" element={<Layout><Resources /></Layout>} />
          <Route path="/crisis-support" element={<Layout><CrisisSupport /></Layout>} />
          
          {/* All other routes redirect to counselor dashboard */}
          <Route path="*" element={<Navigate to="/counselor-dashboard" replace />} />
        </Routes>
      </LanguageProvider>
    );
  }
  
  if (role === "institution") {
    return (
      <LanguageProvider>
        <Routes>
          {/* Institution-only routes */}
          <Route path="/institution-dashboard" element={<InstitutionDashboard />} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          
          {/* All other routes redirect to institution dashboard */}
          <Route path="*" element={<Navigate to="/institution-dashboard" replace />} />
        </Routes>
      </LanguageProvider>
    );
  }
  
  // If role is not recognized, show error
  console.error('Invalid role:', role);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-red-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Role</h1>
          <p className="text-gray-600 mb-4">User role "{role}" is not recognized.</p>
          <button
            onClick={() => {
              auth.signOut();
              localStorage.removeItem('userRole');
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Sign Out & Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;