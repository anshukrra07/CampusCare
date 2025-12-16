import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  XMarkIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { db } from '../../lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

export default function SessionsManagement({ counselorId, institutionCode, currentRelevantStudents }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeView, setActiveView] = useState('calendar'); // calendar, list, analytics
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form states
  const [sessionForm, setSessionForm] = useState({
    studentId: '',
    studentName: '',
    sessionType: 'individual', // individual, group, crisis, followup
    sessionDate: '',
    sessionTime: '',
    duration: 60, // minutes
    status: 'scheduled', // scheduled, completed, cancelled, no-show
    sessionNotes: '',
    mood: '', // excellent, good, neutral, concerned, critical
    progress: '', // excellent, good, stable, declining, crisis
    nextSteps: '',
    tags: [],
    followUpNeeded: false,
    followUpDate: ''
  });

  // Session templates
  const sessionTemplates = {
    initial: {
      title: 'Initial Assessment',
      duration: 90,
      defaultNotes: 'Initial consultation and assessment session.\n\nTopics covered:\n- Personal background\n- Current challenges\n- Mental health history\n- Goals and expectations\n- Treatment plan discussion',
      tags: ['initial', 'assessment']
    },
    individual: {
      title: 'Individual Counseling',
      duration: 60,
      defaultNotes: 'Individual counseling session.\n\nSession focus:\n- Current mood and feelings\n- Recent challenges\n- Coping strategies\n- Progress review\n- Action items',
      tags: ['individual', 'counseling']
    },
    crisis: {
      title: 'Crisis Intervention',
      duration: 90,
      defaultNotes: 'Crisis intervention session.\n\nImmediate concerns:\n- Safety assessment\n- Crisis situation details\n- Support system activation\n- Emergency plan\n- Follow-up arrangements',
      tags: ['crisis', 'urgent']
    },
    followup: {
      title: 'Follow-up Session',
      duration: 45,
      defaultNotes: 'Follow-up session to review progress.\n\nReview items:\n- Previous session outcomes\n- Goal progress\n- Medication/treatment compliance\n- New concerns\n- Continued support needs',
      tags: ['followup', 'review']
    },
    group: {
      title: 'Group Therapy',
      duration: 90,
      defaultNotes: 'Group therapy session.\n\nGroup dynamics:\n- Participation level\n- Interaction with peers\n- Shared experiences\n- Group goals progress\n- Individual contributions',
      tags: ['group', 'therapy']
    }
  };

  useEffect(() => {
    if (counselorId && institutionCode) {
      loadSessions();
    }
  }, [counselorId, institutionCode]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      // Load sessions from counselor's subcollection
      const sessionsRef = collection(db, 'counselors', counselorId, 'sessions');
      const q = query(sessionsRef, orderBy('sessionDate', 'desc'));
      const snapshot = await getDocs(q);
      
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSessions(sessionsData);
      console.log(`Loaded ${sessionsData.length} sessions`);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const sessionData = {
        ...sessionForm,
        counselorId,
        institutionCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const sessionsRef = collection(db, 'counselors', counselorId, 'sessions');
      const docRef = await addDoc(sessionsRef, sessionData);
      
      console.log('Session created with ID:', docRef.id);
      
      // Reset form and close modal
      setSessionForm({
        studentId: '',
        studentName: '',
        sessionType: 'individual',
        sessionDate: '',
        sessionTime: '',
        duration: 60,
        status: 'scheduled',
        sessionNotes: '',
        mood: '',
        progress: '',
        nextSteps: '',
        tags: [],
        followUpNeeded: false,
        followUpDate: ''
      });
      setShowCreateModal(false);
      
      // Reload sessions
      loadSessions();
      
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    }
  };

  const handleUpdateSession = async (sessionId, updates) => {
    try {
      const sessionRef = doc(db, 'counselors', counselorId, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      loadSessions(); // Reload sessions
    } catch (error) {
      console.error('Error updating session:', error);
      alert('Failed to update session. Please try again.');
    }
  };

  const applyTemplate = (templateKey) => {
    const template = sessionTemplates[templateKey];
    setSessionForm(prev => ({
      ...prev,
      sessionType: templateKey,
      duration: template.duration,
      sessionNotes: template.defaultNotes,
      tags: template.tags
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no-show': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  // Calculate session statistics
  const sessionStats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    thisWeek: sessions.filter(s => {
      const sessionDate = new Date(s.sessionDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    }).length,
    studentsServed: new Set(sessions.map(s => s.studentId)).size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading sessions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Session Management</h2>
          <p className="text-gray-600">Manage counseling sessions and track student progress</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Session
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{sessionStats.total}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{sessionStats.completed}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{sessionStats.scheduled}</p>
            </div>
            <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-purple-600">{sessionStats.thisWeek}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-2xl font-bold text-orange-600">{sessionStats.studentsServed}</p>
            </div>
            <UserIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveView('list')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'list' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Sessions List
        </button>
        <button
          onClick={() => setActiveView('calendar')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'calendar' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Calendar View
        </button>
        <button
          onClick={() => setActiveView('analytics')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'analytics' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Sessions List View */}
      {activeView === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
          </div>
          
          {sessions.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Yet</h3>
              <p className="text-gray-600 mb-4">Start by creating your first counseling session.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Create First Session
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sessions.slice(0, 10).map((session) => (
                <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{session.studentName}</h4>
                        <p className="text-sm text-gray-600 capitalize">{session.sessionType} Session</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(session.sessionDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">{session.sessionTime}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{session.duration} min</span>
                      </div>
                      
                      {session.mood && (
                        <div className="flex items-center space-x-2">
                          {getMoodIcon(session.mood)}
                          <span className="text-sm text-gray-600 capitalize">{session.mood}</span>
                        </div>
                      )}
                      
                      {session.progress && (
                        <div className="flex items-center space-x-2">
                          {getProgressIcon(session.progress)}
                          <span className="text-sm text-gray-600 capitalize">{session.progress}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="Edit Session"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {session.tags && session.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {session.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar View Placeholder */}
      {activeView === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View</h3>
          <p className="text-gray-600">Interactive calendar for session scheduling coming soon.</p>
        </div>
      )}

      {/* Analytics View Placeholder */}
      {activeView === 'analytics' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <ArrowTrendingUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Session Analytics</h3>
          <p className="text-gray-600">Detailed analytics and progress reports coming soon.</p>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create New Session</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Session Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Templates</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(sessionTemplates).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => applyTemplate(key)}
                      className={`p-3 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 transition-colors ${
                        sessionForm.sessionType === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 text-sm">{template.title}</h4>
                      <p className="text-xs text-gray-600">{template.duration} min</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                <select
                  value={sessionForm.studentId}
                  onChange={(e) => {
                    const student = currentRelevantStudents.find(s => s.id === e.target.value);
                    setSessionForm(prev => ({
                      ...prev,
                      studentId: e.target.value,
                      studentName: student?.name || ''
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a student</option>
                  {currentRelevantStudents.map(student => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={sessionForm.sessionDate}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, sessionDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={sessionForm.sessionTime}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, sessionTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <select
                    value={sessionForm.duration}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>
              </div>

              {/* Session Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Notes</label>
                <textarea
                  value={sessionForm.sessionNotes}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, sessionNotes: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Session objectives, discussion points, observations..."
                />
              </div>

              {/* Status and Progress */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={sessionForm.status}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No Show</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student Mood</label>
                  <select
                    value={sessionForm.mood}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, mood: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select mood</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="neutral">Neutral</option>
                    <option value="concerned">Concerned</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Progress</label>
                  <select
                    value={sessionForm.progress}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, progress: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select progress</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="stable">Stable</option>
                    <option value="declining">Declining</option>
                    <option value="crisis">Crisis</option>
                  </select>
                </div>
              </div>

              {/* Next Steps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Next Steps & Action Items</label>
                <textarea
                  value={sessionForm.nextSteps}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, nextSteps: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Action items, homework, follow-up tasks..."
                />
              </div>

              {/* Follow-up */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sessionForm.followUpNeeded}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, followUpNeeded: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Follow-up needed</span>
                </label>
                
                {sessionForm.followUpNeeded && (
                  <input
                    type="date"
                    value={sessionForm.followUpDate}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, followUpDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={!sessionForm.studentId || !sessionForm.sessionDate || !sessionForm.sessionTime}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Session Details</h2>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Student</h3>
                  <p className="text-gray-600">{selectedSession.studentName}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Session Type</h3>
                  <p className="text-gray-600 capitalize">{selectedSession.sessionType}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Date & Time</h3>
                  <p className="text-gray-600">
                    {new Date(selectedSession.sessionDate).toLocaleDateString()} at {selectedSession.sessionTime}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Duration</h3>
                  <p className="text-gray-600">{selectedSession.duration} minutes</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Status</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedSession.status)}`}>
                    {selectedSession.status.charAt(0).toUpperCase() + selectedSession.status.slice(1)}
                  </span>
                </div>
                {selectedSession.mood && (
                  <div>
                    <h3 className="font-medium text-gray-900">Student Mood</h3>
                    <div className="flex items-center space-x-2">
                      {getMoodIcon(selectedSession.mood)}
                      <p className="text-gray-600 capitalize">{selectedSession.mood}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedSession.sessionNotes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Session Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedSession.sessionNotes}</p>
                  </div>
                </div>
              )}

              {selectedSession.nextSteps && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Next Steps</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedSession.nextSteps}</p>
                  </div>
                </div>
              )}

              {selectedSession.tags && selectedSession.tags.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
                        {tag}
                      </span>
                    ))}
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