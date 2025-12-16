import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  VideoCameraIcon,
  PhoneIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { auth, db } from '../../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  doc,
  getDoc,
  where,
  updateDoc,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import EarlyWarningSystem from '../institution/EarlyWarningSystem';
import SessionsManagement from './SessionsManagement';
import ReportsManagement from './ReportsManagement';
import ConcernReportsManagement from './ConcernReportsManagement';
import CounselorChatView from './CounselorChatView';

export default function CounselorDashboard() {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [studentsData, setStudentsData] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [institutionCode, setInstitutionCode] = useState(null);

  // Load user data and institution code first, then students
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    if (institutionCode) {
      loadStudents();
      loadAppointments();
      loadChats();
    }
  }, [institutionCode]);

  const loadUserData = async () => {
    try {
      console.log('🔍 Loading counselor user data for:', user.uid, user.email);
      
      // First try to get from users collection
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('👤 Found user data:', userData);
        setCurrentUser(userData);
        
        if (userData.institutionCode) {
          console.log('🏫 Institution code from users:', userData.institutionCode);
          setInstitutionCode(userData.institutionCode);
          return;
        }
      }
      
      // If no institutionCode in users collection, try counselors collection
      console.log('🔍 Searching counselors collection for:', user.email);
      const counselorsRef = collection(db, 'counselors');
      const q = query(counselorsRef, where('email', '==', user.email));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const counselorData = snapshot.docs[0].data();
        console.log('👤 Found counselor data:', counselorData);
        
        if (counselorData.institutionCode) {
          console.log('🏫 Institution code from counselors:', counselorData.institutionCode);
          
          // Update user document with missing institutionCode
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              institutionCode: counselorData.institutionCode
            });
            console.log('✅ Updated user document with institution code');
          } catch (updateError) {
            console.warn('⚠️ Could not update user document:', updateError.message);
          }
          
          setCurrentUser({ ...userDoc.exists() ? userDoc.data() : {}, ...counselorData });
          setInstitutionCode(counselorData.institutionCode);
          return;
        }
      }
      
      // If still no institution code found, we'll show an error message instead of infinite loading
      console.warn('⚠️ No institution code found - counselor may not be properly configured');
      setCurrentUser({ role: 'counselor', email: user.email });
      setInstitutionCode('NOT_CONFIGURED');
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setCurrentUser({ role: 'counselor', email: user.email });
      setInstitutionCode('ERROR');
    }
  };

  const loadStudents = async () => {
    if (!institutionCode || institutionCode === 'NOT_CONFIGURED' || institutionCode === 'ERROR') {
      console.log('⏳ No valid institution code, skipping student loading');
      setLoading(false);
      return;
    }
    
    console.log('📚 Loading students for institution:', institutionCode);
    setLoading(true);
    try {
      // Use same data source as institution dashboard: institutions/{institutionCode}/students
      const studentsRef = collection(db, 'institutions', institutionCode, 'students');
      const q = query(studentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const students = [];
      
      querySnapshot.forEach((doc) => {
        students.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('✅ Loaded', students.length, 'students for counselor');
      setStudentsData(students);
      
      // If no students found, show sample data so counselor can see the interface
      if (students.length === 0) {
        console.log('📝 No students found, showing sample data for demo...');
        const sampleStudents = [
          {
            id: 'sample1',
            name: 'Sample Student - Emma Wilson',
            email: 'emma.wilson@sample.edu',
            phone: '+1 (555) 123-4567',
            course: 'BTech Computer Science',
            year: 2,
            semester: 1,
            gpa: 2.1,
            averageAttendance: 65,
            averageMarks: 58,
            wellnessScore: 3.2,
            status: 'At Risk',
            studentId: 'STU001',
            attendanceData: [
              { date: '2024-01-15', present: false },
              { date: '2024-01-16', present: true },
              { date: '2024-01-17', present: false },
              { date: '2024-01-18', present: false },
              { date: '2024-01-19', present: true }
            ],
            biMonthlyMarks: [
              { period: 'Nov-Dec 2023', marks: 75 },
              { period: 'Jan-Feb 2024', marks: 58 }
            ],
            socialClubs: [],
            socialClubHistory: [{ timestamp: '2024-01-01', action: 'dropped_all_clubs' }]
          },
          {
            id: 'sample2',
            name: 'Sample Student - David Chen',
            email: 'david.chen@sample.edu',
            course: 'MBA Finance',
            gpa: 3.5,
            averageAttendance: 85,
            wellnessScore: 7.1,
            status: 'Active',
            studentId: 'STU002'
          }
        ];
        setStudentsData(sampleStudents);
      }
    } catch (error) {
      console.error('❌ Error loading students:', error);
      console.log('📝 Showing sample data due to error');
      // Show sample data even on error so the interface is functional
      setStudentsData([
        {
          id: 'demo1',
          name: 'Demo Student (No Data Access)',
          email: 'demo@sample.edu',
          course: 'Demo Course',
          gpa: 3.0,
          averageAttendance: 75,
          wellnessScore: 5.0,
          status: 'Active',
          studentId: 'DEMO001'
        }
      ]);
    } finally {
      setLoading(false);
      console.log('🏁 Finished loading students');
    }
  };

  const loadAppointments = async () => {
    if (!user || !institutionCode || institutionCode === 'NOT_CONFIGURED' || institutionCode === 'ERROR') {
      console.log('⏳ No valid user or institution code, skipping appointment loading');
      setAppointmentsLoading(false);
      return;
    }

    console.log('📅 Loading appointments for counselor:', user.email);
    setAppointmentsLoading(true);
    
    try {
      // First, get counselor document ID
      const counselorsRef = collection(db, 'counselors');
      const counselorQuery = query(counselorsRef, where('email', '==', user.email));
      const counselorSnapshot = await getDocs(counselorQuery);
      
      if (counselorSnapshot.empty) {
        console.warn('No counselor document found for email:', user.email);
        setAppointments([]);
        setAppointmentsLoading(false);
        return;
      }
      
      const counselorDocId = counselorSnapshot.docs[0].id;
      console.log('Found counselor document ID for appointments:', counselorDocId);
      
      // Get appointments from the counselor's subcollection
      const appointmentsRef = collection(db, 'counselors', counselorDocId, 'appointments');
      const q = query(
        appointmentsRef,
        orderBy('scheduledDate', 'asc')
      );
      
      // Set up real-time listener for appointments
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const appointmentsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`📅 Loaded ${appointmentsList.length} appointments for counselor`);
        setAppointments(appointmentsList);
        setAppointmentsLoading(false);
      }, (error) => {
        console.error('❌ Error fetching appointments:', error);
        
        // If index is still building, try a simpler query without orderBy
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          console.log('⏳ Index still building for appointments, trying simpler query...');
          
          const simpleQuery = query(appointmentsRef);
          
          const fallbackUnsubscribe = onSnapshot(simpleQuery, (snapshot) => {
            const appointmentsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
            
            console.log(`📅 Loaded ${appointmentsList.length} appointments (fallback query)`);
            setAppointments(appointmentsList);
            setAppointmentsLoading(false);
          }, (fallbackError) => {
            console.error('❌ Fallback appointment query also failed:', fallbackError);
            setAppointments([]);
            setAppointmentsLoading(false);
          });
          
          return fallbackUnsubscribe;
        } else {
          setAppointments([]);
          setAppointmentsLoading(false);
        }
      });
      
      return unsubscribe;
      
    } catch (error) {
      console.error('❌ Error setting up appointment listener:', error);
      setAppointments([]);
      setAppointmentsLoading(false);
    }
  };

  const loadChats = async () => {
    if (!user || !institutionCode || institutionCode === 'NOT_CONFIGURED' || institutionCode === 'ERROR') {
      console.log('⏳ No valid user or institution code, skipping chat loading');
      setChatsLoading(false);
      return;
    }

    console.log('💬 Loading chats for counselor:', user.email);
    setChatsLoading(true);
    
    try {
      // First, get the counselor document ID
      const counselorsRef = collection(db, 'counselors');
      const counselorQuery = query(counselorsRef, where('email', '==', user.email));
      const counselorSnapshot = await getDocs(counselorQuery);
      
      if (counselorSnapshot.empty) {
        console.warn('No counselor document found for email:', user.email);
        setChats([]);
        setChatsLoading(false);
        return;
      }
      
      const counselorDocId = counselorSnapshot.docs[0].id;
      console.log('Found counselor document ID:', counselorDocId);
      
      // Get active chats from the counselor's subcollection
      const chatsRef = collection(db, 'counselors', counselorDocId, 'chats');
      const q = query(
        chatsRef,
        where('status', '==', 'active'),
        orderBy('lastMessageAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`💬 Loaded ${chatsList.length} active chats for counselor`);
        setChats(chatsList);
        setChatsLoading(false);
      }, (error) => {
        console.error('❌ Error fetching chats:', error);
        
        // If index is still building, try a simpler query without orderBy
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          console.log('⏳ Index still building for chats, trying simpler query...');
          
          const simpleQuery = query(
            chatsRef,
            where('status', '==', 'active')
          );
          
          const fallbackUnsubscribe = onSnapshot(simpleQuery, (snapshot) => {
            const chatsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            console.log(`💬 Loaded ${chatsList.length} chats (fallback query)`);
            setChats(chatsList);
            setChatsLoading(false);
          }, (fallbackError) => {
            console.error('❌ Fallback chat query also failed:', fallbackError);
            setChats([]);
            setChatsLoading(false);
          });
          
          return fallbackUnsubscribe;
        } else {
          setChats([]);
          setChatsLoading(false);
        }
      });
      
      return unsubscribe;
      
    } catch (error) {
      console.error('❌ Error setting up chat listener:', error);
      setChats([]);
      setChatsLoading(false);
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      // Get counselor document ID first
      const counselorsRef = collection(db, 'counselors');
      const counselorQuery = query(counselorsRef, where('email', '==', user.email));
      const counselorSnapshot = await getDocs(counselorQuery);
      
      if (counselorSnapshot.empty) {
        console.error('No counselor document found for email:', user.email);
        alert('Error: Counselor profile not found. Please contact administrator.');
        return;
      }
      
      const counselorDocId = counselorSnapshot.docs[0].id;
      const appointmentRef = doc(db, 'counselors', counselorDocId, 'appointments', appointmentId);
      
      await updateDoc(appointmentRef, {
        status: action, // 'confirmed' or 'cancelled'
        updatedAt: serverTimestamp()
      });
      
      console.log(`Appointment ${appointmentId} ${action}`);
      alert(`Appointment ${action} successfully!`);
      
    } catch (error) {
      console.error(`Error ${action} appointment:`, error);
      alert(`Failed to ${action} appointment. Please try again.`);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    localStorage.removeItem('userRole');
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: HeartIcon },
    { id: 'appointments', name: 'Appointments', icon: CalendarDaysIcon },
    { id: 'chats', name: 'Student Chats', icon: ChatBubbleLeftRightIcon },
    { id: 'early-warning', name: 'Early Warning', icon: ShieldExclamationIcon },
    { id: 'sessions', name: 'Sessions', icon: CalendarDaysIcon },
    { id: 'concerns', name: 'Concern Reports', icon: ExclamationTriangleIcon },
    { id: 'reports', name: 'Reports', icon: DocumentTextIcon },
  ];

  // Filter students to show only current students who are in early warnings, chats, or appointments
  const getCurrentRelevantStudents = () => {
    if (studentsData.length === 0) return [];
    
    // Get students with early warnings (at-risk status or active alerts)
    const studentsWithEarlyWarnings = studentsData.filter(student => {
      // Check if student has 'At Risk' status
      if (student.status === 'At Risk') return true;
      
      // Check if student has active early warning signals
      const alerts = detectEarlyWarningSignals(student);
      return alerts.length > 0;
    });
    
    // Get students with active chats
    const studentIdsInActiveChats = new Set(chats.map(chat => chat.studentId));
    const studentsWithActiveChats = studentsData.filter(student => 
      studentIdsInActiveChats.has(student.id)
    );
    
    // Get students with active appointments (confirmed or pending)
    const studentIdsInAppointments = new Set(
      appointments
        .filter(apt => apt.status === 'confirmed' || apt.status === 'pending')
        .map(apt => apt.studentId)
    );
    const studentsWithAppointments = studentsData.filter(student => 
      studentIdsInAppointments.has(student.id)
    );
    
    // Combine all three categories and remove duplicates
    const relevantStudentIds = new Set([
      ...studentsWithEarlyWarnings.map(s => s.id),
      ...studentsWithActiveChats.map(s => s.id),
      ...studentsWithAppointments.map(s => s.id)
    ]);
    
    return studentsData.filter(student => relevantStudentIds.has(student.id));
  };
  
  // Early Warning Detection Algorithm (simplified version from EarlyWarningSystem)
  const detectEarlyWarningSignals = (student) => {
    const alerts = [];
    
    // 1. Attendance Pattern Analysis
    if (student.attendanceData && student.attendanceData.length >= 5) {
      const recentAttendance = student.attendanceData.slice(-5);
      const presentDays = recentAttendance.filter(day => day.present).length;
      const attendanceRate = (presentDays / recentAttendance.length) * 100;
      
      if (attendanceRate < 60) {
        alerts.push({ type: 'attendance_critical', severity: 'high' });
      } else if (attendanceRate < 80) {
        alerts.push({ type: 'attendance_declining', severity: 'medium' });
      }
    }
    
    // 2. Academic Performance Decline
    if (student.biMonthlyMarks && student.biMonthlyMarks.length >= 2) {
      const recentMarks = student.biMonthlyMarks.slice(-2);
      const marksDrop = recentMarks[0].marks - recentMarks[1].marks;
      
      if (marksDrop > 15) {
        alerts.push({ type: 'academic_decline', severity: 'high' });
      } else if (marksDrop > 10) {
        alerts.push({ type: 'academic_concern', severity: 'medium' });
      }
    }
    
    // 3. Combined Risk Factors
    const riskFactors = [];
    if ((student.averageAttendance || 0) < 75) riskFactors.push('low_attendance');
    if ((student.averageMarks || 0) < 65) riskFactors.push('poor_academic');
    
    if (riskFactors.length >= 2) {
      alerts.push({ type: 'multiple_risk_factors', severity: 'high' });
    }
    
    return alerts;
  };
  
  // Get filtered students
  const currentRelevantStudents = getCurrentRelevantStudents();
  
  // Calculate stats from filtered student data, appointments, and chats
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Calculate unique students in active chats
  const studentsInActiveChats = new Set(chats.map(chat => chat.studentId)).size;
  
  const stats = {
    totalStudents: currentRelevantStudents.length,
    activeCrisisAlerts: currentRelevantStudents.filter(s => s.status === 'At Risk').length,
    sessionsToday: appointments.filter(apt => apt.scheduledDate === todayStr && apt.status === 'confirmed').length,
    pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
    activeChats: studentsInActiveChats,
    averageWellnessScore: currentRelevantStudents.length > 0 ? 
      (currentRelevantStudents.reduce((sum, s) => sum + (s.wellnessScore || 0), 0) / currentRelevantStudents.length).toFixed(1) : '0.0',
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700">Loading counselor dashboard...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state if counselor is not properly configured
  if (institutionCode === 'NOT_CONFIGURED' || institutionCode === 'ERROR') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-orange-200">
          <div className="text-center">
            <div className="text-orange-600 mb-4">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Counselor Setup Required</h2>
            <p className="text-gray-600 mb-4">
              Your counselor account needs to be properly configured by your institution administrator.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please contact your institution administrator to:
            </p>
            <ul className="text-sm text-gray-600 mb-6 text-left max-w-md mx-auto">
              <li className="mb-2">• Assign you to the correct institution</li>
              <li className="mb-2">• Configure your counselor profile</li>
              <li>• Grant necessary permissions</li>
            </ul>
            <button
              onClick={() => {
                auth.signOut();
                localStorage.removeItem('userRole');
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Sign Out & Contact Administrator
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Counselor Dashboard</h1>
              <p className="text-gray-600">Student Mental Health Support Portal</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.displayName || user?.email?.split('@')[0] || 'Counselor'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
            </div>

            {/* No Relevant Students Message */}
            {currentRelevantStudents.length === 0 && studentsData.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <HeartIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">Great News!</h3>
                <p className="text-green-800 mb-2">
                  Currently, no students require immediate attention for early warnings, active chats, or appointments.
                </p>
                <p className="text-sm text-green-700">
                  Total students in system: {studentsData.length} • All students are doing well at this time.
                </p>
              </div>
            )}

            {/* Stats Grid */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Information Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Focused Dashboard View</h4>
                  <p className="text-sm text-blue-800">
                    This dashboard shows only current students who require attention: those with <strong>early warning alerts</strong>, 
                    active <strong>chat conversations</strong>, or <strong>scheduled appointments</strong>. 
                    This focused view helps you prioritize students who need immediate support.
                  </p>
                </div>
              </div>
            </div>
            {/* Stats Grid */}
            {currentRelevantStudents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                    <p className="text-xs text-gray-500 mt-1">In early warnings, chats, or appointments</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingAppointments}</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CalendarDaysIcon className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Chats</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.activeChats}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sessions Today</p>
                    <p className="text-2xl font-bold text-green-600">{stats.sessionsToday}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Crisis Alerts</p>
                    <p className="text-2xl font-bold text-red-600">{stats.activeCrisisAlerts}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Wellness</p>
                    <p className="text-2xl font-bold text-green-600">{stats.averageWellnessScore}/10</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <HeartIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Recent Activities and Urgent Cases */}
            {currentRelevantStudents.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">At-Risk Students</h3>
                  <button
                    onClick={() => setActiveTab('early-warning')}
                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                  >
                    <ShieldExclamationIcon className="h-4 w-4 mr-1" />
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {currentRelevantStudents
                    .filter(student => student.status === 'At Risk')
                    .slice(0, 3)
                    .map((student, index) => {
                      const getPriority = (gpa, attendance) => {
                        if (gpa < 2.0 || attendance < 60) return 'High';
                        if (gpa < 2.5 || attendance < 75) return 'Medium';
                        return 'Low';
                      };
                      
                      const getIssue = (student) => {
                        const issues = [];
                        if (student.gpa < 2.0) issues.push('Critical GPA');
                        if (student.averageAttendance < 60) issues.push('Poor attendance');
                        if (student.socialClubHistory?.some(h => h.action === 'dropped_all_clubs')) issues.push('Social withdrawal');
                        if (student.wellnessScore < 4) issues.push('Low wellness score');
                        return issues.length > 1 ? 'Multiple risk factors detected' : issues[0] || 'Requires attention';
                      };
                      
                      const priority = getPriority(student.gpa, student.averageAttendance);
                      const issue = getIssue(student);
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                             onClick={() => setActiveTab('early-warning')}>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-600">{issue}</p>
                            <p className="text-xs text-gray-500">GPA: {student.gpa} • Attendance: {student.averageAttendance}%</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            priority === 'High' ? 'bg-red-100 text-red-800' :
                            priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {priority} Priority
                          </span>
                        </div>
                      );
                    })}
                  {currentRelevantStudents.filter(s => s.status === 'At Risk').length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p>No at-risk students requiring attention at this time</p>
                      <p className="text-xs mt-1">Showing only current students in early warnings, chats, or appointments</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {appointmentsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-gray-600">Loading appointments...</span>
                    </div>
                  ) : appointments.filter(apt => apt.scheduledDate === todayStr).length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <CalendarDaysIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p>No appointments scheduled for today</p>
                    </div>
                  ) : (
                    appointments
                      .filter(apt => apt.scheduledDate === todayStr)
                      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                      .slice(0, 4)
                      .map((appointment, index) => {
                        const getStatusColor = (status) => {
                          switch (status) {
                            case 'confirmed': return 'border-green-400 bg-green-50 text-green-700';
                            case 'pending': return 'border-yellow-400 bg-yellow-50 text-yellow-700';
                            case 'cancelled': return 'border-red-400 bg-red-50 text-red-700';
                            default: return 'border-gray-400 bg-gray-50 text-gray-700';
                          }
                        };
                        
                        const getTypeDisplay = (type) => {
                          switch (type) {
                            case 'video': return 'Video Call';
                            case 'phone': return 'Phone Call';
                            case 'in-person': return 'In-Person';
                            default: return 'Appointment';
                          }
                        };
                        
                        return (
                          <div key={index} className={`flex items-center justify-between p-3 border-l-4 ${getStatusColor(appointment.status)} rounded-r-lg cursor-pointer hover:bg-opacity-75 transition-colors`}
                               onClick={() => setActiveTab('appointments')}>
                            <div>
                              <p className="font-medium text-gray-900">{appointment.studentName}</p>
                              <p className="text-sm text-gray-600">{getTypeDisplay(appointment.type)}</p>
                              <p className="text-xs text-gray-500 capitalize">{appointment.status}</p>
                            </div>
                            <span className="text-sm font-medium">{appointment.scheduledTime}</span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
            )}
          </div>
        )}


        {activeTab === 'appointments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Appointment Requests</h2>
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {appointments.filter(apt => apt.status === 'pending').length} Pending
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {appointments.filter(apt => apt.status === 'confirmed').length} Confirmed
                </span>
              </div>
            </div>

            {appointmentsLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  <span className="ml-3 text-gray-600">Loading appointments...</span>
                </div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Yet</h3>
                <p className="text-gray-600">Student appointment requests will appear here for you to review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => {
                  const getTypeIcon = (type) => {
                    switch (type) {
                      case 'video': return <VideoCameraIcon className="h-5 w-5" />;
                      case 'phone': return <PhoneIcon className="h-5 w-5" />;
                      case 'in-person': return <BuildingOfficeIcon className="h-5 w-5" />;
                      default: return <CalendarDaysIcon className="h-5 w-5" />;
                    }
                  };

                  const getStatusColor = (status) => {
                    switch (status) {
                      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
                      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
                      default: return 'bg-gray-100 text-gray-800 border-gray-200';
                    }
                  };

                  return (
                    <div key={appointment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-4">
                            <div className="flex items-center text-blue-600 mr-4">
                              {getTypeIcon(appointment.type)}
                              <span className="ml-2 font-medium capitalize">{appointment.type}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{appointment.studentName}</h3>
                              <p className="text-gray-600 text-sm mb-2">{appointment.studentEmail}</p>
                              
                              <div className="flex items-center text-gray-600 text-sm">
                                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                <span>{new Date(appointment.scheduledDate).toLocaleDateString()}</span>
                                <ClockIcon className="h-4 w-4 ml-3 mr-1" />
                                <span>{appointment.scheduledTime}</span>
                              </div>
                            </div>
                            
                            <div>
                              {appointment.notes && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">Student Notes:</p>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{appointment.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {appointment.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleAppointmentAction(appointment.id, 'cancelled')}
                            className="flex items-center px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors duration-200 font-medium"
                          >
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Decline
                          </button>
                          <button
                            onClick={() => handleAppointmentAction(appointment.id, 'confirmed')}
                            className="flex items-center px-4 py-2 text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors duration-200 font-medium"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Accept
                          </button>
                        </div>
                      )}
                      
                      {appointment.status === 'confirmed' && (
                        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
                          <p className="text-green-600 text-sm font-medium">✅ Confirmed - Student has been notified</p>
                        </div>
                      )}
                      
                      {appointment.status === 'cancelled' && (
                        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
                          <p className="text-red-600 text-sm font-medium">❌ Declined - Student has been notified</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chats' && (
          <CounselorChatView />
        )}

        {activeTab === 'early-warning' && (
          <EarlyWarningSystem 
            studentsData={currentRelevantStudents} 
            institutionCode={institutionCode} 
            userRole="counselor"
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsManagement 
            counselorId={user?.uid}
            institutionCode={institutionCode}
            currentRelevantStudents={currentRelevantStudents}
          />
        )}

        {activeTab === 'concerns' && (
          <ConcernReportsManagement 
            institutionCode={institutionCode}
            counselorId={user?.uid}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsManagement 
            counselorId={user?.uid}
            institutionCode={institutionCode}
            currentRelevantStudents={currentRelevantStudents}
            appointments={appointments}
            chats={chats}
          />
        )}
      </div>
    </div>
  );
}