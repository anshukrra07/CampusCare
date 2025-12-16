import { SUBJECT_MAP, DEFAULT_SUBJECTS } from '../constants/academicData';
import { CLUB_EVENT_TYPES } from '../constants/socialClubsData';

// Academic utility functions
export const getSubjectsByCourse = (course) => {
  return SUBJECT_MAP[course] || DEFAULT_SUBJECTS;
};

export const generateBiMonthlyMarks = (course) => {
  const periods = [
    'Jan-Feb 2024', 'Mar-Apr 2024', 'May-Jun 2024', 'Jul-Aug 2024',
    'Sep-Oct 2024', 'Nov-Dec 2024'
  ];
  const courseSubjects = getSubjectsByCourse(course);
  
  return periods.map(period => {
    const subjects = {};
    courseSubjects.forEach(subject => {
      subjects[subject] = Math.floor(Math.random() * 40) + 60;
    });
    
    const overallMarks = Object.values(subjects).reduce((sum, mark) => sum + mark, 0) / courseSubjects.length;
    
    return {
      period,
      marks: Math.round(overallMarks),
      maxMarks: 100,
      examType: ['Mid Semester', 'End Semester'][Math.floor(Math.random() * 2)],
      subjects
    };
  });
};

export const generateAttendanceData = () => {
  const periods = [];
  const currentDate = new Date();
  for (let i = 0; i < 36; i++) { // 36 periods of 10 days = ~1 year
    const periodStart = new Date(currentDate);
    periodStart.setDate(currentDate.getDate() - (i * 10));
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 9);
    
    periods.unshift({
      period: i + 1,
      startDate: periodStart.toLocaleDateString(),
      endDate: periodEnd.toLocaleDateString(),
      present: Math.floor(Math.random() * 3) + 7, // 7-10 days
      total: 10,
      percentage: Math.floor(((Math.floor(Math.random() * 3) + 7) / 10) * 100)
    });
  }
  return periods;
};

// Date formatting utilities
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  // If it's already a Date object
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  
  // If it's a Firestore Timestamp
  if (date && typeof date.toDate === 'function') {
    return date.toDate().toLocaleDateString();
  }
  
  // If it's a string, try to parse it
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString();
    }
  }
  
  // If it has seconds property (Firestore timestamp format)
  if (date && date.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString();
  }
  
  return 'N/A';
};

export const formatDateForInput = (date) => {
  if (!date) return '';
  
  try {
    let dateObj;
    
    // If it's already a Date object
    if (date instanceof Date) {
      dateObj = date;
    }
    // If it's a Firestore Timestamp
    else if (date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    }
    // If it has seconds property (Firestore timestamp format)
    else if (date && date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    }
    // If it's a string, try to parse it
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    else {
      return '';
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    // Return in YYYY-MM-DD format for input field
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for input:', error, date);
    return '';
  }
};

// Sorting utilities
export const sortStudents = (students, sortBy, sortOrder) => {
  return [...students].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = (a.name || '').toLowerCase();
        bValue = (b.name || '').toLowerCase();
        break;
      case 'gpa':
        aValue = parseFloat(a.gpa || 0);
        bValue = parseFloat(b.gpa || 0);
        break;
      case 'attendance':
        aValue = a.averageAttendance || 0;
        bValue = b.averageAttendance || 0;
        break;
      case 'marks':
        aValue = a.averageMarks || 0;
        bValue = b.averageMarks || 0;
        break;
      case 'status':
        const statusOrder = { 'Excellent': 3, 'Active': 2, 'At Risk': 1 };
        aValue = statusOrder[a.status] || 0;
        bValue = statusOrder[b.status] || 0;
        break;
      default:
        aValue = a.name || '';
        bValue = b.name || '';
    }
    
    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

// Club-related utilities
export const getClubEventTypes = (category) => {
  return CLUB_EVENT_TYPES[category] || ['Club Meeting', 'Regular Activity', 'Special Event'];
};

export const getMonthNames = () => [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    years.push(i);
  }
  return years;
};

export const generateClubAttendanceWeeks = (month, year) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks = [];
  
  let currentWeekStart = new Date(firstDay);
  
  // Find the first Monday of the month (or the 1st if it's not a Monday)
  while (currentWeekStart.getDay() !== 1 && currentWeekStart.getDate() > 1) {
    currentWeekStart.setDate(currentWeekStart.getDate() - 1);
  }
  
  let weekNumber = 1;
  while (currentWeekStart <= lastDay) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    
    // If week end is in next month, limit to last day of current month
    if (weekEnd.getMonth() !== month) {
      weekEnd.setDate(lastDay.getDate());
      weekEnd.setMonth(month);
      weekEnd.setFullYear(year);
    }
    
    weeks.push({
      id: `week-${weekNumber}`,
      name: `Week ${weekNumber}`,
      startDate: new Date(currentWeekStart),
      endDate: new Date(weekEnd),
      dateRange: `${currentWeekStart.getDate()}-${weekEnd.getDate()}`
    });
    
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    weekNumber++;
    
    // Limit to 5 weeks max
    if (weekNumber > 5) break;
  }
  
  return weeks;
};

// Stats calculation
export const calculateStats = (studentsData) => {
  return {
    totalStudents: studentsData.length,
    totalCounselors: 24,
    averageWellnessScore: studentsData.length > 0 ? (studentsData.reduce((sum, s) => sum + (s.wellnessScore || 0), 0) / studentsData.length).toFixed(1) : '0.0',
    dropoutRisk: studentsData.filter(s => s.status === 'At Risk').length,
    lowAttendance: studentsData.filter(s => (s.averageAttendance || 0) < 80).length,
    excellentStudents: studentsData.filter(s => s.status === 'Excellent').length,
    averageGPA: studentsData.length > 0 ? (studentsData.reduce((sum, s) => sum + parseFloat(s.gpa || 0), 0) / studentsData.length).toFixed(2) : '0.00'
  };
};