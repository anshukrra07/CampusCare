import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  AcademicCapIcon,
  CalendarIcon,
  HeartIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ArrowPathIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const Analytics = ({ studentsData, institutionCode }) => {
  const [activeView, setActiveView] = useState('overview');
  const [timeFilter, setTimeFilter] = useState('semester'); // 'month', 'semester', 'year'
  const [courseFilter, setCourseFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Analytics views configuration
  const analyticsViews = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'academic', name: 'Academic Performance', icon: AcademicCapIcon },
    { id: 'attendance', name: 'Attendance Analytics', icon: CalendarIcon },
    { id: 'wellness', name: 'Wellness & Mental Health', icon: HeartIcon },
    { id: 'social', name: 'Social Engagement', icon: UsersIcon },
    { id: 'early-warning', name: 'Risk Analytics', icon: ExclamationTriangleIcon },
  ];

  // Get unique courses and departments for filtering
  const uniqueCourses = ['all', ...new Set(studentsData.map(s => s.course).filter(Boolean))];
  const uniqueDepartments = ['all', ...new Set(studentsData.map(s => s.department).filter(Boolean))];

  // Filter students based on current filters
  const filteredStudents = studentsData.filter(student => {
    if (courseFilter !== 'all' && student.course !== courseFilter) return false;
    if (departmentFilter !== 'all' && student.department !== departmentFilter) return false;
    return true;
  });

  // Academic Performance Analytics
  const getAcademicAnalytics = () => {
    const students = filteredStudents;
    
    // GPA Distribution
    const gpaRanges = {
      'Excellent (3.5-4.0)': students.filter(s => parseFloat(s.gpa || 0) >= 3.5).length,
      'Good (3.0-3.49)': students.filter(s => parseFloat(s.gpa || 0) >= 3.0 && parseFloat(s.gpa || 0) < 3.5).length,
      'Average (2.5-2.99)': students.filter(s => parseFloat(s.gpa || 0) >= 2.5 && parseFloat(s.gpa || 0) < 3.0).length,
      'Below Average (2.0-2.49)': students.filter(s => parseFloat(s.gpa || 0) >= 2.0 && parseFloat(s.gpa || 0) < 2.5).length,
      'Poor (<2.0)': students.filter(s => parseFloat(s.gpa || 0) < 2.0).length,
    };

    // Average marks trend
    const avgMarks = students.reduce((sum, s) => sum + (s.averageMarks || 0), 0) / students.length || 0;
    
    // Students at risk academically
    const academicRiskStudents = students.filter(s => 
      parseFloat(s.gpa || 0) < 2.5 || (s.averageMarks || 0) < 60
    );

    // Top performers
    const topPerformers = students.filter(s => 
      parseFloat(s.gpa || 0) >= 3.5 && (s.averageMarks || 0) >= 85
    );

    return {
      totalStudents: students.length,
      avgGPA: students.reduce((sum, s) => sum + parseFloat(s.gpa || 0), 0) / students.length || 0,
      avgMarks: avgMarks,
      gpaDistribution: gpaRanges,
      academicRiskCount: academicRiskStudents.length,
      topPerformersCount: topPerformers.length,
      academicRiskStudents: academicRiskStudents.slice(0, 10), // Top 10 at risk
      topPerformers: topPerformers.slice(0, 10), // Top 10 performers
    };
  };

  // Attendance Analytics
  const getAttendanceAnalytics = () => {
    const students = filteredStudents;
    
    const attendanceRanges = {
      'Excellent (>90%)': students.filter(s => (s.averageAttendance || 0) > 90).length,
      'Good (80-90%)': students.filter(s => (s.averageAttendance || 0) >= 80 && (s.averageAttendance || 0) <= 90).length,
      'Average (70-79%)': students.filter(s => (s.averageAttendance || 0) >= 70 && (s.averageAttendance || 0) < 80).length,
      'Below Average (60-69%)': students.filter(s => (s.averageAttendance || 0) >= 60 && (s.averageAttendance || 0) < 70).length,
      'Poor (<60%)': students.filter(s => (s.averageAttendance || 0) < 60).length,
    };

    const lowAttendanceStudents = students.filter(s => (s.averageAttendance || 0) < 75);
    const avgAttendance = students.reduce((sum, s) => sum + (s.averageAttendance || 0), 0) / students.length || 0;

    return {
      avgAttendance: avgAttendance,
      attendanceDistribution: attendanceRanges,
      lowAttendanceCount: lowAttendanceStudents.length,
      lowAttendanceStudents: lowAttendanceStudents.slice(0, 10),
    };
  };

  // Wellness Analytics
  const getWellnessAnalytics = () => {
    const students = filteredStudents;
    
    const wellnessRanges = {
      'Excellent (8-10)': students.filter(s => (s.wellnessScore || 0) >= 8).length,
      'Good (6-7.9)': students.filter(s => (s.wellnessScore || 0) >= 6 && (s.wellnessScore || 0) < 8).length,
      'Average (4-5.9)': students.filter(s => (s.wellnessScore || 0) >= 4 && (s.wellnessScore || 0) < 6).length,
      'At Risk (2-3.9)': students.filter(s => (s.wellnessScore || 0) >= 2 && (s.wellnessScore || 0) < 4).length,
      'High Risk (<2)': students.filter(s => (s.wellnessScore || 0) < 2 && (s.wellnessScore || 0) > 0).length,
      'Not Assessed': students.filter(s => !s.wellnessScore || s.wellnessScore === 0).length,
    };

    const highRiskStudents = students.filter(s => (s.wellnessScore || 0) < 4 && (s.wellnessScore || 0) > 0);
    const counselorAssigned = students.filter(s => s.counselorAssigned).length;

    return {
      avgWellnessScore: students.filter(s => s.wellnessScore > 0).reduce((sum, s) => sum + (s.wellnessScore || 0), 0) / students.filter(s => s.wellnessScore > 0).length || 0,
      wellnessDistribution: wellnessRanges,
      highRiskCount: highRiskStudents.length,
      counselorAssignedCount: counselorAssigned,
      highRiskStudents: highRiskStudents.slice(0, 10),
    };
  };

  // Social Engagement Analytics
  const getSocialEngagementAnalytics = () => {
    const students = filteredStudents;
    
    const clubParticipation = {
      'Very Active (3+ clubs)': students.filter(s => (s.socialClubs || []).length >= 3).length,
      'Active (2 clubs)': students.filter(s => (s.socialClubs || []).length === 2).length,
      'Moderate (1 club)': students.filter(s => (s.socialClubs || []).length === 1).length,
      'Not Participating': students.filter(s => (s.socialClubs || []).length === 0).length,
    };

    const sociallyWithdrawn = students.filter(s => (s.socialClubs || []).length === 0);
    const avgClubsPerStudent = students.reduce((sum, s) => sum + (s.socialClubs || []).length, 0) / students.length || 0;

    return {
      avgClubsPerStudent: avgClubsPerStudent,
      clubParticipationDistribution: clubParticipation,
      sociallyWithdrawnCount: sociallyWithdrawn.length,
      sociallyWithdrawnStudents: sociallyWithdrawn.slice(0, 10),
    };
  };

  // Risk Analytics
  const getRiskAnalytics = () => {
    const students = filteredStudents;
    
    // Multiple risk factors
    const riskFactors = students.map(student => {
      const risks = [];
      
      if (parseFloat(student.gpa || 0) < 2.5) risks.push('Academic Performance');
      if ((student.averageAttendance || 0) < 75) risks.push('Low Attendance');
      if ((student.wellnessScore || 0) < 4 && (student.wellnessScore || 0) > 0) risks.push('Mental Health');
      if ((student.socialClubs || []).length === 0) risks.push('Social Isolation');
      
      return {
        ...student,
        riskFactors: risks,
        riskLevel: risks.length >= 3 ? 'High' : risks.length >= 2 ? 'Medium' : risks.length >= 1 ? 'Low' : 'None'
      };
    });

    const riskDistribution = {
      'High Risk (3+ factors)': riskFactors.filter(s => s.riskLevel === 'High').length,
      'Medium Risk (2 factors)': riskFactors.filter(s => s.riskLevel === 'Medium').length,
      'Low Risk (1 factor)': riskFactors.filter(s => s.riskLevel === 'Low').length,
      'No Risk': riskFactors.filter(s => s.riskLevel === 'None').length,
    };

    const highRiskStudents = riskFactors.filter(s => s.riskLevel === 'High');

    return {
      riskDistribution,
      highRiskCount: highRiskStudents.length,
      highRiskStudents: highRiskStudents.slice(0, 10),
    };
  };

  // Overview Analytics
  const getOverviewAnalytics = () => {
    const academic = getAcademicAnalytics();
    const attendance = getAttendanceAnalytics();
    const wellness = getWellnessAnalytics();
    const social = getSocialEngagementAnalytics();
    const risk = getRiskAnalytics();

    return {
      totalStudents: filteredStudents.length,
      academicPerformance: {
        avgGPA: academic.avgGPA,
        avgMarks: academic.avgMarks,
        atRisk: academic.academicRiskCount,
        topPerformers: academic.topPerformersCount,
      },
      attendance: {
        avgAttendance: attendance.avgAttendance,
        lowAttendance: attendance.lowAttendanceCount,
      },
      wellness: {
        avgWellnessScore: wellness.avgWellnessScore,
        highRisk: wellness.highRiskCount,
        counselorAssigned: wellness.counselorAssignedCount,
      },
      social: {
        avgClubsPerStudent: social.avgClubsPerStudent,
        sociallyWithdrawn: social.sociallyWithdrawnCount,
      },
      overallRisk: {
        highRisk: risk.highRiskCount,
        mediumRisk: risk.riskDistribution['Medium Risk (2 factors)'],
        lowRisk: risk.riskDistribution['Low Risk (1 factor)'],
      }
    };
  };

  // Export data functions
  const exportAsJSON = () => {
    const analytics = {
      overview: getOverviewAnalytics(),
      academic: getAcademicAnalytics(),
      attendance: getAttendanceAnalytics(),
      wellness: getWellnessAnalytics(),
      social: getSocialEngagementAnalytics(),
      risk: getRiskAnalytics(),
      exportDate: new Date().toISOString(),
      filters: {
        timeFilter,
        courseFilter,
        departmentFilter,
      }
    };

    const dataStr = JSON.stringify(analytics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `campuscare-analytics-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportAsCSV = () => {
    const overview = getOverviewAnalytics();
    const academic = getAcademicAnalytics();
    const attendance = getAttendanceAnalytics();
    const wellness = getWellnessAnalytics();
    const social = getSocialEngagementAnalytics();
    const risk = getRiskAnalytics();

    // Create CSV content for overview summary
    const csvContent = [
      ['CampusCare Analytics Report'],
      ['Export Date', new Date().toLocaleString()],
      ['Filters Applied', `Time: ${timeFilter}, Course: ${courseFilter}, Department: ${departmentFilter}`],
      [''],
      ['OVERVIEW METRICS'],
      ['Total Students', overview.totalStudents],
      ['Average GPA', overview.academicPerformance.avgGPA.toFixed(2)],
      ['Average Marks', overview.academicPerformance.avgMarks.toFixed(1)],
      ['Average Attendance', `${overview.attendance.avgAttendance.toFixed(1)}%`],
      ['High Risk Students', overview.overallRisk.highRisk],
      [''],
      ['ACADEMIC PERFORMANCE'],
      ['Top Performers', academic.topPerformersCount],
      ['Academic Risk', academic.academicRiskCount],
      [''],
      ['WELLNESS METRICS'],
      ['Average Wellness Score', `${wellness.avgWellnessScore.toFixed(1)}/10`],
      ['High Risk Wellness', wellness.highRiskCount],
      ['Counselor Assigned', wellness.counselorAssignedCount],
      [''],
      ['SOCIAL ENGAGEMENT'],
      ['Average Clubs per Student', social.avgClubsPerStudent.toFixed(1)],
      ['Socially Withdrawn', social.sociallyWithdrawnCount],
      [''],
      ['ATTENDANCE ANALYSIS'],
      ['Low Attendance Count', attendance.lowAttendanceCount],
      [''],
      ['HIGH RISK STUDENTS (Top 10)'],
      ['Student Name', 'Risk Factors', 'Risk Level']
    ];

    // Add high risk students data
    risk.highRiskStudents.forEach(student => {
      csvContent.push([
        student.name,
        student.riskFactors.join('; '),
        student.riskLevel
      ]);
    });

    const csvString = csvContent.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `campuscare-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSummaryReport = () => {
    const overview = getOverviewAnalytics();
    const reportContent = `
# CampusCare Analytics Summary Report

**Generated:** ${new Date().toLocaleString()}
**Filters Applied:** Time Period: ${timeFilter}, Course: ${courseFilter}, Department: ${departmentFilter}

## Key Metrics Overview

- **Total Students:** ${overview.totalStudents}
- **Average GPA:** ${overview.academicPerformance.avgGPA.toFixed(2)}
- **Average Attendance:** ${overview.attendance.avgAttendance.toFixed(1)}%
- **High Risk Students:** ${overview.overallRisk.highRisk} (${((overview.overallRisk.highRisk / overview.totalStudents) * 100).toFixed(1)}%)

## Academic Performance
- **Top Performers:** ${overview.academicPerformance.topPerformers} students (GPA ≥ 3.5)
- **At Academic Risk:** ${overview.academicPerformance.atRisk} students (GPA < 2.5 or marks < 60%)
- **Average Marks:** ${overview.academicPerformance.avgMarks.toFixed(1)}/100

## Wellness & Mental Health
- **Average Wellness Score:** ${overview.wellness.avgWellnessScore.toFixed(1)}/10
- **High Risk (Wellness):** ${overview.wellness.highRisk} students
- **Students with Counselor:** ${overview.wellness.counselorAssigned} students

## Social Engagement
- **Average Clubs per Student:** ${overview.social.avgClubsPerStudent.toFixed(1)}
- **Socially Withdrawn:** ${overview.social.sociallyWithdrawn} students (no club participation)

## Attendance Patterns
- **Low Attendance:** ${overview.attendance.lowAttendance} students (<75% attendance)

## Risk Distribution
- **High Risk:** ${overview.overallRisk.highRisk} students (3+ risk factors)
- **Medium Risk:** ${overview.overallRisk.mediumRisk} students (2 risk factors)
- **Low Risk:** ${overview.overallRisk.lowRisk} students (1 risk factor)

---

*This report was generated automatically by CampusCare Analytics Dashboard.*
    `;

    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `campuscare-summary-report-${new Date().toISOString().split('T')[0]}.md`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render analytics cards
  const renderMetricCard = (title, value, trend, color = 'blue', subtitle = '') => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {trend && (
          <div className={`h-12 w-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
            {trend === 'up' ? (
              <ArrowTrendingUpIcon className={`h-6 w-6 text-${color}-600`} />
            ) : (
              <ArrowTrendingDownIcon className={`h-6 w-6 text-${color}-600`} />
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into student performance and institutional metrics</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative group">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span>Export Reports</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-1">
                <button
                  onClick={generateSummaryReport}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  📄 Summary Report (.md)
                </button>
                <button
                  onClick={exportAsCSV}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  📊 Analytics Data (.csv)
                </button>
                <button
                  onClick={exportAsJSON}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  🔧 Raw Data (.json)
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Time Period:</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="month">This Month</option>
              <option value="semester">This Semester</option>
              <option value="year">This Year</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Course:</label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {uniqueCourses.map(course => (
                <option key={course} value={course}>
                  {course === 'all' ? 'All Courses' : course}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Department:</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Analytics Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Analytics">
            {analyticsViews.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeView === view.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{view.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview */}
          {activeView === 'overview' && (
            <div className="space-y-6">
              {(() => {
                const overview = getOverviewAnalytics();
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {renderMetricCard('Total Students', overview.totalStudents, null, 'blue')}
                      {renderMetricCard('Average GPA', overview.academicPerformance.avgGPA.toFixed(2), 'up', 'green')}
                      {renderMetricCard('Average Attendance', `${overview.attendance.avgAttendance.toFixed(1)}%`, 'up', 'blue')}
                      {renderMetricCard('High Risk Students', overview.overallRisk.highRisk, 'down', 'red', 'Multiple risk factors')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Performance</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Average Marks</span>
                            <span className="font-medium">{overview.academicPerformance.avgMarks.toFixed(1)}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Top Performers</span>
                            <span className="font-medium text-green-600">{overview.academicPerformance.topPerformers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">At Risk</span>
                            <span className="font-medium text-red-600">{overview.academicPerformance.atRisk}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wellness Status</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Average Wellness Score</span>
                            <span className="font-medium">{overview.wellness.avgWellnessScore.toFixed(1)}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Counselor Assigned</span>
                            <span className="font-medium text-blue-600">{overview.wellness.counselorAssigned}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">High Risk</span>
                            <span className="font-medium text-red-600">{overview.wellness.highRisk}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Engagement</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Avg Clubs/Student</span>
                            <span className="font-medium">{overview.social.avgClubsPerStudent.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Socially Withdrawn</span>
                            <span className="font-medium text-red-600">{overview.social.sociallyWithdrawn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Risk Level</span>
                            <span className="font-medium text-yellow-600">Medium</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Academic Performance */}
          {activeView === 'academic' && (
            <div className="space-y-6">
              {(() => {
                const academic = getAcademicAnalytics();
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {renderMetricCard('Average GPA', academic.avgGPA.toFixed(2), 'up', 'green')}
                      {renderMetricCard('Average Marks', `${academic.avgMarks.toFixed(1)}/100`, 'up', 'blue')}
                      {renderMetricCard('Top Performers', academic.topPerformersCount, 'up', 'green', 'GPA ≥ 3.5')}
                      {renderMetricCard('At Risk', academic.academicRiskCount, 'down', 'red', 'GPA < 2.5')}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* GPA Distribution */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">GPA Distribution</h3>
                        <div className="space-y-3">
                          {Object.entries(academic.gpaDistribution).map(([range, count]) => (
                            <div key={range} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{range}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{width: `${(count / academic.totalStudents) * 100}%`}}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium w-8">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* At Risk Students */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Students at Academic Risk</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {academic.academicRiskStudents.map((student, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.course} - {student.year}th Year</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-red-600">GPA: {student.gpa}</div>
                                <div className="text-xs text-gray-500">Avg: {student.averageMarks}%</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Attendance Analytics */}
          {activeView === 'attendance' && (
            <div className="space-y-6">
              {(() => {
                const attendance = getAttendanceAnalytics();
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {renderMetricCard('Average Attendance', `${attendance.avgAttendance.toFixed(1)}%`, 'up', 'blue')}
                      {renderMetricCard('Low Attendance', attendance.lowAttendanceCount, 'down', 'yellow', '<75% attendance')}
                      {renderMetricCard('Risk Level', 'Medium', null, 'orange')}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Attendance Distribution */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Distribution</h3>
                        <div className="space-y-3">
                          {Object.entries(attendance.attendanceDistribution).map(([range, count]) => (
                            <div key={range} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{range}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      range.includes('Excellent') ? 'bg-green-600' :
                                      range.includes('Good') ? 'bg-blue-600' :
                                      range.includes('Average') ? 'bg-yellow-600' :
                                      'bg-red-600'
                                    }`}
                                    style={{width: `${(count / filteredStudents.length) * 100}%`}}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium w-8">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Low Attendance Students */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Attendance Students</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {attendance.lowAttendanceStudents.map((student, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.course} - {student.year}th Year</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-yellow-600">{student.averageAttendance}%</div>
                                <div className="text-xs text-gray-500">Attendance</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Wellness Analytics */}
          {activeView === 'wellness' && (
            <div className="space-y-6">
              {(() => {
                const wellness = getWellnessAnalytics();
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {renderMetricCard('Avg Wellness Score', `${wellness.avgWellnessScore.toFixed(1)}/10`, 'up', 'green')}
                      {renderMetricCard('High Risk', wellness.highRiskCount, 'down', 'red', 'Wellness < 4')}
                      {renderMetricCard('Counselor Assigned', wellness.counselorAssignedCount, 'up', 'blue')}
                      {renderMetricCard('Not Assessed', wellness.wellnessDistribution['Not Assessed'], null, 'gray')}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Wellness Distribution */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wellness Score Distribution</h3>
                        <div className="space-y-3">
                          {Object.entries(wellness.wellnessDistribution).map(([range, count]) => (
                            <div key={range} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{range}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      range.includes('Excellent') ? 'bg-green-600' :
                                      range.includes('Good') ? 'bg-blue-600' :
                                      range.includes('Average') ? 'bg-yellow-600' :
                                      range.includes('At Risk') || range.includes('High Risk') ? 'bg-red-600' :
                                      'bg-gray-400'
                                    }`}
                                    style={{width: `${(count / filteredStudents.length) * 100}%`}}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium w-8">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* High Risk Students */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Students at Wellness Risk</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {wellness.highRiskStudents.map((student, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">
                                  {student.counselorAssigned ? 'Counselor Assigned' : 'No Counselor Assigned'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-red-600">Score: {student.wellnessScore}/10</div>
                                <div className="text-xs text-gray-500">High Risk</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Social Engagement */}
          {activeView === 'social' && (
            <div className="space-y-6">
              {(() => {
                const social = getSocialEngagementAnalytics();
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {renderMetricCard('Avg Clubs per Student', social.avgClubsPerStudent.toFixed(1), 'up', 'purple')}
                      {renderMetricCard('Socially Withdrawn', social.sociallyWithdrawnCount, 'down', 'red', 'No club participation')}
                      {renderMetricCard('Engagement Level', 'Good', 'up', 'green')}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Club Participation Distribution */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Club Participation Distribution</h3>
                        <div className="space-y-3">
                          {Object.entries(social.clubParticipationDistribution).map(([range, count]) => (
                            <div key={range} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{range}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      range.includes('Very Active') ? 'bg-green-600' :
                                      range.includes('Active') ? 'bg-blue-600' :
                                      range.includes('Moderate') ? 'bg-yellow-600' :
                                      'bg-red-600'
                                    }`}
                                    style={{width: `${(count / filteredStudents.length) * 100}%`}}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium w-8">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Socially Withdrawn Students */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Socially Withdrawn Students</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {social.sociallyWithdrawnStudents.map((student, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.course} - {student.year}th Year</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-red-600">No Clubs</div>
                                <div className="text-xs text-gray-500">Social isolation risk</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Risk Analytics */}
          {activeView === 'early-warning' && (
            <div className="space-y-6">
              {(() => {
                const risk = getRiskAnalytics();
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {renderMetricCard('High Risk', risk.highRiskCount, 'down', 'red', '3+ risk factors')}
                      {renderMetricCard('Medium Risk', risk.riskDistribution['Medium Risk (2 factors)'], 'down', 'yellow', '2 risk factors')}
                      {renderMetricCard('Low Risk', risk.riskDistribution['Low Risk (1 factor)'], 'up', 'blue', '1 risk factor')}
                      {renderMetricCard('No Risk', risk.riskDistribution['No Risk'], 'up', 'green', 'No risk factors')}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Risk Distribution */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Distribution</h3>
                        <div className="space-y-3">
                          {Object.entries(risk.riskDistribution).map(([range, count]) => (
                            <div key={range} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{range}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      range.includes('High Risk') ? 'bg-red-600' :
                                      range.includes('Medium Risk') ? 'bg-yellow-600' :
                                      range.includes('Low Risk') ? 'bg-blue-600' :
                                      'bg-green-600'
                                    }`}
                                    style={{width: `${(count / filteredStudents.length) * 100}%`}}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium w-8">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* High Risk Students */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">High Risk Students</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {risk.highRiskStudents.map((student, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">{student.name}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Risk Factors: {student.riskFactors.join(', ')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-red-600">
                                  {student.riskFactors.length} factors
                                </div>
                                <div className="text-xs text-gray-500">High Risk</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;