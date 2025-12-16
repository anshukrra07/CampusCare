import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  HeartIcon,
  UserIcon,
  BellIcon,
  EyeIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const EarlyWarningSystem = ({ studentsData, institutionCode, userRole }) => {
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7days');
  const [alertFilter, setAlertFilter] = useState('all');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedStudentForAnalysis, setSelectedStudentForAnalysis] = useState(null);
  const [alertStatuses, setAlertStatuses] = useState({});
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [selectedAlertForStatus, setSelectedAlertForStatus] = useState(null);
  
  // Counselor contact functionality states
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedStudentForContact, setSelectedStudentForContact] = useState(null);
  const [contactMethod, setContactMethod] = useState('email');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  
  // Check if user is a counselor
  const isCounselor = userRole === 'counselor';

  // Early Warning Detection Algorithm
  const detectEarlyWarningSignals = (student) => {
    const alerts = [];
    const riskScore = 0;
    
    // 1. Attendance Pattern Analysis
    if (student.attendanceData && student.attendanceData.length >= 5) {
      const recentAttendance = student.attendanceData.slice(-5);
      const presentDays = recentAttendance.filter(day => day.present).length;
      const attendanceRate = (presentDays / recentAttendance.length) * 100;
      
      if (attendanceRate < 60) {
        alerts.push({
          type: 'attendance_critical',
          severity: 'high',
          message: `Critical attendance drop: ${attendanceRate}% in last 5 days`,
          recommendation: 'Immediate counselor intervention required'
        });
      } else if (attendanceRate < 80) {
        alerts.push({
          type: 'attendance_declining',
          severity: 'medium',
          message: `Declining attendance: ${attendanceRate}% in last 5 days`,
          recommendation: 'Monitor closely, consider check-in call'
        });
      }
    }

    // 2. Academic Performance Decline
    if (student.biMonthlyMarks && student.biMonthlyMarks.length >= 2) {
      const recentMarks = student.biMonthlyMarks.slice(-2);
      const marksDrop = recentMarks[0].marks - recentMarks[1].marks;
      
      if (marksDrop > 15) {
        alerts.push({
          type: 'academic_decline',
          severity: 'high',
          message: `Significant grade drop: ${marksDrop} points in recent assessments`,
          recommendation: 'Academic counseling and stress assessment needed'
        });
      } else if (marksDrop > 10) {
        alerts.push({
          type: 'academic_concern',
          severity: 'medium',
          message: `Moderate grade decline: ${marksDrop} points`,
          recommendation: 'Schedule academic support session'
        });
      }
    }

    // 3. [Clinical Assessments Removed - Focusing on behavioral and academic indicators]

    // 4. Behavioral Change Detection (Sudden changes in social engagement - key early warning sign)
    const socialClubsCount = (student.socialClubs || []).length;
    const socialEngagementLevel = student.socialEngagementLevel || 'moderate';
    
    // Check for sudden changes in club behavior (more concerning than never participating)
    if (student.socialClubHistory && Array.isArray(student.socialClubHistory) && socialClubsCount > 0) {
      // Check for sudden drop in club participation
      const hasClubParticipationData = student.weeklyAttendance && Object.keys(student.weeklyAttendance).length > 0;
      
      if (hasClubParticipationData) {
        let totalRecentParticipation = 0;
        let totalPossibleParticipation = 0;
        let totalEarlierParticipation = 0;
        let totalEarlierPossible = 0;
        
        Object.entries(student.weeklyAttendance).forEach(([clubId, participation]) => {
          const participationEntries = Object.entries(participation || {});
          const totalEntries = participationEntries.length;
          
          if (totalEntries >= 4) {
            // Compare recent 2 weeks vs earlier 2 weeks
            const recentEntries = participationEntries.slice(-2);
            const earlierEntries = participationEntries.slice(0, 2);
            
            recentEntries.forEach(([week, participated]) => {
              totalPossibleParticipation++;
              if (participated) totalRecentParticipation++;
            });
            
            earlierEntries.forEach(([week, participated]) => {
              totalEarlierPossible++;
              if (participated) totalEarlierParticipation++;
            });
          }
        });
        
        if (totalPossibleParticipation > 0 && totalEarlierPossible > 0) {
          const recentRate = (totalRecentParticipation / totalPossibleParticipation) * 100;
          const earlierRate = (totalEarlierParticipation / totalEarlierPossible) * 100;
          const participationDrop = earlierRate - recentRate;
          
          if (participationDrop >= 50 && earlierRate >= 70) {
            alerts.push({
              type: 'club_participation_drop',
              severity: 'high',
              message: `Sudden drop in club participation: ${recentRate.toFixed(1)}% (down from ${earlierRate.toFixed(1)}%)`,
              recommendation: 'Immediate check-in - sudden behavioral changes may indicate stress or mental health concerns'
            });
          } else if (participationDrop >= 30 && earlierRate >= 60) {
            alerts.push({
              type: 'club_participation_decline',
              severity: 'medium',
              message: `Declining club participation: ${recentRate.toFixed(1)}% (down from ${earlierRate.toFixed(1)}%)`,
              recommendation: 'Monitor for stress or external factors affecting engagement'
            });
          }
        }
      }
      
      // Check for sudden drop in event participation
      if (student.eventParticipationData && student.eventParticipationData.length >= 4) {
        const recentEvents = student.eventParticipationData.slice(-2);
        const earlierEvents = student.eventParticipationData.slice(-4, -2);
        
        const recentParticipation = recentEvents.filter(e => e.participation).length;
        const recentTotal = recentEvents.length;
        const earlierParticipation = earlierEvents.filter(e => e.participation).length;
        const earlierTotal = earlierEvents.length;
        
        if (recentTotal > 0 && earlierTotal > 0) {
          const recentRate = (recentParticipation / recentTotal) * 100;
          const earlierRate = (earlierParticipation / earlierTotal) * 100;
          const participationDrop = earlierRate - recentRate;
          
          if (participationDrop >= 60 && earlierRate >= 70) {
            alerts.push({
              type: 'event_participation_drop',
              severity: 'high',
              message: `Sharp decline in event participation: ${recentRate.toFixed(1)}% (down from ${earlierRate.toFixed(1)}%)`,
              recommendation: 'Priority check-in - sudden withdrawal from activities is a key warning sign'
            });
          } else if (participationDrop >= 40 && earlierRate >= 50) {
            alerts.push({
              type: 'event_participation_decline',
              severity: 'medium',
              message: `Reduced event participation: ${recentRate.toFixed(1)}% (down from ${earlierRate.toFixed(1)}%)`,
              recommendation: 'Check for barriers or changes in student circumstances'
            });
          }
        }
      }
    }
    
    // Check for students who completely stopped participating (dropped all clubs)
    if (student.socialClubHistory && Array.isArray(student.socialClubHistory) && student.socialClubHistory.length > 0 && socialClubsCount === 0) {
      const daysSinceDropped = student.lastClubDropDate ? 
        Math.floor((new Date() - new Date(student.lastClubDropDate)) / (1000 * 60 * 60 * 24)) : null;
      
      if (daysSinceDropped !== null) {
        if (daysSinceDropped <= 30) {
          alerts.push({
            type: 'complete_club_withdrawal',
            severity: 'high',
            message: `Student recently dropped all club activities (${daysSinceDropped} days ago)`,
            recommendation: 'Urgent check-in required - complete withdrawal from previously enjoyed activities'
          });
        } else if (daysSinceDropped <= 60) {
          alerts.push({
            type: 'recent_club_withdrawal',
            severity: 'medium',
            message: `Student stopped all club participation in the last 2 months`,
            recommendation: 'Wellness check recommended - monitor for underlying issues'
          });
        }
      } else {
        // If no date is available, still flag as moderate concern since they had clubs before
        alerts.push({
          type: 'club_withdrawal_unknown_date',
          severity: 'medium',
          message: 'Student previously participated in clubs but is no longer active',
          recommendation: 'Check-in recommended to understand reasons for change'
        });
      }
    }

    // 5. Combined Risk Factors (Academic and behavioral focused)
    const riskFactors = [];
    if ((student.averageAttendance || 0) < 75) riskFactors.push('low_attendance');
    if ((student.averageMarks || 0) < 65) riskFactors.push('poor_academic');
    // Only add social concerns if there are explicit social withdrawal indicators with other issues
    if (socialEngagementLevel === 'very_low' && socialClubsCount === 0 && riskFactors.length > 0) {
      riskFactors.push('social_withdrawal_concern');
    }

    if (riskFactors.length >= 2) {
      alerts.push({
        type: 'multiple_risk_factors',
        severity: 'high',
        message: `Multiple risk indicators detected: ${riskFactors.join(', ')}`,
        recommendation: 'Comprehensive wellness check and intervention plan needed'
      });
    }

    return alerts;
  };

  const daysSinceAssessment = (assessmentDate) => {
    if (!assessmentDate) return 999;
    const now = new Date();
    const assessment = new Date(assessmentDate);
    return Math.floor((now - assessment) / (1000 * 60 * 60 * 24));
  };

  // Comprehensive analytics for a specific student
  const getStudentAnalytics = (student) => {
    const alerts = detectEarlyWarningSignals(student);
    const analytics = {
      student,
      alerts,
      riskFactors: [],
      trends: {
        academic: { status: 'stable', change: 0, details: [] },
        attendance: { status: 'stable', change: 0, details: [] },
        behavioral: { status: 'stable', change: 0, details: [] },
        social: { status: 'stable', change: 0, details: [] }
      },
      timeline: [],
      recommendations: [],
      riskScore: 0
    };

    // Academic Trend Analysis
    if (student.biMonthlyMarks && student.biMonthlyMarks.length >= 2) {
      const recentMarks = student.biMonthlyMarks.slice(-2);
      const marksTrend = recentMarks[1].marks - recentMarks[0].marks;
      analytics.trends.academic.change = marksTrend;
      
      if (marksTrend > 10) {
        analytics.trends.academic.status = 'improving';
        analytics.trends.academic.details.push(`Academic performance improved by ${marksTrend} points`);
      } else if (marksTrend < -10) {
        analytics.trends.academic.status = 'declining';
        analytics.trends.academic.details.push(`Academic performance declined by ${Math.abs(marksTrend)} points`);
        analytics.riskFactors.push('Academic decline');
      }
    }

    // Class Attendance Analysis
    if (student.attendanceData && student.attendanceData.length >= 5) {
      const recentAttendance = student.attendanceData.slice(-5);
      const presentDays = recentAttendance.filter(day => day.present).length;
      const attendanceRate = (presentDays / recentAttendance.length) * 100;
      
      analytics.trends.attendance.change = attendanceRate;
      if (attendanceRate < 60) {
        analytics.trends.attendance.status = 'critical';
        analytics.trends.attendance.details.push(`Critical class attendance: ${attendanceRate}% in last 5 days`);
        analytics.riskFactors.push('Poor class attendance');
      } else if (attendanceRate < 80) {
        analytics.trends.attendance.status = 'concerning';
        analytics.trends.attendance.details.push(`Declining class attendance: ${attendanceRate}%`);
      } else {
        analytics.trends.attendance.status = 'good';
        analytics.trends.attendance.details.push(`Good class attendance: ${attendanceRate}%`);
      }
    }

    // Club Participation Analysis
    const socialClubsCount = (student.socialClubs || []).length;
    if (student.socialClubHistory && Array.isArray(student.socialClubHistory)) {
      const recentClubChanges = student.socialClubHistory.filter(entry => {
        const daysSinceChange = Math.floor((new Date() - new Date(entry.timestamp)) / (1000 * 60 * 60 * 24));
        return daysSinceChange <= 30;
      });

      if (recentClubChanges.some(entry => entry.action === 'dropped_all_clubs')) {
        analytics.trends.social.status = 'withdrawn';
        analytics.trends.social.details.push('Student recently dropped all club activities');
        analytics.riskFactors.push('Social withdrawal');
      } else if (socialClubsCount === 0) {
        analytics.trends.social.status = 'not_participating';
        analytics.trends.social.details.push('Student not participating in clubs (normal)');
      } else {
        analytics.trends.social.status = 'active';
        analytics.trends.social.details.push(`Active in ${socialClubsCount} clubs`);
      }
    }

    // Behavioral Change Analysis
    if (student.weeklyAttendance && Object.keys(student.weeklyAttendance).length > 0) {
      let hasParticipationDrop = false;
      Object.entries(student.weeklyAttendance).forEach(([clubId, participation]) => {
        const participationEntries = Object.entries(participation || {});
        if (participationEntries.length >= 4) {
          const recentEntries = participationEntries.slice(-2);
          const earlierEntries = participationEntries.slice(0, 2);
          
          const recentRate = recentEntries.filter(([, participated]) => participated).length / recentEntries.length * 100;
          const earlierRate = earlierEntries.filter(([, participated]) => participated).length / earlierEntries.length * 100;
          
          if (earlierRate >= 70 && (earlierRate - recentRate) >= 50) {
            hasParticipationDrop = true;
          }
        }
      });
      
      if (hasParticipationDrop) {
        analytics.trends.behavioral.status = 'concerning';
        analytics.trends.behavioral.details.push('Sudden drop in club participation detected');
        analytics.riskFactors.push('Behavioral change');
      }
    }

    // Generate Timeline
    analytics.timeline = alerts.map(alert => ({
      date: new Date(),
      type: alert.type,
      severity: alert.severity,
      description: alert.message,
      recommendation: alert.recommendation
    }));

    // Calculate Risk Score (0-10)
    let riskScore = 0;
    if (analytics.trends.attendance.status === 'critical') riskScore += 3;
    if (analytics.trends.attendance.status === 'concerning') riskScore += 2;
    if (analytics.trends.academic.status === 'declining') riskScore += 2;
    if (analytics.trends.social.status === 'withdrawn') riskScore += 2;
    if (analytics.trends.behavioral.status === 'concerning') riskScore += 1;
    
    analytics.riskScore = Math.min(riskScore, 10);

    // Generate Recommendations
    if (analytics.riskScore >= 7) {
      analytics.recommendations.push({
        priority: 'high',
        action: 'Immediate counselor intervention',
        description: 'Student shows multiple high-risk indicators requiring immediate attention'
      });
    } else if (analytics.riskScore >= 4) {
      analytics.recommendations.push({
        priority: 'medium',
        action: 'Schedule wellness check-in',
        description: 'Monitor student closely and provide support as needed'
      });
    } else {
      analytics.recommendations.push({
        priority: 'low',
        action: 'Continue monitoring',
        description: 'Student shows stable patterns, maintain regular oversight'
      });
    }

    return analytics;
  };

  // Alert status management
  const generateAlertId = (alert) => {
    return `${alert.studentId}-${alert.type}-${alert.severity}`;
  };

  const updateAlertStatus = (alert, status, notes = '') => {
    const alertId = generateAlertId(alert);
    const statusUpdate = {
      status, // 'solved' or 'not_solved'
      timestamp: new Date(),
      notes,
      updatedBy: 'current_user', // Replace with actual user info
      studentId: alert.studentId,
      alertType: alert.type,
      severity: alert.severity
    };

    setAlertStatuses(prev => ({
      ...prev,
      [alertId]: statusUpdate
    }));

    // Close modal
    setShowStatusUpdateModal(false);
    setSelectedAlertForStatus(null);
  };

  const getAlertStatus = (alert) => {
    const alertId = generateAlertId(alert);
    return alertStatuses[alertId];
  };
  
  // Counselor contact functions
  const handleContactStudent = (student) => {
    setSelectedStudentForContact(student);
    setContactSubject(`Follow-up regarding Early Warning Alert - ${student.name}`);
    setContactMessage(`Dear ${student.name},\n\nI hope this message finds you well. I'm reaching out as part of our student support initiative following some academic and wellness indicators that suggest you might benefit from additional support.\n\nI would like to schedule a brief conversation to understand how things are going for you and discuss any support that might be helpful.\n\nPlease feel free to reach out to me at your convenience. I'm here to help ensure your academic success and overall well-being.\n\nBest regards,\nCampus Counseling Team`);
    setShowContactModal(true);
  };
  
  const sendContactMessage = async () => {
    try {
      // TODO: Implement actual contact sending logic
      // This could integrate with email service, SMS, or internal messaging system
      
      const contactData = {
        studentId: selectedStudentForContact.id,
        studentName: selectedStudentForContact.name,
        studentEmail: selectedStudentForContact.email,
        contactMethod,
        subject: contactSubject,
        message: contactMessage,
        sentBy: 'counselor', // Replace with actual user info
        timestamp: new Date().toISOString(),
        alertContext: riskAlerts.filter(alert => alert.studentId === selectedStudentForContact.id)
      };
      
      console.log('Contact sent:', contactData);
      
      // Close modal
      setShowContactModal(false);
      setSelectedStudentForContact(null);
      setContactMessage('');
      setContactSubject('');
      
      alert(`${contactMethod === 'email' ? 'Email' : contactMethod === 'phone' ? 'Call scheduled' : 'Message'} sent to ${selectedStudentForContact.name} successfully!`);
      
    } catch (error) {
      console.error('Error sending contact:', error);
      alert('Error sending contact. Please try again.');
    }
  };

  // Generate alerts for all students
  useEffect(() => {
    const allAlerts = [];
    studentsData.forEach(student => {
      const studentAlerts = detectEarlyWarningSignals(student);
      studentAlerts.forEach(alert => {
        allAlerts.push({
          ...alert,
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          timestamp: new Date(),
          acknowledged: false
        });
      });
    });
    setRiskAlerts(allAlerts);
  }, [studentsData]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'medium': return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'low': return <BellIcon className="h-5 w-5 text-blue-600" />;
      default: return <BellIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredAlerts = riskAlerts.filter(alert => {
    if (alertFilter === 'all') return true;
    if (alertFilter === 'high' || alertFilter === 'medium' || alertFilter === 'low') {
      return alert.severity === alertFilter;
    }
    if (alertFilter === 'solved') {
      const status = getAlertStatus(alert);
      return status?.status === 'solved';
    }
    if (alertFilter === 'not_solved') {
      const status = getAlertStatus(alert);
      return status?.status === 'not_solved';
    }
    if (alertFilter === 'pending') {
      const status = getAlertStatus(alert);
      return !status; // No status means pending
    }
    return true;
  });

  const highRiskStudents = studentsData.filter(student => {
    const alerts = detectEarlyWarningSignals(student);
    return alerts.some(alert => alert.severity === 'high');
  });

  const pendingAssessments = studentsData.filter(student => {
    return !student.lastAssessment || daysSinceAssessment(student.lastAssessment) > 14;
  });

  return (
    <div className="space-y-6">
      {/* Important Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BellIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Early Warning System - Focus Areas</h4>
            <p className="text-sm text-blue-800 mb-2">
              This system monitors <strong>academic performance</strong> and <strong>class attendance patterns</strong>. 
              Club participation is <strong>not</strong> considered a risk factor - many students thrive without joining clubs.
            </p>
            <p className="text-sm text-blue-800 mb-2">
              <strong>📚 Class Attendance:</strong> Daily attendance to lectures and academic classes (impacts academic performance)
            </p>
            <p className="text-sm text-blue-800">
              <strong>🎯 Club Participation:</strong> Weekly participation in extracurricular club activities (behavioral indicator only)
              <br/><strong>⚠️ Key Focus:</strong> <em>Sudden behavioral changes</em> - students who stop participating in clubs they were previously active in. These changes can indicate stress, depression, or other underlying issues.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk Alerts</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredAlerts.filter(a => a.severity === 'high').length}
              </p>
              <p className="text-xs text-red-500 mt-1">Immediate attention needed</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Students at Risk</p>
              <p className="text-2xl font-bold text-orange-600">{highRiskStudents.length}</p>
              <p className="text-xs text-orange-500 mt-1">Multiple risk factors</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Assessments</p>
              <p className="text-2xl font-bold text-blue-600">{pendingAssessments.length}</p>
              <p className="text-xs text-blue-500 mt-1">Need wellness check</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alert Status</p>
              <div className="flex items-center space-x-4 mt-1">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {riskAlerts.filter(alert => getAlertStatus(alert)?.status === 'solved').length}
                  </div>
                  <div className="text-xs text-green-500">Solved</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {riskAlerts.filter(alert => getAlertStatus(alert)?.status === 'not_solved').length}
                  </div>
                  <div className="text-xs text-red-500">Not Solved</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {riskAlerts.filter(alert => !getAlertStatus(alert)).length}
                  </div>
                  <div className="text-xs text-orange-500">Pending</div>
                </div>
              </div>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Alert Level:</label>
              <select 
                value={alertFilter} 
                onChange={(e) => setAlertFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Alerts</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
                <option value="solved">Solved Only</option>
                <option value="not_solved">Not Solved Only</option>
                <option value="pending">Pending Action</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Timeframe:</label>
              <select 
                value={selectedTimeframe} 
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="7days">Last 7 Days</option>
                <option value="14days">Last 14 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Early Warning Alerts</h3>
          <p className="text-sm text-gray-600 mt-1">
            Proactive detection of students showing signs of depression or stress
          </p>
        </div>
        
        <div className="p-6">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8">
              <HeartIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">No active alerts - students are doing well!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{alert.studentName}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity.toUpperCase()} PRIORITY
                          </span>
                          {(() => {
                            const alertStatus = getAlertStatus(alert);
                            if (alertStatus?.status === 'solved') {
                              return (
                                <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                                  ✓ SOLVED
                                </span>
                              );
                            } else if (alertStatus?.status === 'not_solved') {
                              return (
                                <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-800">
                                  ✗ NOT SOLVED
                                </span>
                              );
                            } else {
                              return (
                                <span className="px-2 py-1 text-xs rounded-full font-medium bg-orange-100 text-orange-800">
                                  ⏳ PENDING
                                </span>
                              );
                            }
                          })()}
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                        <p className="text-sm text-blue-600 font-medium mt-2">
                          📋 Recommended Action: {alert.recommendation}
                        </p>
                        <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                          <span>Student ID: {alert.studentId}</span>
                          <span>Email: {alert.studentEmail}</span>
                          <span>Detected: {alert.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          const student = studentsData.find(s => s.id === alert.studentId);
                          if (student) {
                            setSelectedStudentForAnalysis(student);
                            setShowAnalyticsModal(true);
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                      >
                        View Details
                      </button>
                      {isCounselor && (
                        <button 
                          onClick={() => {
                            const student = studentsData.find(s => s.id === alert.studentId);
                            if (student) {
                              handleContactStudent(student);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                          Contact
                        </button>
                      )}
                      {(() => {
                        const alertStatus = getAlertStatus(alert);
                        if (alertStatus?.status === 'solved') {
                          return (
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm">
                                <CheckIcon className="h-3 w-3" />
                                <span>Solved</span>
                              </div>
                              <button 
                                onClick={() => {
                                  setSelectedAlertForStatus(alert);
                                  setShowStatusUpdateModal(true);
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded-md text-xs"
                              >
                                Update
                              </button>
                            </div>
                          );
                        } else if (alertStatus?.status === 'not_solved') {
                          return (
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm">
                                <XMarkIcon className="h-3 w-3" />
                                <span>Not Solved</span>
                              </div>
                              <button 
                                onClick={() => {
                                  setSelectedAlertForStatus(alert);
                                  setShowStatusUpdateModal(true);
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded-md text-xs"
                              >
                                Update
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <button 
                              onClick={() => {
                                setSelectedAlertForStatus(alert);
                                setShowStatusUpdateModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                            >
                              Solved
                            </button>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* High Risk Students Quick View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">High Risk Students - Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highRiskStudents.slice(0, 6).map(student => (
              <div key={student.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{student.name}</h4>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    HIGH RISK
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Attendance: {student.averageAttendance || 0}%</p>
                  <p>GPA: {student.gpa || 'N/A'}</p>
                  <p>Last Assessment: {student.lastAssessment ? 
                    `${daysSinceAssessment(student.lastAssessment)} days ago` : 'Never'}</p>
                </div>
                <div className="flex space-x-2 mt-3">
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">
                    Immediate Action
                  </button>
                  {isCounselor && (
                    <button 
                      onClick={() => handleContactStudent(student)}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs flex items-center"
                      title="Contact Student"
                    >
                      <ChatBubbleLeftRightIcon className="h-3 w-3" />
                    </button>
                  )}
                  <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs">
                    <EyeIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Status Update Modal */}
      {showStatusUpdateModal && selectedAlertForStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Update Alert Status
                </h2>
                <button
                  onClick={() => {
                    setShowStatusUpdateModal(false);
                    setSelectedAlertForStatus(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Alert Details */}
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {studentsData.find(s => s.id === selectedAlertForStatus.studentId)?.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{selectedAlertForStatus.message}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      selectedAlertForStatus.severity === 'high' ? 'bg-red-100 text-red-800' :
                      selectedAlertForStatus.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedAlertForStatus.severity.toUpperCase()} PRIORITY
                    </span>
                    <span className="text-xs text-gray-500">
                      Detected: {selectedAlertForStatus.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Current Status */}
                {(() => {
                  const currentStatus = getAlertStatus(selectedAlertForStatus);
                  if (currentStatus) {
                    return (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-1">Current Status</h4>
                        <div className="flex items-center space-x-2 mb-2">
                          {currentStatus.status === 'solved' ? (
                            <CheckIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm text-blue-800 capitalize">
                            {currentStatus.status.replace('_', ' ')}
                          </span>
                        </div>
                        {currentStatus.notes && (
                          <p className="text-sm text-blue-700">Notes: {currentStatus.notes}</p>
                        )}
                        <p className="text-xs text-blue-600 mt-1">
                          Updated: {currentStatus.timestamp.toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Status Options */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 mb-3">Update Status:</h4>
                
                {/* Solved Button */}
                <button
                  onClick={() => {
                    const notes = prompt('Optional notes about how this was resolved:');
                    updateAlertStatus(selectedAlertForStatus, 'solved', notes || '');
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>Mark as Solved</span>
                </button>

                {/* Not Solved Button */}
                <button
                  onClick={() => {
                    const notes = prompt('Why is this not solved? (Optional notes):');
                    updateAlertStatus(selectedAlertForStatus, 'not_solved', notes || '');
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Mark as Not Solved</span>
                </button>

                {/* Cancel Button */}
                <button
                  onClick={() => {
                    setShowStatusUpdateModal(false);
                    setSelectedAlertForStatus(null);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Analytics Modal */}
      {showAnalyticsModal && selectedStudentForAnalysis && (() => {
        const analytics = getStudentAnalytics(selectedStudentForAnalysis);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {analytics.student.name} - Comprehensive Risk Analysis
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Student ID: {analytics.student.studentId} • Generated: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAnalyticsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Risk Score Overview */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Overall Risk Assessment</h3>
                    <div className={`px-4 py-2 rounded-full text-lg font-bold ${
                      analytics.riskScore >= 7 ? 'bg-red-100 text-red-800' :
                      analytics.riskScore >= 4 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      Risk Score: {analytics.riskScore}/10
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Risk Factors */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Risk Factors Detected</h4>
                      {analytics.riskFactors.length > 0 ? (
                        <div className="space-y-2">
                          {analytics.riskFactors.map((factor, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-gray-700">{factor}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <HeartIcon className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">No significant risk factors detected</span>
                        </div>
                      )}
                    </div>

                    {/* Active Alerts */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Active Alerts ({analytics.alerts.length})</h4>
                      {analytics.alerts.length > 0 ? (
                        <div className="space-y-2">
                          {analytics.alerts.map((alert, index) => (
                            <div key={index} className={`p-2 rounded text-sm ${
                              alert.severity === 'high' ? 'bg-red-50 text-red-800' :
                              alert.severity === 'medium' ? 'bg-yellow-50 text-yellow-800' :
                              'bg-blue-50 text-blue-800'
                            }`}>
                              <span className="font-medium">{alert.severity.toUpperCase()}:</span> {alert.message}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CheckIcon className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">No active alerts</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trend Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Academic & Attendance Trends */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Performance</h3>
                    <div className="space-y-4">
                      {/* Class Attendance */}
                      <div className={`border-l-4 pl-4 ${
                        analytics.trends.attendance.status === 'critical' ? 'border-red-500' :
                        analytics.trends.attendance.status === 'concerning' ? 'border-yellow-500' : 'border-green-500'
                      }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">Class Attendance</h4>
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            analytics.trends.attendance.status === 'critical' ? 'bg-red-100 text-red-800' :
                            analytics.trends.attendance.status === 'concerning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {analytics.trends.attendance.status.toUpperCase()}
                          </div>
                        </div>
                        {analytics.trends.attendance.details.map((detail, index) => (
                          <p key={index} className="text-sm text-gray-600">{detail}</p>
                        ))}
                      </div>

                      {/* Academic Performance */}
                      <div className={`border-l-4 pl-4 ${
                        analytics.trends.academic.status === 'declining' ? 'border-red-500' :
                        analytics.trends.academic.status === 'improving' ? 'border-green-500' : 'border-blue-500'
                      }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">Academic Marks</h4>
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            analytics.trends.academic.status === 'declining' ? 'bg-red-100 text-red-800' :
                            analytics.trends.academic.status === 'improving' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {analytics.trends.academic.status.toUpperCase()}
                          </div>
                        </div>
                        {analytics.trends.academic.details.length > 0 ? (
                          analytics.trends.academic.details.map((detail, index) => (
                            <p key={index} className="text-sm text-gray-600">{detail}</p>
                          ))
                        ) : (
                          <p className="text-sm text-gray-600">Academic performance stable</p>
                        )}
                        <div className="mt-2">
                          <span className="text-sm text-gray-500">Current GPA: </span>
                          <span className={`font-medium ${
                            parseFloat(analytics.student.gpa || 0) >= 8.0 ? 'text-green-600' :
                            parseFloat(analytics.student.gpa || 0) >= 6.0 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {analytics.student.gpa || '0.00'}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Behavioral & Social Trends */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Behavioral & Social</h3>
                    <div className="space-y-4">
                      {/* Club Participation */}
                      <div className={`border-l-4 pl-4 ${
                        analytics.trends.social.status === 'withdrawn' ? 'border-red-500' :
                        analytics.trends.social.status === 'not_participating' ? 'border-gray-500' : 'border-green-500'
                      }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">Club Participation</h4>
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            analytics.trends.social.status === 'withdrawn' ? 'bg-red-100 text-red-800' :
                            analytics.trends.social.status === 'not_participating' ? 'bg-gray-100 text-gray-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {analytics.trends.social.status.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        {analytics.trends.social.details.map((detail, index) => (
                          <p key={index} className="text-sm text-gray-600">{detail}</p>
                        ))}
                      </div>

                      {/* Behavioral Changes */}
                      <div className={`border-l-4 pl-4 ${
                        analytics.trends.behavioral.status === 'concerning' ? 'border-yellow-500' : 'border-green-500'
                      }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">Behavioral Changes</h4>
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            analytics.trends.behavioral.status === 'concerning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {analytics.trends.behavioral.status.toUpperCase()}
                          </div>
                        </div>
                        {analytics.trends.behavioral.details.length > 0 ? (
                          analytics.trends.behavioral.details.map((detail, index) => (
                            <p key={index} className="text-sm text-gray-600">{detail}</p>
                          ))
                        ) : (
                          <p className="text-sm text-gray-600">No concerning behavioral changes detected</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
                  <div className="space-y-4">
                    {analytics.recommendations.map((recommendation, index) => (
                      <div key={index} className={`p-4 rounded-lg border-l-4 ${
                        recommendation.priority === 'high' ? 'border-red-500 bg-red-50' :
                        recommendation.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-green-500 bg-green-50'
                      }`}>
                        <div className="flex items-start space-x-3">
                          {recommendation.priority === 'high' ? (
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                          ) : recommendation.priority === 'medium' ? (
                            <ClockIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                          ) : (
                            <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                          )}
                          <div>
                            <h4 className={`font-medium ${
                              recommendation.priority === 'high' ? 'text-red-900' :
                              recommendation.priority === 'medium' ? 'text-yellow-900' :
                              'text-green-900'
                            }`}>
                              {recommendation.action}
                            </h4>
                            <p className={`text-sm mt-1 ${
                              recommendation.priority === 'high' ? 'text-red-700' :
                              recommendation.priority === 'medium' ? 'text-yellow-700' :
                              'text-green-700'
                            }`}>
                              {recommendation.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alert Timeline */}
                {analytics.timeline.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Timeline</h3>
                    <div className="space-y-3">
                      {analytics.timeline.map((item, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            item.severity === 'high' ? 'bg-red-500' :
                            item.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{item.description}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.severity === 'high' ? 'bg-red-100 text-red-800' :
                                item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {item.severity.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">💡 {item.recommendation}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.date.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    This analysis is based on available data and algorithmic detection patterns.
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowAnalyticsModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
                    >
                      Close
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors">
                      Schedule Intervention
                    </button>
                    {isCounselor && (
                      <button 
                        onClick={() => {
                          setShowAnalyticsModal(false);
                          handleContactStudent(analytics.student);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors flex items-center space-x-1"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        <span>Contact Student</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Contact Student Modal */}
      {showContactModal && selectedStudentForContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Contact Student: {selectedStudentForContact.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Student ID: {selectedStudentForContact.studentId} • Email: {selectedStudentForContact.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setSelectedStudentForContact(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Current Alerts Context */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-red-900 mb-2">Active Alerts for this Student:</h3>
                <div className="space-y-2">
                  {riskAlerts
                    .filter(alert => alert.studentId === selectedStudentForContact.id)
                    .map((alert, index) => (
                      <div key={index} className="text-sm text-red-800">
                        <span className="font-medium">{alert.severity.toUpperCase()}:</span> {alert.message}
                      </div>
                    ))}
                </div>
              </div>

              {/* Contact Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Contact Method:</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setContactMethod('email')}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                      contactMethod === 'email' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <EnvelopeIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Email</span>
                  </button>
                  <button
                    onClick={() => setContactMethod('phone')}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                      contactMethod === 'phone' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <PhoneIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Phone Call</span>
                  </button>
                  <button
                    onClick={() => setContactMethod('video')}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                      contactMethod === 'video' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <VideoCameraIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Video Call</span>
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject:
                </label>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Subject line for contact..."
                />
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {contactMethod === 'email' ? 'Email Message:' : 
                   contactMethod === 'phone' ? 'Call Notes/Agenda:' : 'Meeting Agenda:'}
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={8}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={contactMethod === 'email' ? 'Type your message here...' : 
                             contactMethod === 'phone' ? 'Notes and agenda for the phone call...' : 
                             'Agenda and topics for the video meeting...'}
                />
              </div>

              {/* Student Contact Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Student Contact Information:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Email:</span> {selectedStudentForContact.email}</p>
                  {selectedStudentForContact.phone && (
                    <p><span className="font-medium">Phone:</span> {selectedStudentForContact.phone}</p>
                  )}
                  <p><span className="font-medium">Course:</span> {selectedStudentForContact.course || 'Not specified'}</p>
                  <p><span className="font-medium">Year:</span> {selectedStudentForContact.year || 'Not specified'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setSelectedStudentForContact(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendContactMessage}
                  disabled={!contactSubject.trim() || !contactMessage.trim()}
                  className={`px-6 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                    !contactSubject.trim() || !contactMessage.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {contactMethod === 'email' && <EnvelopeIcon className="h-4 w-4" />}
                  {contactMethod === 'phone' && <PhoneIcon className="h-4 w-4" />}
                  {contactMethod === 'video' && <VideoCameraIcon className="h-4 w-4" />}
                  <span>
                    {contactMethod === 'email' ? 'Send Email' : 
                     contactMethod === 'phone' ? 'Schedule Call' : 'Schedule Video Meeting'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarlyWarningSystem;
