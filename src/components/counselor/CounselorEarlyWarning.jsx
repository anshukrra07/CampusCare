import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  HeartIcon,
  FlagIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { db, auth } from '../../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc,
  updateDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

const CounselorEarlyWarning = () => {
  const [user] = useAuthState(auth);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('priority');

  // Students referred from Institution Early Warning System
  const referredStudents = [
    {
      id: 'student1',
      name: 'Emma Wilson',
      email: 'emma.wilson@student.edu',
      phone: '+1 (555) 123-4567',
      studentId: 'STU001',
      course: 'BSc Computer Science',
      year: 2,
      semester: 1,
      gpa: 2.1,
      attendance: 65,
      wellnessScore: 3.2,
      averageMarks: 58,
      riskLevel: 'critical',
      priority: 1,
      referredBy: 'Institution Admin',
      referredDate: '2024-01-16',
      referralReason: 'Multiple high-risk indicators detected',
      counselorAssigned: true,
      interventionStatus: 'pending',
      
      // Detailed problems identified by institution
      identifiedProblems: [
        {
          category: 'Academic Performance',
          severity: 'high',
          details: 'GPA dropped from 3.2 to 2.1 over 2 semesters',
          indicators: ['Failed 3 out of 6 subjects', 'Missing assignments (70%)', 'Low exam scores'],
          impact: 'At risk of academic probation',
          recommendation: 'Academic counseling and study plan development'
        },
        {
          category: 'Attendance Issues',
          severity: 'high', 
          details: 'Attendance dropped to 65% (below minimum 75%)',
          indicators: ['Missed 15 classes in last month', 'No valid medical reasons', 'Late arrivals frequent'],
          impact: 'May not be eligible for end-semester exams',
          recommendation: 'Investigate underlying causes, develop attendance plan'
        },
        {
          category: 'Mental Health Concerns',
          severity: 'critical',
          details: 'Multiple crisis indicators detected',
          indicators: ['Depression screening score: 18/27 (moderate-severe)', 'Expressed hopelessness in chat', 'Social withdrawal'],
          impact: 'Risk of self-harm or academic dropout',
          recommendation: 'Immediate counseling intervention and crisis assessment'
        },
        {
          category: 'Financial Stress',
          severity: 'medium',
          details: 'Financial difficulties affecting academic performance',
          indicators: ['Unable to purchase textbooks', 'Requested fee extension', 'Part-time job affecting studies'],
          impact: 'Additional stress affecting mental health and studies',
          recommendation: 'Financial aid counseling and scholarship guidance'
        }
      ],
      
      // Actions taken by institution before referral
      institutionActions: [
        { date: '2024-01-15', action: 'Sent academic warning notice', staff: 'Academic Office' },
        { date: '2024-01-14', action: 'Flagged in early warning system', staff: 'Institution Admin' },
        { date: '2024-01-13', action: 'Parent notification sent', staff: 'Student Affairs' }
      ],
      
      // Counselor action history
      counselorActions: [],
      
      // Urgency indicators
      urgencyFactors: [
        'Crisis chat messages detected',
        'GPA below probation threshold',
        'Attendance below minimum requirement', 
        'Multiple consecutive missed classes',
        'Mental health screening indicates severe depression'
      ]
    },
    {
      id: 'student2',
      name: 'David Chen',
      email: 'david.chen@student.edu', 
      phone: '+1 (555) 234-5678',
      studentId: 'STU002',
      course: 'BTech Mechanical Engineering',
      year: 3,
      semester: 2,
      gpa: 2.8,
      attendance: 78,
      wellnessScore: 4.1,
      averageMarks: 72,
      riskLevel: 'high',
      priority: 2,
      referredBy: 'Faculty Advisor',
      referredDate: '2024-01-15',
      referralReason: 'Social isolation and declining performance',
      counselorAssigned: true,
      interventionStatus: 'in_progress',
      
      identifiedProblems: [
        {
          category: 'Social Integration',
          severity: 'high',
          details: 'Student showing signs of severe social isolation',
          indicators: ['No participation in group activities', 'Eats alone consistently', 'Avoids peer interaction'],
          impact: 'Affecting mental health and collaborative learning',
          recommendation: 'Social skills counseling and group activity integration'
        },
        {
          category: 'Academic Stress',
          severity: 'medium',
          details: 'Struggling with advanced engineering coursework',
          indicators: ['Low confidence in technical subjects', 'Avoiding lab sessions', 'Requesting grade extensions'],
          impact: 'Risk of falling behind in core subjects',
          recommendation: 'Academic support and stress management techniques'
        }
      ],
      
      institutionActions: [
        { date: '2024-01-14', action: 'Faculty meeting arranged', staff: 'Engineering Department' },
        { date: '2024-01-12', action: 'Peer mentoring suggested', staff: 'Student Support' }
      ],
      
      counselorActions: [
        { date: '2024-01-15', action: 'Initial assessment completed', notes: 'Student opened up about social anxiety' }
      ],
      
      urgencyFactors: [
        'Social isolation affecting mental health',
        'Academic performance declining',
        'Self-reported loneliness and sadness'
      ]
    },
    {
      id: 'student3',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@student.edu',
      phone: '+1 (555) 345-6789', 
      studentId: 'STU003',
      course: 'MBA Finance',
      year: 1,
      semester: 2,
      gpa: 3.1,
      attendance: 82,
      wellnessScore: 5.2,
      averageMarks: 78,
      riskLevel: 'medium',
      priority: 3,
      referredBy: 'Academic Advisor',
      referredDate: '2024-01-14',
      referralReason: 'Work-life balance issues affecting performance',
      counselorAssigned: true,
      interventionStatus: 'assessment_pending',
      
      identifiedProblems: [
        {
          category: 'Work-Life Balance',
          severity: 'medium',
          details: 'Struggling to balance full-time job with MBA studies',
          indicators: ['Frequent late submissions', 'Fatigue during classes', 'Missing evening sessions'],
          impact: 'Sustainable academic progress at risk',
          recommendation: 'Time management counseling and schedule optimization'
        },
        {
          category: 'Career Anxiety',
          severity: 'medium',
          details: 'Uncertainty about career direction causing stress',
          indicators: ['Frequently changes internship preferences', 'Asks repetitive career questions', 'Comparing with peers constantly'],
          impact: 'Decision paralysis affecting focus',
          recommendation: 'Career guidance and goal-setting sessions'
        }
      ],
      
      institutionActions: [
        { date: '2024-01-13', action: 'Flexible attendance policy applied', staff: 'MBA Program Office' },
        { date: '2024-01-12', action: 'Career counseling session scheduled', staff: 'Placement Cell' }
      ],
      
      counselorActions: [],
      
      urgencyFactors: [
        'Chronic fatigue affecting performance',
        'Career uncertainty causing anxiety',
        'Work commitments conflicting with studies'
      ]
    }
  ];

  useEffect(() => {
    loadReferredStudents();
  }, [user]);

  const loadReferredStudents = async () => {
    setLoading(true);
    try {
      // Load students referred from Institution Early Warning System
      // TODO: Replace with actual Firestore query to get students referred to this counselor
      // from institution early warning system
      
      setAtRiskStudents(referredStudents);
      
      // Real implementation would be:
      // const studentsRef = collection(db, 'students');
      // const q = query(
      //   studentsRef,
      //   where('assignedCounselor', '==', user.uid),
      //   where('riskLevel', 'in', ['high', 'medium']),
      //   orderBy('priority', 'asc')
      // );
      // const snapshot = await getDocs(q);
      // const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // setAtRiskStudents(students);
      
    } catch (error) {
      console.error('Error loading at-risk students:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800 border-red-200';
      case 2:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleTakeAction = (student, action) => {
    setSelectedStudent(student);
    setActionType(action);
    
    // Set default notes based on action type and student data
    let defaultNotes = '';
    switch (action) {
      case 'initial_assessment':
        defaultNotes = student.interventionStatus === 'assessment_pending' 
          ? 'Beginning initial psychological and academic assessment...' 
          : 'Conducting follow-up assessment to review progress...';
        break;
      case 'counseling_session':
        defaultNotes = 'Scheduling individual counseling session to address identified concerns...';
        break;
      case 'crisis_intervention':
        defaultNotes = student.riskLevel === 'critical' 
          ? 'URGENT: Initiating immediate crisis intervention protocol. Student showing critical risk indicators.' 
          : 'Implementing targeted intervention strategies to address risk factors.';
        break;
      default:
        defaultNotes = '';
    }
    
    setActionNotes(defaultNotes);
    setShowActionModal(true);
  };

  const submitAction = async () => {
    try {
      // TODO: Save action to Firestore
      const actionData = {
        studentId: selectedStudent.id,
        counselorId: user.uid,
        counselorName: user.displayName || user.email,
        actionType: actionType,
        notes: actionNotes,
        timestamp: new Date().toISOString(),
        studentName: selectedStudent.name,
        priority: selectedStudent.priority,
        riskLevel: selectedStudent.riskLevel
      };
      
      // In a real implementation, save to Firestore:
      // await addDoc(collection(db, 'counselor_actions'), actionData);
      
      // Update local student data to reflect action taken
      setAtRiskStudents(prev => prev.map(student => {
        if (student.id === selectedStudent.id) {
          return {
            ...student,
            interventionStatus: actionType === 'initial_assessment' ? 'assessment_completed' : 
                              actionType === 'counseling_session' ? 'counseling_scheduled' :
                              actionType === 'crisis_intervention' ? 'intervention_active' : 
                              student.interventionStatus,
            lastAction: actionType,
            lastActionDate: new Date().toISOString(),
            counselorActions: [...(student.counselorActions || []), {
              date: new Date().toISOString().split('T')[0],
              action: getActionDisplayName(actionType),
              notes: actionNotes
            }]
          };
        }
        return student;
      }));

      // Close modal and show success
      setShowActionModal(false);
      setActionNotes('');
      
      const actionName = getActionDisplayName(actionType);
      alert(`${actionName} has been recorded for ${selectedStudent.name}. The intervention is now in progress.`);
      
    } catch (error) {
      console.error('Error saving action:', error);
      alert('Error saving action. Please try again.');
    }
  };
  
  const getActionDisplayName = (actionType) => {
    switch (actionType) {
      case 'initial_assessment':
        return 'Initial Assessment';
      case 'counseling_session':
        return 'Counseling Session';
      case 'crisis_intervention':
        return 'Crisis Intervention';
      default:
        return actionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const filteredStudents = atRiskStudents
    .filter(student => {
      if (filterPriority === 'all') return true;
      return student.priority.toString() === filterPriority;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'riskLevel':
          const riskOrder = { high: 1, medium: 2, low: 3 };
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        case 'lastContact':
          return new Date(b.lastContact) - new Date(a.lastContact);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <span className="ml-3 text-gray-600">Loading at-risk students...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <ShieldExclamationIcon className="h-8 w-8 mr-3" />
              Early Warning System
            </h1>
            <p className="text-red-100 mt-1">Students requiring immediate attention and support</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{atRiskStudents.length}</div>
            <div className="text-red-100 text-sm">At-Risk Students</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FlagIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-800">
                {atRiskStudents.filter(s => s.priority === 1).length}
              </div>
              <div className="text-sm text-red-600">High Priority</div>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-800">
                {atRiskStudents.filter(s => s.priority === 2).length}
              </div>
              <div className="text-sm text-yellow-600">Medium Priority</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-800">
                {atRiskStudents.filter(s => s.priority === 3).length}
              </div>
              <div className="text-sm text-blue-600">Watch List</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <HeartIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-800">
                {atRiskStudents.reduce((sum, s) => sum + s.alertsCount, 0)}
              </div>
              <div className="text-sm text-green-600">Total Alerts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Priority:</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="1">High Priority</option>
                <option value="2">Medium Priority</option>
                <option value="3">Watch List</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="priority">Priority</option>
                <option value="name">Name</option>
                <option value="riskLevel">Risk Level</option>
                <option value="lastContact">Last Contact</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredStudents.length} of {atRiskStudents.length} students
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No At-Risk Students</h3>
            <p className="text-gray-600">Great job! No students currently match the selected criteria.</p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
              {/* Student Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg font-medium">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(student.priority)}`}>
                          Priority {student.priority}
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(student.riskLevel)}`}>
                          {student.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <AcademicCapIcon className="h-4 w-4 mr-1" />
                          {student.course}
                        </div>
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {student.studentId}
                        </div>
                        <div className="flex items-center">
                          <ChartBarIcon className="h-4 w-4 mr-1" />
                          GPA: {student.gpa}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {student.attendance}% Attendance
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTakeAction(student, 'initial_assessment')}
                      className={`px-3 py-1 rounded-md text-sm flex items-center ${
                        student.interventionStatus === 'assessment_pending' 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      {student.interventionStatus === 'assessment_pending' ? 'Start Assessment' : 'Reassess'}
                    </button>
                    <button
                      onClick={() => handleTakeAction(student, 'counseling_session')}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                    >
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      Schedule Session
                    </button>
                    <button
                      onClick={() => handleTakeAction(student, 'crisis_intervention')}
                      className={`px-3 py-1 rounded-md text-sm flex items-center ${
                        student.riskLevel === 'critical'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                    >
                      <ShieldExclamationIcon className="h-4 w-4 mr-1" />
                      {student.riskLevel === 'critical' ? 'Crisis Support' : 'Intervention'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Referral Information */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Referral Details:</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    student.interventionStatus === 'pending' || student.interventionStatus === 'assessment_pending' ? 'bg-red-100 text-red-800' :
                    student.interventionStatus === 'in_progress' || student.interventionStatus === 'counseling_scheduled' ? 'bg-blue-100 text-blue-800' :
                    student.interventionStatus === 'assessment_completed' ? 'bg-green-100 text-green-800' :
                    student.interventionStatus === 'intervention_active' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {student.interventionStatus === 'assessment_pending' ? 'NEEDS ASSESSMENT' :
                     student.interventionStatus === 'assessment_completed' ? 'ASSESSED' :
                     student.interventionStatus === 'counseling_scheduled' ? 'SESSION SCHEDULED' :
                     student.interventionStatus === 'intervention_active' ? 'INTERVENTION ACTIVE' :
                     student.interventionStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Referred by:</span>
                    <p className="font-medium">{student.referredBy}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <p className="font-medium">{student.referredDate}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Reason:</span>
                    <p className="font-medium">{student.referralReason}</p>
                  </div>
                </div>
              </div>

              {/* Identified Problems */}
              <div className="px-6 py-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Problems Identified by Institution:</h4>
                <div className="space-y-3">
                  {student.identifiedProblems.map((problem, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{problem.category}</h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          problem.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          problem.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {problem.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{problem.details}</p>
                      
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-600">Indicators:</span>
                        <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                          {problem.indicators.map((indicator, idx) => (
                            <li key={idx}>{indicator}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-xs font-medium text-red-600">Impact:</span>
                        <p className="text-xs text-red-600">{problem.impact}</p>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <span className="text-xs font-medium text-blue-800">Recommended Action:</span>
                        <p className="text-xs text-blue-800 mt-1">{problem.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Institution Actions */}
              <div className="px-6 py-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Institution Actions Taken:</h4>
                <div className="space-y-2">
                  {student.institutionActions.map((action, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{action.date}</span>
                          <span className="text-xs text-gray-500">{action.staff}</span>
                        </div>
                        <p className="text-sm text-gray-700">{action.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Counselor Actions */}
              {student.counselorActions.length > 0 && (
                <div className="px-6 py-4 bg-green-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">My Actions:</h4>
                  <div className="space-y-2">
                    {student.counselorActions.map((action, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <HeartIcon className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{action.date}</span>
                          </div>
                          <p className="text-sm text-gray-700">{action.action}</p>
                          {action.notes && (
                            <p className="text-xs text-gray-600 italic mt-1">Notes: {action.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Urgency Factors */}
              <div className="px-6 py-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Urgency Factors:</h4>
                <div className="flex flex-wrap gap-2">
                  {student.urgencyFactors.map((factor, index) => (
                    <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-xs border border-red-200">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Take Action: {selectedStudent.name}
                </h2>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type: {getActionDisplayName(actionType)}
                </label>
                <div className={`p-3 rounded-lg text-sm ${
                  actionType === 'crisis_intervention' ? 'bg-red-50 border border-red-200' :
                  actionType === 'initial_assessment' ? 'bg-blue-50 border border-blue-200' :
                  'bg-green-50 border border-green-200'
                }`}>
                  <p className={`${
                    actionType === 'crisis_intervention' ? 'text-red-700' :
                    actionType === 'initial_assessment' ? 'text-blue-700' :
                    'text-green-700'
                  }`}>
                    {actionType === 'initial_assessment' && (
                      selectedStudent.interventionStatus === 'assessment_pending' ?
                      'Begin comprehensive psychological and academic assessment to understand the student\'s current situation, identify root causes of problems, and develop an appropriate intervention plan.' :
                      'Conduct follow-up assessment to evaluate progress made since last intervention and adjust treatment plan as needed.'
                    )}
                    {actionType === 'counseling_session' && 'Schedule and conduct individual counseling session to provide therapeutic support, develop coping strategies, and address the specific mental health and academic concerns identified.'}
                    {actionType === 'crisis_intervention' && (
                      selectedStudent.riskLevel === 'critical' ?
                      'URGENT INTERVENTION: Implement immediate crisis support protocol. This student shows critical risk indicators and requires immediate attention to ensure safety and prevent potential self-harm.' :
                      'Provide targeted intervention to address specific risk factors and prevent escalation to crisis level. Focus on immediate stabilization and safety planning.'
                    )}
                  </p>
                </div>
              </div>
              
              {/* Student Key Info in Modal */}
              <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Student Information</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="font-medium">Risk Level:</span> <span className={`px-1.5 py-0.5 rounded text-white ${
                    selectedStudent.riskLevel === 'critical' ? 'bg-red-600' : 
                    selectedStudent.riskLevel === 'high' ? 'bg-orange-600' : 'bg-yellow-600'
                  }`}>{selectedStudent.riskLevel.toUpperCase()}</span></div>
                  <div><span className="font-medium">Priority:</span> P{selectedStudent.priority}</div>
                  <div><span className="font-medium">GPA:</span> {selectedStudent.gpa}</div>
                  <div><span className="font-medium">Attendance:</span> {selectedStudent.attendance}%</div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intervention Notes
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Add notes about this action..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAction}
                  className={`px-4 py-2 text-white rounded-md ${
                    actionType === 'crisis_intervention' ? 'bg-red-600 hover:bg-red-700' :
                    actionType === 'initial_assessment' ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {actionType === 'crisis_intervention' ? 'Start Crisis Intervention' :
                   actionType === 'initial_assessment' ? 'Begin Assessment' :
                   'Schedule Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounselorEarlyWarning;