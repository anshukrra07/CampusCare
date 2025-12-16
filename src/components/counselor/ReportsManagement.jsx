import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ChartBarIcon,
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  StarIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PlusIcon,
  AcademicCapIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { db } from '../../lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';

export default function ReportsManagement({ 
  counselorId, 
  institutionCode, 
  currentRelevantStudents, 
  appointments, 
  chats 
}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReportType, setActiveReportType] = useState('overview'); // overview, individual, progress, analytics
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // 7, 30, 90, 180, 365 days
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    if (counselorId) {
      loadSessions();
    }
  }, [counselorId]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      if (!counselorId) return;
      
      const sessionsRef = collection(db, 'counselors', counselorId, 'sessions');
      const q = query(sessionsRef, orderBy('sessionDate', 'desc'));
      const snapshot = await getDocs(q);
      
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate date range for filtering
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));
    return { startDate, endDate };
  };

  // Filter data by date range
  const filterByDateRange = (data, dateField = 'createdAt') => {
    const { startDate, endDate } = getDateRange();
    return data.filter(item => {
      const itemDate = new Date(item[dateField] || item.sessionDate || item.scheduledDate);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  // Generate comprehensive analytics
  const generateAnalytics = () => {
    const filteredSessions = filterByDateRange(sessions, 'sessionDate');
    const filteredAppointments = filterByDateRange(appointments, 'scheduledDate');
    const filteredChats = filterByDateRange(chats, 'createdAt');

    const analytics = {
      overview: {
        totalStudents: currentRelevantStudents.length,
        totalSessions: filteredSessions.length,
        totalAppointments: filteredAppointments.length,
        totalChats: filteredChats.length,
        completedSessions: filteredSessions.filter(s => s.status === 'completed').length,
        cancelledSessions: filteredSessions.filter(s => s.status === 'cancelled').length,
        noShowSessions: filteredSessions.filter(s => s.status === 'no-show').length,
        averageSessionDuration: filteredSessions.length > 0 
          ? Math.round(filteredSessions.reduce((sum, s) => sum + (s.duration || 60), 0) / filteredSessions.length)
          : 0,
      },
      studentProgress: {},
      riskAnalysis: {
        highRisk: currentRelevantStudents.filter(s => s.status === 'At Risk').length,
        mediumRisk: currentRelevantStudents.filter(s => s.wellnessScore && s.wellnessScore < 6).length,
        stable: currentRelevantStudents.filter(s => s.wellnessScore && s.wellnessScore >= 6).length,
      },
      sessionTypes: {
        individual: filteredSessions.filter(s => s.sessionType === 'individual').length,
        group: filteredSessions.filter(s => s.sessionType === 'group').length,
        crisis: filteredSessions.filter(s => s.sessionType === 'crisis').length,
        followup: filteredSessions.filter(s => s.sessionType === 'followup').length,
        initial: filteredSessions.filter(s => s.sessionType === 'initial').length,
      },
      moodTrends: {
        excellent: filteredSessions.filter(s => s.mood === 'excellent').length,
        good: filteredSessions.filter(s => s.mood === 'good').length,
        neutral: filteredSessions.filter(s => s.mood === 'neutral').length,
        concerned: filteredSessions.filter(s => s.mood === 'concerned').length,
        critical: filteredSessions.filter(s => s.mood === 'critical').length,
      },
      progressTrends: {
        excellent: filteredSessions.filter(s => s.progress === 'excellent').length,
        good: filteredSessions.filter(s => s.progress === 'good').length,
        stable: filteredSessions.filter(s => s.progress === 'stable').length,
        declining: filteredSessions.filter(s => s.progress === 'declining').length,
        crisis: filteredSessions.filter(s => s.progress === 'crisis').length,
      }
    };

    // Calculate individual student analytics
    currentRelevantStudents.forEach(student => {
      const studentSessions = filteredSessions.filter(s => s.studentId === student.id);
      const studentAppointments = filteredAppointments.filter(a => a.studentId === student.id);
      const studentChats = filteredChats.filter(c => c.studentId === student.id);

      analytics.studentProgress[student.id] = {
        name: student.name,
        totalSessions: studentSessions.length,
        totalAppointments: studentAppointments.length,
        totalChats: studentChats.length,
        completedSessions: studentSessions.filter(s => s.status === 'completed').length,
        averageSessionDuration: studentSessions.length > 0 
          ? Math.round(studentSessions.reduce((sum, s) => sum + (s.duration || 60), 0) / studentSessions.length)
          : 0,
        lastSession: studentSessions.length > 0 ? studentSessions[0].sessionDate : null,
        currentMood: studentSessions.length > 0 ? studentSessions[0].mood : null,
        currentProgress: studentSessions.length > 0 ? studentSessions[0].progress : null,
        moodHistory: studentSessions.map(s => s.mood).filter(Boolean),
        progressHistory: studentSessions.map(s => s.progress).filter(Boolean),
        riskLevel: student.status === 'At Risk' ? 'high' : 
                   student.wellnessScore < 6 ? 'medium' : 'low',
        gpa: student.gpa || 'N/A',
        attendance: student.averageAttendance || 'N/A',
        wellnessScore: student.wellnessScore || 'N/A',
      };
    });

    return analytics;
  };

  const analytics = generateAnalytics();

  // Generate individual student report
  const generateStudentReport = (studentId) => {
    const student = currentRelevantStudents.find(s => s.id === studentId);
    const studentSessions = sessions.filter(s => s.studentId === studentId);
    const studentAppointments = appointments.filter(a => a.studentId === studentId);
    const studentChats = chats.filter(c => c.studentId === studentId);

    return {
      student,
      sessions: studentSessions,
      appointments: studentAppointments,
      chats: studentChats,
      analytics: analytics.studentProgress[studentId] || {},
    };
  };

  const getMoodIcon = (mood) => {
    switch (mood) {
      case 'excellent': return <StarIcon className="h-4 w-4 text-green-600" />;
      case 'good': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'neutral': return <HeartIcon className="h-4 w-4 text-yellow-500" />;
      case 'concerned': return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />;
      case 'critical': return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getProgressIcon = (progress) => {
    switch (progress) {
      case 'excellent':
      case 'good': return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />;
      case 'stable': return <HeartIcon className="h-4 w-4 text-blue-500" />;
      case 'declining':
      case 'crisis': return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportReport = (type = 'pdf') => {
    // This would integrate with a PDF generation library or API
    alert(`Exporting ${activeReportType} report as ${type.toUpperCase()}...`);
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive student progress and counseling analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={printReport}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveReportType('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeReportType === 'overview' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveReportType('individual')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeReportType === 'individual' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Individual Reports
        </button>
        <button
          onClick={() => setActiveReportType('progress')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeReportType === 'progress' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Progress Tracking
        </button>
        <button
          onClick={() => setActiveReportType('analytics')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeReportType === 'analytics' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Overview Report */}
      {activeReportType === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-blue-600">{analytics.overview.totalStudents}</p>
                  <p className="text-xs text-gray-500 mt-1">Currently active</p>
                </div>
                <UserIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sessions</p>
                  <p className="text-3xl font-bold text-green-600">{analytics.overview.totalSessions}</p>
                  <p className="text-xs text-gray-500 mt-1">Last {dateRange} days</p>
                </div>
                <DocumentTextIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Appointments</p>
                  <p className="text-3xl font-bold text-purple-600">{analytics.overview.totalAppointments}</p>
                  <p className="text-xs text-gray-500 mt-1">Last {dateRange} days</p>
                </div>
                <CalendarDaysIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Chats</p>
                  <p className="text-3xl font-bold text-orange-600">{analytics.overview.totalChats}</p>
                  <p className="text-xs text-gray-500 mt-1">Last {dateRange} days</p>
                </div>
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Session Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Status Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ 
                          width: `${analytics.overview.totalSessions > 0 
                            ? (analytics.overview.completedSessions / analytics.overview.totalSessions * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="font-semibold text-green-600">{analytics.overview.completedSessions}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cancelled</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ 
                          width: `${analytics.overview.totalSessions > 0 
                            ? (analytics.overview.cancelledSessions / analytics.overview.totalSessions * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="font-semibold text-red-600">{analytics.overview.cancelledSessions}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">No Show</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-500 h-2 rounded-full" 
                        style={{ 
                          width: `${analytics.overview.totalSessions > 0 
                            ? (analytics.overview.noShowSessions / analytics.overview.totalSessions * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="font-semibold text-gray-600">{analytics.overview.noShowSessions}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">High Risk Students</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{analytics.riskAnalysis.highRisk}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Medium Risk Students</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">{analytics.riskAnalysis.mediumRisk}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Stable Students</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{analytics.riskAnalysis.stable}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Session Types Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Types Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(analytics.sessionTypes).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">{count}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{type}</p>
                  <p className="text-xs text-gray-500">Sessions</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Individual Reports */}
      {activeReportType === 'individual' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Individual Student Reports</h3>
              <p className="text-sm text-gray-600 mt-1">Click on any student to view their detailed report</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentRelevantStudents.map((student) => {
                  const studentAnalytics = analytics.studentProgress[student.id] || {};
                  return (
                    <div 
                      key={student.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedStudent(generateStudentReport(student.id));
                        setShowStudentModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-600">{student.course || 'Course N/A'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(studentAnalytics.riskLevel)}`}>
                          {studentAnalytics.riskLevel || 'low'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-blue-600">{studentAnalytics.totalSessions || 0}</p>
                          <p className="text-gray-600">Sessions</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-green-600">{studentAnalytics.completedSessions || 0}</p>
                          <p className="text-gray-600">Completed</p>
                        </div>
                      </div>
                      
                      {studentAnalytics.currentMood && (
                        <div className="mt-3 flex items-center justify-center space-x-2">
                          {getMoodIcon(studentAnalytics.currentMood)}
                          <span className="text-sm text-gray-600 capitalize">Current Mood: {studentAnalytics.currentMood}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Tracking */}
      {activeReportType === 'progress' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Trends</h3>
              <div className="space-y-3">
                {Object.entries(analytics.moodTrends).map(([mood, count]) => (
                  <div key={mood} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getMoodIcon(mood)}
                      <span className="capitalize text-gray-700">{mood}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ 
                            width: `${analytics.overview.totalSessions > 0 
                              ? (count / analytics.overview.totalSessions * 100)
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Trends</h3>
              <div className="space-y-3">
                {Object.entries(analytics.progressTrends).map(([progress, count]) => (
                  <div key={progress} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getProgressIcon(progress)}
                      <span className="capitalize text-gray-700">{progress}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${analytics.overview.totalSessions > 0 
                              ? (count / analytics.overview.totalSessions * 100)
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student Progress Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Student Progress Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Mood</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.values(analytics.studentProgress).map((student) => (
                    <tr key={student.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.totalSessions}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.lastSession ? new Date(student.lastSession).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {student.currentMood && getMoodIcon(student.currentMood)}
                          <span className="text-sm text-gray-900 capitalize">{student.currentMood || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {student.currentProgress && getProgressIcon(student.currentProgress)}
                          <span className="text-sm text-gray-900 capitalize">{student.currentProgress || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRiskColor(student.riskLevel)}`}>
                          {student.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics View */}
      {activeReportType === 'analytics' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics</h3>
          <p className="text-gray-600">Detailed charts, trends, and predictive analytics coming soon.</p>
        </div>
      )}

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Student Report: {selectedStudent.student?.name}
                </h2>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Student Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Academic Info</h4>
                  <p className="text-sm text-blue-800">Course: {selectedStudent.student?.course || 'N/A'}</p>
                  <p className="text-sm text-blue-800">GPA: {selectedStudent.analytics?.gpa || 'N/A'}</p>
                  <p className="text-sm text-blue-800">Attendance: {selectedStudent.analytics?.attendance || 'N/A'}%</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Session Summary</h4>
                  <p className="text-sm text-green-800">Total Sessions: {selectedStudent.analytics?.totalSessions || 0}</p>
                  <p className="text-sm text-green-800">Completed: {selectedStudent.analytics?.completedSessions || 0}</p>
                  <p className="text-sm text-green-800">Avg Duration: {selectedStudent.analytics?.averageSessionDuration || 0} min</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Engagement</h4>
                  <p className="text-sm text-purple-800">Appointments: {selectedStudent.analytics?.totalAppointments || 0}</p>
                  <p className="text-sm text-purple-800">Chats: {selectedStudent.analytics?.totalChats || 0}</p>
                  <p className="text-sm text-purple-800">Wellness Score: {selectedStudent.analytics?.wellnessScore || 'N/A'}</p>
                </div>
              </div>

              {/* Recent Sessions */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Recent Sessions</h4>
                {selectedStudent.sessions && selectedStudent.sessions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudent.sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{session.sessionType} Session</p>
                            <p className="text-sm text-gray-600">
                              {new Date(session.sessionDate).toLocaleDateString()} at {session.sessionTime}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {session.mood && getMoodIcon(session.mood)}
                            {session.progress && getProgressIcon(session.progress)}
                          </div>
                        </div>
                        {session.sessionNotes && (
                          <p className="text-sm text-gray-700 mt-2">{session.sessionNotes.substring(0, 150)}...</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No sessions recorded yet.</p>
                )}
              </div>

              {/* Progress History */}
              {selectedStudent.analytics?.moodHistory && selectedStudent.analytics.moodHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Progress History</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Mood Progression</h5>
                      <div className="flex space-x-2">
                        {selectedStudent.analytics.moodHistory.slice(-10).map((mood, index) => (
                          <div key={index} className="flex flex-col items-center">
                            {getMoodIcon(mood)}
                            <span className="text-xs text-gray-500 mt-1">{index + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Progress Tracking</h5>
                      <div className="flex space-x-2">
                        {selectedStudent.analytics.progressHistory.slice(-10).map((progress, index) => (
                          <div key={index} className="flex flex-col items-center">
                            {getProgressIcon(progress)}
                            <span className="text-xs text-gray-500 mt-1">{index + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}