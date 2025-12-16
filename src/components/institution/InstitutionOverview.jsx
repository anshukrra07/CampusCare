import React from 'react';
import {
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  HeartIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const InstitutionOverview = ({ studentsData, stats, setActiveTab }) => {
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-xl text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.totalStudents}</div>
            <div className="text-purple-100">Total Students</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.averageGPA}/10</div>
            <div className="text-purple-100">Institution GPA</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {Math.round(studentsData.length > 0 ? studentsData.reduce((sum, s) => sum + (s.averageAttendance || 0), 0) / studentsData.length : 0)}%
            </div>
            <div className="text-purple-100">Average Attendance</div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Academic Excellence</p>
              <p className="text-2xl font-bold text-green-600">{stats.excellentStudents}</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((stats.excellentStudents / (stats.totalStudents || 1)) * 100)}% of students
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">At-Risk Students</p>
              <p className="text-2xl font-bold text-red-600">{stats.dropoutRisk}</p>
              <p className="text-xs text-red-500 mt-1">
                {Math.round((stats.dropoutRisk / (stats.totalStudents || 1)) * 100)}% need intervention
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance Issues</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowAttendance}</p>
              <p className="text-xs text-yellow-600 mt-1">Below 80% attendance</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Department-wise Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Department Performance</h3>
          <div className="space-y-4">
            {(() => {
              const deptStats = {};
              studentsData.forEach(student => {
                const dept = student.department || 'Unknown';
                if (!deptStats[dept]) {
                  deptStats[dept] = { count: 0, totalMarks: 0, totalAttendance: 0, excellent: 0, atRisk: 0 };
                }
                deptStats[dept].count++;
                deptStats[dept].totalMarks += student.averageMarks || 0;
                deptStats[dept].totalAttendance += student.averageAttendance || 0;
                if (student.status === 'Excellent') deptStats[dept].excellent++;
                if (student.status === 'At Risk') deptStats[dept].atRisk++;
              });
              
              return Object.entries(deptStats).slice(0, 5).map(([dept, data]) => {
                const avgMarks = Math.round(data.totalMarks / data.count);
                const avgAttendance = Math.round(data.totalAttendance / data.count);
                return (
                  <div key={dept} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {dept.length > 25 ? dept.substring(0, 25) + '...' : dept}
                      </div>
                      <div className="text-sm text-gray-500">{data.count} students</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{avgMarks}/100 avg</div>
                      <div className="text-xs text-gray-500">{avgAttendance}% attendance</div>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        {data.excellent} excellent
                      </span>
                      {data.atRisk > 0 && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          {data.atRisk} at risk
                        </span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Year-wise Distribution</h3>
          <div className="space-y-4">
            {(() => {
              const yearStats = {};
              studentsData.forEach(student => {
                const year = student.year || 'Unknown';
                if (!yearStats[year]) {
                  yearStats[year] = { count: 0, excellent: 0, active: 0, atRisk: 0 };
                }
                yearStats[year].count++;
                if (student.status === 'Excellent') yearStats[year].excellent++;
                else if (student.status === 'Active') yearStats[year].active++;
                else if (student.status === 'At Risk') yearStats[year].atRisk++;
              });
              
              return Object.entries(yearStats).sort(([a], [b]) => a - b).map(([year, data]) => {
                const excellentPct = Math.round((data.excellent / data.count) * 100);
                const atRiskPct = Math.round((data.atRisk / data.count) * 100);
                return (
                  <div key={year} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">Year {year}</span>
                      <span className="text-sm text-gray-500">{data.count} students</span>
                    </div>
                    <div className="flex space-x-2 mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${excellentPct}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{data.excellent} excellent ({excellentPct}%)</span>
                      <span>{data.atRisk} at risk ({atRiskPct}%)</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Academic & Attendance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Academic Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Students with GPA &gt; 8.0</span>
              <div className="text-right">
                <span className="text-lg font-semibold text-green-600">
                  {studentsData.filter(s => parseFloat(s.gpa || 0) > 8.0).length}
                </span>
                <div className="text-xs text-gray-500">
                  {studentsData.length > 0 ? Math.round((studentsData.filter(s => parseFloat(s.gpa || 0) > 8.0).length / studentsData.length) * 100) : 0}%
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Students with GPA &lt; 6.0</span>
              <div className="text-right">
                <span className="text-lg font-semibold text-red-600">
                  {studentsData.filter(s => parseFloat(s.gpa || 0) < 6.0).length}
                </span>
                <div className="text-xs text-gray-500">
                  {studentsData.length > 0 ? Math.round((studentsData.filter(s => parseFloat(s.gpa || 0) < 6.0).length / studentsData.length) * 100) : 0}%
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Perfect Attendance (&gt;95%)</span>
              <div className="text-right">
                <span className="text-lg font-semibold text-blue-600">
                  {studentsData.filter(s => (s.averageAttendance || 0) > 95).length}
                </span>
                <div className="text-xs text-gray-500">
                  {studentsData.length > 0 ? Math.round((studentsData.filter(s => (s.averageAttendance || 0) > 95).length / studentsData.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h3>
          <div className="space-y-3">
            {stats.dropoutRisk > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Urgent: {stats.dropoutRisk} students need intervention
                  </span>
                </div>
              </div>
            )}
            {stats.lowAttendance > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    {stats.lowAttendance} students have low attendance
                  </span>
                </div>
              </div>
            )}
            <button 
              onClick={() => setActiveTab('students')}
              className="w-full p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center justify-center space-x-2">
                <UsersIcon className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">View All Students</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionOverview;