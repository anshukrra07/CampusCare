import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  ChartBarIcon,
  AcademicCapIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  XMarkIcon,
  CheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BarsArrowUpIcon,
  ShieldExclamationIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { db, auth } from '../../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  orderBy,
  where 
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import InstitutionOverview from './InstitutionOverview';
import EarlyWarningSystem from './EarlyWarningSystem';
import Analytics from './Analytics';
import CounselorManagement from './CounselorManagement';

export default function InstitutionDashboard() {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'details', 'add', 'edit'
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [institutionCode, setInstitutionCode] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'gpa', 'attendance', 'status', 'marks'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  
  // Logout function
  const handleLogout = () => {
    auth.signOut();
    localStorage.removeItem('userRole');
  };
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    course: '',
    department: '',
    year: 1,
    semester: 1,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    medicalInfo: {
      allergies: '',
      medications: '',
      conditions: ''
    }
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'students', name: 'Students', icon: UsersIcon },
    { id: 'early-warning', name: 'Early Warning', icon: ShieldExclamationIcon },
    { id: 'counselors', name: 'Counselors', icon: HeartIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  ];

  // Course and department data for form dropdowns
  const courses = [
    'BTech CSE', 'BTech AIML', 'BTech ECE', 'BTech Mechanical', 'BTech Civil',
    'BTech IT', 'BTech EEE', 'BTech Aerospace', 'BTech Biotechnology',
    'MCA', 'MBA', 'BBA', 'BCA', 'BSc Computer Science', 'BSc IT',
    'MSc Data Science', 'MTech CSE', 'MTech AIML', 'BE CSE', 'BE ECE',
    'Diploma CSE', 'Diploma ECE', 'Diploma Mechanical', 'BCom', 'MCom'
  ];
  const departments = [
    'Computer Science & Engineering', 'Electronics & Communication', 
    'Mechanical Engineering', 'Civil Engineering', 'Information Technology',
    'Electrical & Electronics', 'Management Studies', 'Commerce',
    'Applied Sciences', 'Aerospace Engineering'
  ];

  // Social Clubs and Extracurricular Activities
  const socialClubsAndActivities = [
    // Arts & Performance
    { id: 'theatre', name: 'Theatre Club', category: 'Arts & Performance' },
    { id: 'dance', name: 'Dance Club', category: 'Arts & Performance' },
    { id: 'music', name: 'Music Club', category: 'Arts & Performance' },
    { id: 'art', name: 'Art & Craft Club', category: 'Arts & Performance' },
    { id: 'photography', name: 'Photography Club', category: 'Arts & Performance' },
    
    // Sports & Fitness
    { id: 'cricket', name: 'Cricket Club', category: 'Sports & Fitness' },
    { id: 'football', name: 'Football Club', category: 'Sports & Fitness' },
    { id: 'basketball', name: 'Basketball Club', category: 'Sports & Fitness' },
    { id: 'badminton', name: 'Badminton Club', category: 'Sports & Fitness' },
    { id: 'table-tennis', name: 'Table Tennis Club', category: 'Sports & Fitness' },
    { id: 'athletics', name: 'Athletics Club', category: 'Sports & Fitness' },
    { id: 'yoga', name: 'Yoga & Wellness Club', category: 'Sports & Fitness' },
    { id: 'gym', name: 'Fitness Club', category: 'Sports & Fitness' },
    
    // Academic & Professional
    { id: 'debate', name: 'Debate Society', category: 'Academic & Professional' },
    { id: 'quiz', name: 'Quiz Club', category: 'Academic & Professional' },
    { id: 'coding', name: 'Coding Club', category: 'Academic & Professional' },
    { id: 'robotics', name: 'Robotics Club', category: 'Academic & Professional' },
    { id: 'entrepreneurship', name: 'Entrepreneurship Cell', category: 'Academic & Professional' },
    { id: 'finance', name: 'Finance Club', category: 'Academic & Professional' },
    { id: 'marketing', name: 'Marketing Club', category: 'Academic & Professional' },
    
    // Social & Community Service
    { id: 'nss', name: 'NSS (National Service Scheme)', category: 'Social & Community' },
    { id: 'environment', name: 'Environmental Club', category: 'Social & Community' },
    { id: 'volunteer', name: 'Volunteer Club', category: 'Social & Community' },
    { id: 'cultural', name: 'Cultural Committee', category: 'Social & Community' },
    
    // Special Interest
    { id: 'literature', name: 'Literature Club', category: 'Special Interest' },
    { id: 'chess', name: 'Chess Club', category: 'Special Interest' },
    { id: 'gaming', name: 'Gaming Club', category: 'Special Interest' },
    { id: 'tech', name: 'Tech Innovation Club', category: 'Special Interest' },
    { id: 'film', name: 'Film Society', category: 'Special Interest' },
    
    // Leadership & Governance
    { id: 'student-council', name: 'Student Council', category: 'Leadership & Governance' },
    { id: 'placement', name: 'Placement Committee', category: 'Leadership & Governance' },
    { id: 'alumni', name: 'Alumni Relations', category: 'Leadership & Governance' }
  ];

  const getSubjectsByCourse = (course) => {
    const subjectMap = {
      'BTech CSE': ['Mathematics', 'Data Structures', 'Computer Networks', 'Database Management', 'Software Engineering', 'Operating Systems'],
      'BTech AIML': ['Mathematics', 'Machine Learning', 'Deep Learning', 'Python Programming', 'Statistics', 'Neural Networks'],
      'BTech ECE': ['Mathematics', 'Digital Electronics', 'Signal Processing', 'Communication Systems', 'Microprocessors', 'VLSI Design'],
      'BTech Mechanical': ['Mathematics', 'Thermodynamics', 'Fluid Mechanics', 'Manufacturing', 'Machine Design', 'Heat Transfer'],
      'BTech Civil': ['Mathematics', 'Structural Analysis', 'Construction Materials', 'Surveying', 'Hydraulics', 'Geotechnical Engineering'],
      'BTech IT': ['Mathematics', 'Web Development', 'Database Systems', 'Network Security', 'Cloud Computing', 'Mobile App Development'],
      'MCA': ['Advanced Java', 'Database Management', 'Software Testing', 'Web Technologies', 'Data Analytics', 'System Analysis'],
      'MBA': ['Marketing Management', 'Financial Management', 'Human Resources', 'Operations Management', 'Business Strategy', 'Economics'],
      'BBA': ['Business Communication', 'Marketing Principles', 'Accounting', 'Management Concepts', 'Business Law', 'Economics'],
      'BCA': ['Programming in C', 'Database Management', 'Web Development', 'Computer Networks', 'Software Engineering', 'Mathematics'],
      'BSc Computer Science': ['Programming', 'Data Structures', 'Computer Graphics', 'Database Systems', 'Operating Systems', 'Mathematics'],
      'BCom': ['Financial Accounting', 'Business Economics', 'Business Law', 'Cost Accounting', 'Taxation', 'Statistics'],
      'MCom': ['Advanced Accounting', 'Financial Management', 'Research Methodology', 'International Business', 'Corporate Law', 'Auditing']
    };
    
    return subjectMap[course] || ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4', 'Subject 5', 'Subject 6'];
  };

  const generateBiMonthlyMarks = (course) => {
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

  const generateAttendanceData = () => {
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

  // Load user data and institution code first, then students
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    if (institutionCode) {
      loadStudents();
    }
  }, [institutionCode]);

  const loadUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentUser(userData);
        setInstitutionCode(userData.institutionCode);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadStudents = async () => {
    if (!institutionCode) return;
    
    setLoading(true);
    try {
      // Use nested collection structure: institutions/{institutionCode}/students
      const studentsRef = collection(db, 'institutions', institutionCode, 'students');
      const q = query(studentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const students = [];
      
      querySnapshot.forEach((doc) => {
        students.push({ id: doc.id, ...doc.data() });
      });
      
      setStudentsData(students);
    } catch (error) {
      console.error('Error loading students:', error);
      // Show error message to user instead of generating sample data
      setStudentsData([]);
      alert('Error loading students. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely format dates
  const formatDate = (date) => {
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

  // Helper function to safely convert dates for form inputs (YYYY-MM-DD format)
  const formatDateForInput = (date) => {
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


  const saveStudent = async (studentData) => {
    setSaving(true);
    try {
      // Use nested collection structure: institutions/{institutionCode}/students
      const studentsRef = collection(db, 'institutions', institutionCode, 'students');
      
      // Generate student ID
      const studentId = `ST${String(studentsData.length + 1).padStart(4, '0')}`;
      
      const newStudent = {
        ...studentData,
        name: `${studentData.firstName} ${studentData.lastName}`,
        studentId,
        email: studentData.email || `${studentData.firstName.toLowerCase()}.${studentData.lastName.toLowerCase()}@student.university.edu`,
        enrollmentDate: new Date(),
        // Remove auto-generated marks and attendance - let institution fill these
        biMonthlyMarks: [], // Empty array to be filled by institution
        attendanceData: [], // Empty array to be filled by institution
        averageMarks: 0, // Default to 0, to be updated when marks are entered
        averageAttendance: 0, // Default to 0, to be updated when attendance is entered
        gpa: '0.00', // Default to 0.00, to be calculated when marks are entered
        wellnessScore: null, // To be assessed later
        status: 'Active', // Default status
        counselorAssigned: null, // To be assigned later
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await addDoc(studentsRef, newStudent);
      await loadStudents(); // Reload the list
      setShowForm(false);
      resetForm();
      
      alert('Student added successfully!');
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Error saving student. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateStudent = async (studentId, updatedData) => {
    setSaving(true);
    try {
      // Get the current student data to track club changes
      const currentStudent = studentsData.find(s => s.id === studentId);
      const oldClubs = currentStudent?.socialClubs || [];
      const newClubs = updatedData.socialClubs || [];
      
      // Track club changes if there are any
      if (JSON.stringify(oldClubs.sort()) !== JSON.stringify(newClubs.sort())) {
        // Simple logging for now - could be expanded to full analytics later
        console.log(`Club changes for ${currentStudent?.name}: Left ${oldClubs.length - newClubs.length} clubs`);
      }
      
      // Use nested collection structure: institutions/{institutionCode}/students
      const studentDoc = doc(db, 'institutions', institutionCode, 'students', studentId);
      await updateDoc(studentDoc, {
        ...updatedData,
        name: `${updatedData.firstName} ${updatedData.lastName}`,
        updatedAt: new Date()
      });
      
      await loadStudents();
      setEditingStudent(null);
      setShowForm(false);
      resetForm();
      
      alert('Student updated successfully!');
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Error updating student. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async (studentId) => {
    // Only allow deletion for institution admins, not counselors
    if (currentUser?.role !== 'institution') {
      alert('Only institution administrators can delete students.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }
    
    try {
      // Use nested collection structure: institutions/{institutionCode}/students
      await deleteDoc(doc(db, 'institutions', institutionCode, 'students', studentId));
      await loadStudents();
      alert('Student deleted successfully!');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error deleting student. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      course: '',
      department: '',
      year: 1,
      semester: 1,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      medicalInfo: {
        allergies: '',
        medications: '',
        conditions: ''
      }
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingStudent) {
      updateStudent(editingStudent.id, formData);
    } else {
      saveStudent(formData);
    }
  };


  // Get event types based on club category
  const getClubEventTypes = (category) => {
    const eventMap = {
      'Arts & Performance': ['Drama Practice', 'Performance Show', 'Arts Workshop', 'Cultural Festival', 'Talent Competition'],
      'Sports & Fitness': ['Regular Practice', 'Tournament', 'Fitness Training', 'Sports Meet', 'Health Workshop'],
      'Academic & Professional': ['Study Session', 'Workshop', 'Competition', 'Guest Lecture', 'Project Meet'],
      'Social & Community': ['Community Service', 'Awareness Drive', 'Volunteer Activity', 'Outreach Program', 'Social Event'],
      'Special Interest': ['Club Meeting', 'Interest Workshop', 'Hobby Session', 'Discussion Forum', 'Special Activity'],
      'Leadership & Governance': ['Leadership Meeting', 'Planning Session', 'Committee Work', 'Student Council', 'Governance Workshop']
    };
    return eventMap[category] || ['Club Meeting', 'Regular Activity', 'Special Event'];
  };
  
  // Get analytics for student's club engagement (informational only - not a risk indicator)
  const getEngagementAnalytics = () => {
    const totalClubs = studentClubs.length;
    
    // If no clubs, return neutral analytics
    if (totalClubs === 0) {
      return {
        totalClubs: 0,
        clubParticipationRate: 'N/A',
        eventParticipationRate: 'N/A',
        engagementLevel: 'Not Participating',
        actualClubParticipation: 0,
        totalPossibleClubParticipation: 0,
        eventsParticipated: 0,
        totalEvents: 0,
        isParticipating: false,
        monthYear: `${getMonthNames()[selectedClubAttendanceMonth]} ${selectedClubAttendanceYear}`
      };
    }
    
    const totalWeeks = 4;
    const totalPossibleClubParticipation = totalClubs * totalWeeks;
    
    let actualClubParticipation = 0;
    let eventsParticipated = 0;
    let totalEvents = 0;
    
    studentClubs.forEach(clubId => {
      // Count club activity participation
      Object.values(weeklyAttendance[clubId] || {}).forEach(participated => {
        if (participated) actualClubParticipation++;
      });
      
      // Count events
      Object.entries(eventParticipation[clubId] || {}).forEach(([event, participated]) => {
        totalEvents++;
        if (participated) eventsParticipated++;
      });
    });
    
    const clubParticipationRate = totalPossibleClubParticipation > 0 ? (actualClubParticipation / totalPossibleClubParticipation * 100).toFixed(1) : 0;
    const eventParticipationRate = totalEvents > 0 ? (eventsParticipated / totalEvents * 100).toFixed(1) : 0;
    
    // More nuanced engagement levels
    let engagementLevel = 'Limited';
    if (clubParticipationRate > 80 && eventParticipationRate > 70) engagementLevel = 'Very Active';
    else if (clubParticipationRate > 60 && eventParticipationRate > 50) engagementLevel = 'Active';
    else if (clubParticipationRate > 30 || eventParticipationRate > 30) engagementLevel = 'Moderate';
    
    return {
      totalClubs,
      clubParticipationRate,
      eventParticipationRate,
      engagementLevel,
      actualClubParticipation,
      totalPossibleClubParticipation,
      eventsParticipated,
      totalEvents,
      isParticipating: true,
      monthYear: `${getMonthNames()[selectedClubAttendanceMonth]} ${selectedClubAttendanceYear}`
    };
  };

  // Initialize club data when viewing student details
  const initializeClubData = (student) => {
    try {
      const clubs = Array.isArray(student.socialClubs) ? student.socialClubs : [];
      setStudentClubs(clubs);
      
      // Load existing weekly attendance for current month or initialize with defaults
      const currentMonth = selectedClubAttendanceMonth;
      const currentYear = selectedClubAttendanceYear;
      const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`; // e.g., "2024-09"
      
      let attendance = {};
      
      // Check for new month-specific attendance data first
      if (student.monthlyClubAttendance && student.monthlyClubAttendance[monthKey]) {
        // Load existing month-specific data
        const monthData = student.monthlyClubAttendance[monthKey];
        clubs.forEach(clubId => {
          if (monthData[clubId]) {
            attendance[clubId] = { ...monthData[clubId] };
          } else {
            // Initialize for clubs not in this month's data
            const weeks = ['week-1', 'week-2', 'week-3', 'week-4'];
            attendance[clubId] = weeks.reduce((acc, week) => ({ ...acc, [week]: false }), {});
          }
        });
      } else if (student.weeklyAttendance && typeof student.weeklyAttendance === 'object') {
        // Backward compatibility: Load existing saved data and migrate old format if needed
        const existingData = { ...student.weeklyAttendance };
        
        // Handle backward compatibility: migrate "Week 1" format to "week-1" format
        Object.keys(existingData).forEach(clubId => {
          const clubAttendance = existingData[clubId] || {};
          const migratedClubAttendance = {};
          
          Object.keys(clubAttendance).forEach(weekKey => {
            if (weekKey === 'Week 1') migratedClubAttendance['week-1'] = clubAttendance[weekKey];
            else if (weekKey === 'Week 2') migratedClubAttendance['week-2'] = clubAttendance[weekKey];
            else if (weekKey === 'Week 3') migratedClubAttendance['week-3'] = clubAttendance[weekKey];
            else if (weekKey === 'Week 4') migratedClubAttendance['week-4'] = clubAttendance[weekKey];
            else migratedClubAttendance[weekKey] = clubAttendance[weekKey]; // Keep new format as is
          });
          
          attendance[clubId] = migratedClubAttendance;
        });
      } else {
        // Initialize with default data for new clubs
        const weeks = ['week-1', 'week-2', 'week-3', 'week-4'];
        clubs.forEach(clubId => {
          if (clubId) {
            attendance[clubId] = {};
            weeks.forEach(week => {
              attendance[clubId][week] = Math.random() > 0.3; // Random initial data
            });
          }
        });
      }
      setWeeklyAttendance(attendance);
    
      // Load existing event participation or initialize with defaults
      let events = {};
      if (student.eventParticipation && typeof student.eventParticipation === 'object') {
        // Load existing saved data
        events = { ...student.eventParticipation };
      } else {
        // Initialize with default data for new clubs
        clubs.forEach(clubId => {
          if (clubId) {
            const club = socialClubsAndActivities.find(c => c.id === clubId);
            if (club) {
              const eventTypes = getClubEventTypes(club.category);
              events[clubId] = {};
              eventTypes.forEach(event => {
                if (event) {
                  events[clubId][event] = Math.random() > 0.4;
                }
              });
            }
          }
        });
      }
      setEventParticipation(events);
      
      // Initialize event tiles
      const newEventTiles = generateEventTiles(clubs);
      
      // Load saved event participation data if it exists
      if (student.eventParticipationData && Array.isArray(student.eventParticipationData)) {
        const updatedTiles = newEventTiles.map(tile => {
          const existingData = student.eventParticipationData.find(event => event.eventId === tile.id);
          if (existingData) {
            return {
              ...tile,
              participation: existingData.participation,
              filled: true,
              saved: true
            };
          }
          return tile;
        });
        setEventTiles(updatedTiles);
      } else {
        setEventTiles(newEventTiles);
      }
    } catch (error) {
      console.error('Error initializing club data:', error);
      // Set safe defaults
      setStudentClubs([]);
      setWeeklyAttendance({});
      setEventParticipation({});
      setEventTiles([]);
    }
  };
  
  // Save club data
  const saveClubData = async () => {
    if (!selectedStudent) return;
    
    try {
      setSaving(true);
      
      const studentDoc = doc(db, 'institutions', institutionCode, 'students', selectedStudent.id);
      const studentSnap = await getDoc(studentDoc);
      
      if (studentSnap.exists()) {
        const currentData = studentSnap.data();
        const previousClubs = currentData.socialClubs || [];
        const currentTimestamp = new Date();
        
        // Track club history for behavioral change detection
        let clubHistory = currentData.socialClubHistory || [];
        let lastClubDropDate = currentData.lastClubDropDate;
        
        // Detect if student is dropping all clubs
        if (previousClubs.length > 0 && studentClubs.length === 0) {
          lastClubDropDate = currentTimestamp;
          clubHistory.push({
            action: 'dropped_all_clubs',
            previousClubs: [...previousClubs],
            timestamp: currentTimestamp,
            reason: 'manual_update'
          });
        }
        
        // Detect club changes
        const droppedClubs = previousClubs.filter(club => !studentClubs.includes(club));
        const addedClubs = studentClubs.filter(club => !previousClubs.includes(club));
        
        if (droppedClubs.length > 0 || addedClubs.length > 0) {
          clubHistory.push({
            action: 'club_changes',
            droppedClubs,
            addedClubs,
            previousCount: previousClubs.length,
            newCount: studentClubs.length,
            timestamp: currentTimestamp
          });
        }
        
        // Keep only last 6 months of history
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        clubHistory = clubHistory.filter(entry => new Date(entry.timestamp) > sixMonthsAgo);
        
        // Prepare month-specific attendance data
        const currentMonth = selectedClubAttendanceMonth;
        const currentYear = selectedClubAttendanceYear;
        const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        
        // Get existing monthly attendance data or initialize
        const monthlyClubAttendance = currentData.monthlyClubAttendance || {};
        
        // Update the current month's data
        monthlyClubAttendance[monthKey] = { ...weeklyAttendance };
        
        // Update student data - only include defined fields
        const updatedData = {
          socialClubs: studentClubs,
          weeklyAttendance, // Keep for backward compatibility
          monthlyClubAttendance, // New month-specific data
          eventParticipation,
          socialClubHistory: clubHistory,
          updatedAt: currentTimestamp
        };
        
        // Only add lastClubDropDate if it has a value
        if (lastClubDropDate) {
          updatedData.lastClubDropDate = lastClubDropDate;
        }
        
        await updateDoc(studentDoc, updatedData);
        
        // Update selected student in memory
        setSelectedStudent(prev => ({ ...prev, ...updatedData }));
        setEditingClubs(false);
        
        await loadStudents(); // Refresh the list
        alert('Club data saved successfully!');
      }
    } catch (error) {
      console.error('Error saving club data:', error);
      alert('Error saving club data. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Toggle club membership
  const toggleClubMembership = (clubId) => {
    setStudentClubs(prev => {
      if (prev.includes(clubId)) {
        // Remove club and its attendance/event data
        const newClubs = prev.filter(id => id !== clubId);
        setWeeklyAttendance(prevAtt => {
          const newAtt = { ...prevAtt };
          delete newAtt[clubId];
          return newAtt;
        });
        setEventParticipation(prevEvents => {
          const newEvents = { ...prevEvents };
          delete newEvents[clubId];
          return newEvents;
        });
        // Regenerate event tiles
        setEventTiles(generateEventTiles(newClubs));
        return newClubs;
      } else {
        // Add club and initialize attendance/event data
        const weeks = ['week-1', 'week-2', 'week-3', 'week-4'];
        setWeeklyAttendance(prev => ({
          ...prev,
          [clubId]: weeks.reduce((acc, week) => ({ ...acc, [week]: false }), {})
        }));
        
        // Also trigger loading attendance for current month to ensure consistency
        setTimeout(() => {
          if (selectedStudent) {
            loadClubAttendanceForMonth(selectedClubAttendanceMonth, selectedClubAttendanceYear);
          }
        }, 0);
        const club = socialClubsAndActivities.find(c => c.id === clubId);
        if (club) {
          const eventTypes = getClubEventTypes(club.category);
          const clubEvents = {};
          eventTypes.forEach(event => {
            clubEvents[event] = false;
          });
          setEventParticipation(prev => ({
            ...prev,
            [clubId]: clubEvents
          }));
        }
        const newClubs = [...prev, clubId];
        // Regenerate event tiles
        setEventTiles(generateEventTiles(newClubs));
        return newClubs;
      }
    });
  };

  const startEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      phone: student.phone || '',
      dateOfBirth: formatDateForInput(student.dateOfBirth),
      course: student.course || '',
      department: student.department || '',
      year: student.year || 1,
      semester: student.semester || 1,
      address: student.address || {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      emergencyContact: student.emergencyContact || {
        name: '',
        relationship: '',
        phone: ''
      },
      medicalInfo: student.medicalInfo || {
        allergies: '',
        medications: '',
        conditions: ''
      }
    });
    setShowForm(true);
  };

  // Prebuilt Tiles Management Functions
  const [showMarksPanel, setShowMarksPanel] = useState(false);
  const [showAttendancePanel, setShowAttendancePanel] = useState(false);
  const [prebuiltMarksTiles, setPrebuiltMarksTiles] = useState([]);
  const [prebuiltAttendanceTiles, setPrebuiltAttendanceTiles] = useState([]);
  const [savingTileId, setSavingTileId] = useState(null);
  
  // Club management in student detail view
  const [editingClubs, setEditingClubs] = useState(false);
  const [studentClubs, setStudentClubs] = useState([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState({});
  const [eventParticipation, setEventParticipation] = useState({});
  const [eventTiles, setEventTiles] = useState([]);
  
  // Month/Year selection for attendance
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState(new Date().getMonth());
  const [selectedAttendanceYear, setSelectedAttendanceYear] = useState(new Date().getFullYear());
  
  // Month/Year selection for club attendance  
  const [selectedClubAttendanceMonth, setSelectedClubAttendanceMonth] = useState(new Date().getMonth());
  const [selectedClubAttendanceYear, setSelectedClubAttendanceYear] = useState(new Date().getFullYear());

  // Generate prebuilt academic periods for the current year
  const generatePrebuiltMarksTiles = (course) => {
    const currentYear = new Date().getFullYear();
    const periods = [
      { name: `Jan-Feb ${currentYear}`, examType: 'Mid Semester', month: 1 },
      { name: `Mar-Apr ${currentYear}`, examType: 'End Semester', month: 3 },
      { name: `May-Jun ${currentYear}`, examType: 'Mid Semester', month: 5 },
      { name: `Jul-Aug ${currentYear}`, examType: 'End Semester', month: 7 },
      { name: `Sep-Oct ${currentYear}`, examType: 'Mid Semester', month: 9 },
      { name: `Nov-Dec ${currentYear}`, examType: 'End Semester', month: 11 }
    ];
    
    const subjects = getSubjectsByCourse(course);
    return periods.map((period, index) => {
      const subjectData = {};
      subjects.forEach(subject => {
        subjectData[subject] = '';
      });
      
      return {
        id: `marks-${index}`,
        period: period.name,
        examType: period.examType,
        subjects: subjectData,
        filled: false,
        saved: false
      };
    });
  };

  // Generate prebuilt daily attendance tiles for specified month/year
  const generatePrebuiltAttendanceTiles = (month = selectedAttendanceMonth, year = selectedAttendanceYear) => {
    const tiles = [];
    const targetMonth = month;
    const targetYear = year;
    
    // Get the number of days in target month
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Generate tiles for each day of the target month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(targetYear, targetMonth, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Skip weekends (optional - remove this if you want weekend tracking)
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      tiles.push({
        id: `attendance-${targetYear}-${targetMonth}-${day}`,
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: day,
        monthName: monthNames[targetMonth],
        year: targetYear,
        present: null, // null = not set, true = present, false = absent
        filled: false,
        saved: false
      });
    }
    
    return tiles;
  };

  // Generate prebuilt event tiles for selected clubs
  const generateEventTiles = (selectedClubs) => {
    const tiles = [];
    const currentDate = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    selectedClubs.forEach(clubId => {
      const club = socialClubsAndActivities.find(c => c.id === clubId);
      if (!club) return;
      
      const eventTypes = getClubEventTypes(club.category);
      
      // Generate 2-3 events per club for the current month
      const numEvents = Math.min(eventTypes.length, 3);
      for (let i = 0; i < numEvents; i++) {
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + (i + 1) * 7); // Events weekly
        
        tiles.push({
          id: `event-${clubId}-${i}`,
          clubId: clubId,
          clubName: club.name,
          clubCategory: club.category,
          eventName: eventTypes[i % eventTypes.length],
          eventType: eventTypes[i % eventTypes.length],
          description: `${club.name} - ${eventTypes[i % eventTypes.length]}`,
          date: eventDate.toISOString().split('T')[0],
          time: ['10:00 AM', '2:00 PM', '4:00 PM', '6:00 PM'][Math.floor(Math.random() * 4)],
          duration: ['1 hour', '2 hours', '3 hours'][Math.floor(Math.random() * 3)],
          location: ['Auditorium', 'Conference Hall', 'Sports Ground', 'Club Room'][Math.floor(Math.random() * 4)],
          participation: null, // null = not set, true = attending, false = not attending
          filled: false,
          saved: false
        });
      }
    });
    
    // Sort by date
    return tiles.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Initialize prebuilt tiles when student is selected
  useEffect(() => {
    if (selectedStudent) {
      setPrebuiltMarksTiles(generatePrebuiltMarksTiles(selectedStudent.course));
      setPrebuiltAttendanceTiles(generatePrebuiltAttendanceTiles());
      
      // Mark existing data as saved
      if (selectedStudent.biMonthlyMarks) {
        setPrebuiltMarksTiles(prev => prev.map(tile => {
          const existingData = selectedStudent.biMonthlyMarks.find(mark => mark.period === tile.period);
          if (existingData) {
            return {
              ...tile,
              subjects: existingData.subjects,
              filled: true,
              saved: true,
              editMode: false
            };
          }
          return tile;
        }));
      }
      
      if (selectedStudent.attendanceData) {
        setPrebuiltAttendanceTiles(prev => prev.map(tile => {
          const existingData = selectedStudent.attendanceData.find(att => att.date === tile.date);
          if (existingData) {
            return {
              ...tile,
              present: existingData.present,
              filled: true,
              saved: true,
              editMode: false
            };
          }
          return tile;
        }));
      }
      
      // Mark existing event participation data as saved
      if (selectedStudent.eventParticipationData) {
        setEventTiles(prev => prev.map(tile => {
          const existingData = selectedStudent.eventParticipationData.find(event => event.eventId === tile.id);
          if (existingData) {
            return {
              ...tile,
              participation: existingData.participation,
              filled: true,
              saved: true
            };
          }
          return tile;
        }));
      }
    }
  }, [selectedStudent]);

  // Regenerate attendance tiles when month/year changes
  useEffect(() => {
    if (selectedStudent) {
      const newTiles = generatePrebuiltAttendanceTiles(selectedAttendanceMonth, selectedAttendanceYear);
      
      // Mark existing data as saved if it exists
      if (selectedStudent.attendanceData) {
        const updatedTiles = newTiles.map(tile => {
          const existingData = selectedStudent.attendanceData.find(att => att.date === tile.date);
          if (existingData) {
            return {
              ...tile,
              present: existingData.present,
              filled: true,
              saved: true,
              editMode: false
            };
          }
          return tile;
        });
        setPrebuiltAttendanceTiles(updatedTiles);
      } else {
        setPrebuiltAttendanceTiles(newTiles);
      }
    }
  }, [selectedAttendanceMonth, selectedAttendanceYear, selectedStudent]);
  
  // Reload club attendance when month/year changes for selected student
  useEffect(() => {
    if (selectedStudent && studentClubs.length > 0) {
      loadClubAttendanceForMonth(selectedClubAttendanceMonth, selectedClubAttendanceYear);
    }
  }, [selectedClubAttendanceMonth, selectedClubAttendanceYear, selectedStudent, studentClubs]);

  // Quick fill templates
  const applyMarksTemplate = (tileId, template) => {
    setPrebuiltMarksTiles(prev => prev.map(tile => {
      if (tile.id === tileId) {
        const subjects = { ...tile.subjects };
        Object.keys(subjects).forEach(subject => {
          switch (template) {
            case 'excellent':
              subjects[subject] = Math.floor(Math.random() * 10) + 90; // 90-100
              break;
            case 'good':
              subjects[subject] = Math.floor(Math.random() * 15) + 75; // 75-90
              break;
            case 'average':
              subjects[subject] = Math.floor(Math.random() * 15) + 60; // 60-75
              break;
            case 'poor':
              subjects[subject] = Math.floor(Math.random() * 15) + 40; // 40-55
              break;
            case 'clear':
              subjects[subject] = '';
              break;
            default:
              break;
          }
        });
        return { ...tile, subjects, filled: template !== 'clear' };
      }
      return tile;
    }));
  };

  const applyAttendanceTemplate = (tileId, template) => {
    setPrebuiltAttendanceTiles(prev => prev.map(tile => {
      if (tile.id === tileId) {
        let present;
        switch (template) {
          case 'present':
            present = true;
            break;
          case 'absent':
            present = false;
            break;
          case 'clear':
            present = null;
            break;
          default:
            present = tile.present;
            break;
        }
        return { ...tile, present, filled: template !== 'clear' };
      }
      return tile;
    }));
  };

  // Apply template to all attendance tiles (bulk action)
  const applyBulkAttendanceTemplate = (template) => {
    setPrebuiltAttendanceTiles(prev => prev.map(tile => {
      if (!tile.saved) { // Only apply to unsaved tiles
        let present;
        switch (template) {
          case 'all-present':
            present = true;
            break;
          case 'all-absent':
            present = false;
            break;
          case 'clear-all':
            present = null;
            break;
          default:
            present = tile.present;
            break;
        }
        return { ...tile, present, filled: template !== 'clear-all' };
      }
      return tile;
    }));
  };

  // Enable edit mode for saved tiles
  const enableEditMode = (tileId, type) => {
    if (type === 'marks') {
      setPrebuiltMarksTiles(prev => prev.map(tile => 
        tile.id === tileId ? { ...tile, editMode: true, saved: false } : tile
      ));
    } else if (type === 'attendance') {
      setPrebuiltAttendanceTiles(prev => prev.map(tile => 
        tile.id === tileId ? { ...tile, editMode: true, saved: false } : tile
      ));
    }
  };

  // Save individual tile data
  const saveMarksTile = async (tileId) => {
    const tile = prebuiltMarksTiles.find(t => t.id === tileId);
    if (!tile || !selectedStudent) return;
    
    // Validate that all subjects have marks
    const allSubjectsFilled = Object.values(tile.subjects).every(mark => mark !== '' && mark !== null && mark !== undefined);
    if (!allSubjectsFilled) {
      alert('Please fill marks for all subjects before saving.');
      return;
    }
    
    setSavingTileId(tileId);
    
    try {
      const subjects = {};
      Object.keys(tile.subjects).forEach(subject => {
        subjects[subject] = parseInt(tile.subjects[subject]) || 0;
      });
      
      const overallMarks = Object.values(subjects).reduce((sum, mark) => sum + mark, 0) / Object.keys(subjects).length;
      
      const marksData = {
        period: tile.period,
        marks: Math.round(overallMarks),
        maxMarks: 100,
        examType: tile.examType,
        subjects,
        createdAt: new Date()
      };
      
      await addMarksData(selectedStudent.id, marksData);
      
      // Update tile status
      setPrebuiltMarksTiles(prev => prev.map(t => 
        t.id === tileId ? { ...t, saved: true, editMode: false } : t
      ));
      
    } catch (error) {
      console.error('Error saving marks tile:', error);
      alert('Error saving marks. Please try again.');
    } finally {
      setSavingTileId(null);
    }
  };

  const saveAttendanceTile = async (tileId) => {
    const tile = prebuiltAttendanceTiles.find(t => t.id === tileId);
    if (!tile || !selectedStudent || tile.present === null) {
      alert('Please mark attendance (Present/Absent) before saving.');
      return;
    }
    
    setSavingTileId(tileId);
    
    try {
      const attendanceData = {
        date: tile.date,
        dayName: tile.dayName,
        dayNumber: tile.dayNumber,
        monthName: tile.monthName,
        present: tile.present,
        createdAt: new Date()
      };
      
      await addAttendanceData(selectedStudent.id, attendanceData);
      
      // Update tile status
      setPrebuiltAttendanceTiles(prev => prev.map(t => 
        t.id === tileId ? { ...t, saved: true, editMode: false } : t
      ));
      
    } catch (error) {
      console.error('Error saving attendance tile:', error);
      alert('Error saving attendance. Please try again.');
    } finally {
      setSavingTileId(null);
    }
  };

  // Save all filled attendance tiles at once
  const saveBulkAttendance = async () => {
    const tilesToSave = prebuiltAttendanceTiles.filter(t => !t.saved && t.present !== null);
    
    if (tilesToSave.length === 0) {
      alert('No attendance data to save.');
      return;
    }
    
    setSavingTileId('bulk');
    
    try {
      for (const tile of tilesToSave) {
        const attendanceData = {
          date: tile.date,
          dayName: tile.dayName,
          dayNumber: tile.dayNumber,
          monthName: tile.monthName,
          present: tile.present,
          createdAt: new Date()
        };
        
        await addAttendanceData(selectedStudent.id, attendanceData);
      }
      
      // Update all saved tiles status
      setPrebuiltAttendanceTiles(prev => prev.map(tile => 
        tilesToSave.some(t => t.id === tile.id) ? 
        { ...tile, saved: true, editMode: false } : tile
      ));
      
      alert(`Successfully saved attendance for ${tilesToSave.length} days!`);
      
    } catch (error) {
      console.error('Error saving bulk attendance:', error);
      alert('Error saving attendance. Please try again.');
    } finally {
      setSavingTileId(null);
    }
  };

  const addMarksData = async (studentId, marksData) => {
    try {
      const studentDoc = doc(db, 'institutions', institutionCode, 'students', studentId);
      const studentSnap = await getDoc(studentDoc);
      
      if (studentSnap.exists()) {
        const currentData = studentSnap.data();
        const existingMarks = currentData.biMonthlyMarks || [];
        
        // Check if marks for this period already exist
        const existingIndex = existingMarks.findIndex(mark => mark.period === marksData.period);
        
        let updatedMarks;
        if (existingIndex >= 0) {
          // Update existing record
          updatedMarks = [...existingMarks];
          updatedMarks[existingIndex] = { ...marksData, updatedAt: new Date() };
          console.log('Updating existing marks for period:', marksData.period);
        } else {
          // Add new record
          updatedMarks = [...existingMarks, marksData];
          console.log('Adding new marks for period:', marksData.period);
        }
        
        // Calculate new averages
        const averageMarks = updatedMarks.length > 0 ? 
          Math.round(updatedMarks.reduce((sum, mark) => sum + mark.marks, 0) / updatedMarks.length) : 0;
        const gpa = (averageMarks / 10).toFixed(2); // Convert to 10.0 scale
        
        // Update status based on performance
        let status = 'Active';
        const attendance = currentData.averageAttendance || 0;
        if (averageMarks < 65 || attendance < 70) {
          status = 'At Risk';
        } else if (averageMarks > 85 && attendance > 90) {
          status = 'Excellent';
        }
        
        await updateDoc(studentDoc, {
          biMonthlyMarks: updatedMarks,
          averageMarks,
          gpa,
          status,
          updatedAt: new Date()
        });
        
        await loadStudents();
        alert(existingIndex >= 0 ? 'Marks updated successfully!' : 'Marks added successfully!');
      }
    } catch (error) {
      console.error('Error saving marks:', error);
      alert('Error saving marks. Please try again.');
    }
  };

  const addAttendanceData = async (studentId, attendanceData) => {
    try {
      const studentDoc = doc(db, 'institutions', institutionCode, 'students', studentId);
      const studentSnap = await getDoc(studentDoc);
      
      if (studentSnap.exists()) {
        const currentData = studentSnap.data();
        const existingAttendance = currentData.attendanceData || [];
        
        // Check if attendance for this date already exists
        const existingIndex = existingAttendance.findIndex(att => att.date === attendanceData.date);
        
        let updatedAttendance;
        if (existingIndex >= 0) {
          // Update existing record
          updatedAttendance = [...existingAttendance];
          updatedAttendance[existingIndex] = { ...attendanceData, updatedAt: new Date() };
          console.log('Updating existing attendance for date:', attendanceData.date);
        } else {
          // Add new record
          updatedAttendance = [...existingAttendance, attendanceData];
          console.log('Adding new attendance for date:', attendanceData.date);
        }
        
        // Calculate new average attendance (percentage of present days)
        const totalDays = updatedAttendance.length;
        const presentDays = updatedAttendance.filter(att => att.present).length;
        const averageAttendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        
        // Update status based on performance
        let status = 'Active';
        const marks = currentData.averageMarks || 0;
        if (marks < 65 || averageAttendance < 70) {
          status = 'At Risk';
        } else if (marks > 85 && averageAttendance > 90) {
          status = 'Excellent';
        }
        
        await updateDoc(studentDoc, {
          attendanceData: updatedAttendance,
          averageAttendance,
          status,
          updatedAt: new Date()
        });
        
        await loadStudents();
        alert(existingIndex >= 0 ? 'Attendance updated successfully!' : 'Attendance added successfully!');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance. Please try again.');
    }
  };

  // Event tile management functions
  const updateEventTileParticipation = (tileId, participation) => {
    setEventTiles(prev => prev.map(tile => 
      tile.id === tileId ? { 
        ...tile, 
        participation, 
        filled: participation !== null 
      } : tile
    ));
  };

  const saveEventTile = async (tileId) => {
    const tile = eventTiles.find(t => t.id === tileId);
    if (!tile || !selectedStudent || tile.participation === null) {
      alert('Please mark participation (Attending/Not Attending) before saving.');
      return;
    }
    
    setSavingTileId(tileId);
    
    try {
      const eventData = {
        eventId: tile.id,
        clubId: tile.clubId,
        clubName: tile.clubName,
        eventName: tile.eventName,
        eventType: tile.eventType,
        date: tile.date,
        time: tile.time,
        duration: tile.duration,
        location: tile.location,
        participation: tile.participation,
        createdAt: new Date()
      };
      
      await addEventParticipationData(selectedStudent.id, eventData);
      
      // Update tile status
      setEventTiles(prev => prev.map(t => 
        t.id === tileId ? { ...t, saved: true } : t
      ));
      
    } catch (error) {
      console.error('Error saving event participation:', error);
      alert('Error saving event participation. Please try again.');
    } finally {
      setSavingTileId(null);
    }
  };

  const addEventParticipationData = async (studentId, eventData) => {
    try {
      const studentDoc = doc(db, 'institutions', institutionCode, 'students', studentId);
      const studentSnap = await getDoc(studentDoc);
      
      if (studentSnap.exists()) {
        const currentData = studentSnap.data();
        const existingEvents = currentData.eventParticipationData || [];
        
        // Check if participation for this event already exists
        const existingIndex = existingEvents.findIndex(event => event.eventId === eventData.eventId);
        
        let updatedEvents;
        const currentTimestamp = new Date();
        
        if (existingIndex >= 0) {
          // Track if student is changing from participating to not participating
          const previousParticipation = existingEvents[existingIndex].participation;
          const newParticipation = eventData.participation;
          
          if (previousParticipation === true && newParticipation === false) {
            // Student stopped participating - potential early warning
            let behaviorHistory = currentData.behaviorChangeHistory || [];
            behaviorHistory.push({
              type: 'event_participation_change',
              eventName: eventData.eventName,
              clubName: eventData.clubName,
              from: 'participating',
              to: 'not_participating',
              timestamp: currentTimestamp,
              severity: 'monitor'
            });
            
            // Keep only last 3 months of behavior history
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            behaviorHistory = behaviorHistory.filter(entry => new Date(entry.timestamp) > threeMonthsAgo);
            
            // Only update if behaviorHistory has content
            if (behaviorHistory && behaviorHistory.length > 0) {
              await updateDoc(studentDoc, {
                behaviorChangeHistory: behaviorHistory
              });
            }
          }
          
          // Update existing record
          updatedEvents = [...existingEvents];
          updatedEvents[existingIndex] = { ...eventData, updatedAt: currentTimestamp };
        } else {
          // Add new record
          updatedEvents = [...existingEvents, eventData];
        }
        
        // Sort by date to maintain chronological order for trend analysis
        updatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        await updateDoc(studentDoc, {
          eventParticipationData: updatedEvents,
          updatedAt: currentTimestamp
        });
        
        await loadStudents();
        alert(existingIndex >= 0 ? 'Event participation updated successfully!' : 'Event participation saved successfully!');
      }
    } catch (error) {
      console.error('Error saving event participation:', error);
      alert('Error saving event participation. Please try again.');
    }
  };

  // Bulk save all filled event tiles
  const saveBulkEventParticipation = async () => {
    const tilesToSave = eventTiles.filter(t => !t.saved && t.participation !== null);
    
    if (tilesToSave.length === 0) {
      alert('No event participation data to save.');
      return;
    }
    
    setSavingTileId('bulk-events');
    
    try {
      for (const tile of tilesToSave) {
        const eventData = {
          eventId: tile.id,
          clubId: tile.clubId,
          clubName: tile.clubName,
          eventName: tile.eventName,
          eventType: tile.eventType,
          date: tile.date,
          time: tile.time,
          duration: tile.duration,
          location: tile.location,
          participation: tile.participation,
          createdAt: new Date()
        };
        
        await addEventParticipationData(selectedStudent.id, eventData);
      }
      
      // Update all saved tiles status
      setEventTiles(prev => prev.map(tile => 
        tilesToSave.some(t => t.id === tile.id) ? 
        { ...tile, saved: true } : tile
      ));
      
      alert(`Successfully saved participation for ${tilesToSave.length} events!`);
      
    } catch (error) {
      console.error('Error saving bulk event participation:', error);
      alert('Error saving event participation. Please try again.');
    } finally {
      setSavingTileId(null);
    }
  };

  // Month/Year change handlers for attendance
  const handleAttendanceMonthYearChange = (month, year) => {
    setSelectedAttendanceMonth(month);
    setSelectedAttendanceYear(year);
    // Regenerate tiles for the new month/year
    setPrebuiltAttendanceTiles(generatePrebuiltAttendanceTiles(month, year));
  };

  const handleClubAttendanceMonthYearChange = (month, year) => {
    setSelectedClubAttendanceMonth(month);
    setSelectedClubAttendanceYear(year);
    // Load attendance data for the selected month/year
    loadClubAttendanceForMonth(month, year);
  };
  
  // Load club attendance data for a specific month/year
  const loadClubAttendanceForMonth = (month, year) => {
    if (!selectedStudent) return;
    
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; // e.g., "2024-09"
    
    // Get existing attendance data for this month
    const monthlyAttendance = selectedStudent.monthlyClubAttendance || {};
    const monthData = monthlyAttendance[monthKey] || {};
    
    // Initialize attendance for current clubs if not exists
    const updatedAttendance = {};
    
    studentClubs.forEach(clubId => {
      if (monthData[clubId]) {
        // Load existing data for this club and month
        updatedAttendance[clubId] = { ...monthData[clubId] };
      } else {
        // Initialize new data for this club and month
        const weeks = ['week-1', 'week-2', 'week-3', 'week-4'];
        updatedAttendance[clubId] = weeks.reduce((acc, week) => ({ ...acc, [week]: false }), {});
      }
    });
    
    setWeeklyAttendance(updatedAttendance);
  };

  // Helper function to get month names
  const getMonthNames = () => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper function to generate year options (current year ± 2 years)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  // Generate weekly periods for club attendance based on selected month/year
  const generateClubAttendanceWeeks = (month, year) => {
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


  // Sorting function
  const sortStudents = (students) => {
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
  
  // Apply sorting to students data
  const sortedStudentsData = sortStudents(studentsData);
  
  // Handle sort change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Calculate updated stats based on actual student data
  const stats = {
    totalStudents: sortedStudentsData.length,
    totalCounselors: 24,
    averageWellnessScore: sortedStudentsData.length > 0 ? (sortedStudentsData.reduce((sum, s) => sum + (s.wellnessScore || 0), 0) / sortedStudentsData.length).toFixed(1) : '0.0',
    dropoutRisk: sortedStudentsData.filter(s => s.status === 'At Risk').length,
    lowAttendance: sortedStudentsData.filter(s => (s.averageAttendance || 0) < 80).length,
    excellentStudents: sortedStudentsData.filter(s => s.status === 'Excellent').length,
    averageGPA: sortedStudentsData.length > 0 ? (sortedStudentsData.reduce((sum, s) => sum + parseFloat(s.gpa || 0), 0) / sortedStudentsData.length).toFixed(2) : '0.00'
  };

  // Show loading while checking user authentication and permissions
  if (loading && !institutionCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error if user doesn't have institution access
  if (!institutionCode || (currentUser && currentUser.role !== 'institution' && currentUser.role !== 'counselor')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-red-200">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access the Institution Dashboard.
            </p>
            <p className="text-sm text-gray-500">
              This dashboard is only available to Institution Administrators and Counselors.
            </p>
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
              <h1 className="text-2xl font-bold text-gray-900">Institution Dashboard</h1>
              <p className="text-gray-600">Campus Mental Health Management System</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Institution Code: {institutionCode || 'Loading...'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser?.displayName || user?.email?.split('@')[0] || 'Administrator'}
                  </p>
                  <p className="text-xs text-gray-500">{currentUser?.email || user?.email}</p>
                </div>
                <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center">
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
        
        {/* Tabs */}
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
                      ? 'border-purple-500 text-purple-600'
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
          <InstitutionOverview
            studentsData={sortedStudentsData}
            stats={stats}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'students' && (
          <div>
            {viewMode === 'list' ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Student Management ({sortedStudentsData.length} Students)</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setViewMode('analytics')}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                      <span>Analytics</span>
                    </button>
                    <button 
                      onClick={() => {
                        setEditingStudent(null);
                        resetForm();
                        setShowForm(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                      <span>Add Student</span>
                    </button>
                  </div>
                </div>
                
                {/* Sorting Controls */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <BarsArrowUpIcon className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Sort by:</span>
                    </div>
                    <div className="flex space-x-2">
                      {[
                        { key: 'name', label: 'Name' },
                        { key: 'gpa', label: 'GPA' },
                        { key: 'marks', label: 'Marks' },
                        { key: 'attendance', label: 'Attendance' },
                        { key: 'status', label: 'Status' }
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() => handleSort(option.key)}
                          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors flex items-center space-x-1 ${
                            sortBy === option.key
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span>{option.label}</span>
                          {sortBy === option.key && (
                            sortOrder === 'asc' ? 
                              <ChevronUpIcon className="h-3 w-3" /> : 
                              <ChevronDownIcon className="h-3 w-3" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Student List or Empty State */}
                {sortedStudentsData.length === 0 ?
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                    <div className="text-center">
                      <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <UsersIcon className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
                      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                        Get started by adding your first student to the system. You can add their academic information, contact details, and track their progress.
                      </p>
                      <button
                        onClick={() => {
                          setEditingStudent(null);
                          resetForm();
                          setShowForm(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                      >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add Your First Student</span>
                      </button>
                    </div>
                  </div>
                : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Course & Year
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Class Attendance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Average Marks
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              GPA
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Social Clubs
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedStudentsData.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                      {student.firstName?.[0]}{student.lastName?.[0]}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                    <div className="text-sm text-gray-500">{student.studentId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{student.course}</div>
                                <div className="text-sm text-gray-500">Year {student.year} • {student.department}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    (student.averageAttendance || 0) >= 90 ? 'bg-green-100 text-green-800' :
                                    (student.averageAttendance || 0) >= 75 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {student.averageAttendance || 0}%
                                  </span>
                                  {(student.averageAttendance || 0) < 75 && (
                                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    (student.averageMarks || 0) >= 85 ? 'bg-green-100 text-green-800' :
                                    (student.averageMarks || 0) >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {student.averageMarks || 0}/100
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`font-medium ${
                                  parseFloat(student.gpa || 0) >= 8.0 ? 'text-green-600' :
                                  parseFloat(student.gpa || 0) >= 6.0 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {student.gpa || '0.00'}/10
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  student.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                                  student.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                                  student.status === 'At Risk' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {student.status || 'Active'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="max-w-xs">
                                  {student.socialClubs && student.socialClubs.length > 0 ? (
                                    <div className="space-y-1">
                                      <div className="text-xs text-gray-600">
                                        {student.socialClubs.length} club{student.socialClubs.length > 1 ? 's' : ''}
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {student.socialClubs.slice(0, 3).map(clubId => {
                                          const club = socialClubsAndActivities.find(c => c.id === clubId);
                                          return club ? (
                                            <span 
                                              key={clubId}
                                              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                                              title={club.category}
                                            >
                                              {club.name.length > 12 ? club.name.substring(0, 12) + '...' : club.name}
                                            </span>
                                          ) : null;
                                        })}
                                        {student.socialClubs.length > 3 && (
                                          <span className="text-xs text-gray-500">+{student.socialClubs.length - 3} more</span>
                                        )}
                                      </div>
                                      {student.socialEngagementLevel && (
                                        <div className="text-xs">
                                          <span className={`px-2 py-1 rounded-full ${
                                            student.socialEngagementLevel === 'high' ? 'bg-green-100 text-green-700' :
                                            student.socialEngagementLevel === 'moderate' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                          }`}>
                                            {student.socialEngagementLevel.charAt(0).toUpperCase() + student.socialEngagementLevel.slice(1)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-500 italic">
                                      No clubs
                                      <div className="text-xs text-yellow-600 font-medium">⚠️ Social risk</div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                      setSelectedStudent(student);
                      setViewMode('details');
                      // Initialize club data
                      initializeClubData(student);
                                    }}
                                    className="text-blue-600 hover:text-blue-900" title="View Details"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => startEdit(student)}
                                    className="text-indigo-600 hover:text-indigo-900" 
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  {/* Only show delete button for institution administrators */}
                                  {currentUser?.role === 'institution' && (
                                    <button 
                                      onClick={() => deleteStudent(student.id)}
                                      className="text-red-600 hover:text-red-900" 
                                      title="Delete"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : viewMode === 'details' && selectedStudent ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        setViewMode('list');
                        setSelectedStudent(null);
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      ← Back to Students
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedStudent.name} - Detailed View</h2>
                  </div>
                </div>
                
                {/* Student Details */}
                <div className="space-y-6">
                  {/* Top Row - Basic Info Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-center mb-6">
                        <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-2xl font-medium">
                            {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-gray-900">{selectedStudent.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Student ID</label>
                        <p className="text-gray-900">{selectedStudent.studentId}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{selectedStudent.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{selectedStudent.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-gray-900">{formatDate(selectedStudent.dateOfBirth)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="text-gray-900">
                          {selectedStudent.address.street}<br/>
                          {selectedStudent.address.city}, {selectedStudent.address.state} {selectedStudent.address.zipCode}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Academic Info */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Course</label>
                        <p className="text-gray-900">{selectedStudent.course}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Department</label>
                        <p className="text-gray-900">{selectedStudent.department}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Year/Semester</label>
                        <p className="text-gray-900">Year {selectedStudent.year}, Semester {selectedStudent.semester}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Enrollment Date</label>
                        <p className="text-gray-900">{formatDate(selectedStudent.enrollmentDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Current GPA</label>
                        <p className={`text-lg font-semibold ${
                          parseFloat(selectedStudent.gpa) >= 3.5 ? 'text-green-600' :
                          parseFloat(selectedStudent.gpa) >= 2.8 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>{selectedStudent.gpa}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Average Class Attendance</label>
                        <p className={`text-lg font-semibold ${
                          selectedStudent.averageAttendance >= 90 ? 'text-green-600' :
                          selectedStudent.averageAttendance >= 75 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>{selectedStudent.averageAttendance}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Counselor Assigned</label>
                        <p className="text-gray-900">{selectedStudent.counselorAssigned}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Health & Emergency Info */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Health & Emergency</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Wellness Score</label>
                        <p className={`text-lg font-semibold ${
                          selectedStudent.wellnessScore >= 8 ? 'text-green-600' :
                          selectedStudent.wellnessScore >= 6 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>{selectedStudent.wellnessScore}/10</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          selectedStudent.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                          selectedStudent.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedStudent.status || 'Active'}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Medical Conditions</label>
                        <p className="text-gray-900">{selectedStudent.medicalInfo.conditions}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Allergies</label>
                        <p className="text-gray-900">{selectedStudent.medicalInfo.allergies}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Medications</label>
                        <p className="text-gray-900">{selectedStudent.medicalInfo.medications}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                        <p className="text-gray-900">
                          {selectedStudent.emergencyContact.name} ({selectedStudent.emergencyContact.relationship})<br/>
                          {selectedStudent.emergencyContact.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Social Clubs & Activities Management - Full Width */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Social Clubs & Activities</h3>
                      <div className="flex space-x-2">
                        {editingClubs ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingClubs(false);
                                initializeClubData(selectedStudent); // Reset to original
                              }}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveClubData}
                              disabled={saving}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm"
                            >
                              {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditingClubs(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1"
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span>Manage Clubs</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {editingClubs ? (
                      <div className="space-y-6">
                        {/* Engagement Analytics */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-md font-semibold text-gray-900 flex items-center">
                              <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
                              Club Engagement Analytics
                              <span className="ml-2 text-sm text-purple-600 font-normal">({getMonthNames()[selectedClubAttendanceMonth]} {selectedClubAttendanceYear})</span>
                            </h4>
                            <div className="text-xs text-blue-600 bg-blue-100 rounded px-2 py-1">
                              📊 Informational Only - Not a Risk Factor
                            </div>
                          </div>
                          {(() => {
                            const analytics = getEngagementAnalytics();
                            
                            if (!analytics.isParticipating) {
                              return (
                                <div className="text-center py-6">
                                  <div className="text-3xl font-bold text-gray-600 mb-2">Not Participating</div>
                                  <div className="text-sm text-gray-600 mb-3">Student is not currently involved in any clubs</div>
                                  <div className="text-xs text-blue-700 bg-blue-100 rounded-full px-3 py-1 inline-block">
                                    ℹ️ This is completely normal and not a concern
                                  </div>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-purple-600">{analytics.totalClubs}</div>
                                  <div className="text-xs text-gray-600">Active Clubs</div>
                                </div>
                                <div className="text-center">
                                  <div className={`text-2xl font-bold ${
                                    analytics.clubParticipationRate > 75 ? 'text-green-600' :
                                    analytics.clubParticipationRate > 50 ? 'text-blue-600' : 'text-gray-600'
                                  }`}>{analytics.clubParticipationRate}%</div>
                                  <div className="text-xs text-gray-600">Club Participation Rate</div>
                                </div>
                                <div className="text-center">
                                  <div className={`text-2xl font-bold ${
                                    analytics.eventParticipationRate > 70 ? 'text-green-600' :
                                    analytics.eventParticipationRate > 40 ? 'text-blue-600' : 'text-gray-600'
                                  }`}>{analytics.eventParticipationRate}%</div>
                                  <div className="text-xs text-gray-600">Event Participation</div>
                                </div>
                                <div className="text-center">
                                  <div className={`text-2xl font-bold ${
                                    analytics.engagementLevel === 'Very Active' ? 'text-green-600' :
                                    analytics.engagementLevel === 'Active' ? 'text-green-600' :
                                    analytics.engagementLevel === 'Moderate' ? 'text-blue-600' : 'text-gray-600'
                                  }`}>{analytics.engagementLevel}</div>
                                  <div className="text-xs text-gray-600">Club Engagement</div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Club Selection */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 mb-3">Select Clubs</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {socialClubsAndActivities.map(club => (
                              <div key={club.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`club-${club.id}`}
                                  checked={studentClubs.includes(club.id)}
                                  onChange={() => toggleClubMembership(club.id)}
                                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor={`club-${club.id}`} className="text-sm text-gray-700 cursor-pointer">
                                  <span className="font-medium">{club.name}</span>
                                  <span className="text-gray-500 ml-1">({club.category})</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Club Attendance for Selected Clubs */}
                        {studentClubs.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="text-md font-semibold text-gray-900 mb-2">Club Activity Participation</h4>
                                <p className="text-sm text-gray-600 mb-3">📅 Club participation is tracked monthly. Change month/year to view different periods.</p>
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium text-gray-700">Month:</label>
                                    <select
                                      value={selectedClubAttendanceMonth}
                                      onChange={(e) => handleClubAttendanceMonthYearChange(parseInt(e.target.value), selectedClubAttendanceYear)}
                                      className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-purple-500 focus:border-purple-500"
                                    >
                                      {getMonthNames().map((month, index) => (
                                        <option key={index} value={index}>{month}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium text-gray-700">Year:</label>
                                    <select
                                      value={selectedClubAttendanceYear}
                                      onChange={(e) => handleClubAttendanceMonthYearChange(selectedClubAttendanceMonth, parseInt(e.target.value))}
                                      className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-purple-500 focus:border-purple-500"
                                    >
                                      {getYearOptions().map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {studentClubs.map(clubId => {
                                const club = socialClubsAndActivities.find(c => c.id === clubId);
                                if (!club) return null;
                                
                                const weeklyPeriods = generateClubAttendanceWeeks(selectedClubAttendanceMonth, selectedClubAttendanceYear);
                                
                                return (
                                  <div key={clubId} className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                      <h5 className="font-medium text-gray-900">{club.name}</h5>
                                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                                        {club.category}
                                      </span>
                                    </div>
                                    <div className="space-y-2">
                                      {weeklyPeriods.map(week => (
                                        <div key={week.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                          <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">{week.name}</div>
                                            <div className="text-xs text-gray-500">
                                              {getMonthNames()[selectedClubAttendanceMonth]} {week.dateRange}, {selectedClubAttendanceYear}
                                            </div>
                                          </div>
                                          <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              id={`${clubId}-${week.id}`}
                                              checked={weeklyAttendance[clubId]?.[week.id] || false}
                                              onChange={(e) => {
                                                setWeeklyAttendance(prev => ({
                                                  ...prev,
                                                  [clubId]: {
                                                    ...prev[clubId],
                                                    [week.id]: e.target.checked
                                                  }
                                                }));
                                              }}
                                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                            />
                                            <span className="text-sm text-gray-700">Participated</span>
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Event Participation Tiles */}
                        {eventTiles.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-md font-semibold text-gray-900">Upcoming Club Events</h4>
                              <div className="flex space-x-2">
                                <button
                                  onClick={saveBulkEventParticipation}
                                  disabled={savingTileId === 'bulk-events' || eventTiles.filter(t => !t.saved && t.participation !== null).length === 0}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {savingTileId === 'bulk-events' ? 'Saving...' : 'Save All'}
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              {eventTiles.map((event) => (
                                <div key={event.id} className={`border rounded-lg p-4 transition-shadow duration-200 ${
                                  event.saved ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                                }`}>
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h5 className="font-medium text-gray-900 text-sm">{event.eventName}</h5>
                                        {event.saved && (
                                          <CheckIcon className="h-4 w-4 text-green-600" />
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-600 mb-2">
                                        <div className="font-medium text-purple-700">{event.clubName}</div>
                                        <div className="text-gray-500">({event.clubCategory})</div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-xs text-gray-600">
                                      <CalendarIcon className="h-3 w-3 mr-1" />
                                      {new Date(event.date).toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-600">
                                      <div className="w-3 h-3 mr-1 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                      </div>
                                      {event.time} • {event.duration}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-600">
                                      <div className="w-3 h-3 mr-1 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                      </div>
                                      {event.location}
                                    </div>
                                  </div>
                                  
                                  {!event.saved ? (
                                    <div className="space-y-3">
                                      <div className="text-xs font-medium text-gray-700 mb-2">Will the student attend?</div>
                                      <div className="flex space-x-3">
                                        <label className="flex items-center space-x-1 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`participation-${event.id}`}
                                            checked={event.participation === true}
                                            onChange={() => updateEventTileParticipation(event.id, true)}
                                            className="text-green-600 focus:ring-green-500"
                                          />
                                          <span className="text-xs text-green-700 font-medium">Attending</span>
                                        </label>
                                        <label className="flex items-center space-x-1 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`participation-${event.id}`}
                                            checked={event.participation === false}
                                            onChange={() => updateEventTileParticipation(event.id, false)}
                                            className="text-red-600 focus:ring-red-500"
                                          />
                                          <span className="text-xs text-red-700 font-medium">Not Attending</span>
                                        </label>
                                      </div>
                                      {event.filled && (
                                        <button
                                          onClick={() => saveEventTile(event.id)}
                                          disabled={savingTileId === event.id}
                                          className="w-full py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {savingTileId === event.id ? 'Saving...' : 'Save Participation'}
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center py-2 bg-green-100 rounded text-green-800 text-xs font-medium">
                                      <CheckIcon className="h-3 w-3 mr-1" />
                                      {event.participation ? 'Attending' : 'Not Attending'}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            {eventTiles.length === 0 && (
                              <div className="text-center py-8 text-gray-500 italic">
                                No upcoming events for selected clubs
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Social Engagement Level</label>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            selectedStudent.socialEngagementLevel === 'high' ? 'bg-green-100 text-green-800' :
                            selectedStudent.socialEngagementLevel === 'moderate' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedStudent.socialEngagementLevel ? selectedStudent.socialEngagementLevel.charAt(0).toUpperCase() + selectedStudent.socialEngagementLevel.slice(1) : 'Moderate'}
                          </span>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500">Active Clubs</label>
                          <div className="mt-2">
                            {studentClubs.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {studentClubs.map(clubId => {
                                  const club = socialClubsAndActivities.find(c => c.id === clubId);
                                  return club ? (
                                    <span 
                                      key={clubId}
                                      className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium"
                                      title={club.category}
                                    >
                                      {club.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic text-sm">No club memberships recorded</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Social Activity Information */}
                        {studentClubs.length === 0 && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <UsersIcon className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Club Participation - Optional</span>
                            </div>
                            <p className="text-sm text-blue-700 mt-1">
                              No club memberships recorded. This is completely normal - many students focus on academics, work, or other activities. Click "Manage Clubs" if the student wishes to join any clubs.
                            </p>
                            <div className="mt-2 text-xs text-blue-600 bg-blue-100 rounded px-2 py-1 inline-block">
                              ℹ️ Low Priority - Not a mental health concern
                            </div>
                            
                            {/* Check for recent club withdrawal */}
                            {selectedStudent.socialClubHistory && Array.isArray(selectedStudent.socialClubHistory) && selectedStudent.socialClubHistory.some(entry => entry && entry.action === 'dropped_all_clubs') && (
                              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <div className="flex items-center space-x-2">
                                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                                  <span className="text-sm font-medium text-yellow-800">Behavioral Change Alert</span>
                                </div>
                                <p className="text-xs text-yellow-700 mt-1">
                                  Student recently stopped participating in clubs they were previously involved in. This behavioral change may indicate stress or other concerns and warrants a wellness check-in.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {studentClubs.length >= 3 && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <HeartIcon className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">Excellent Social Engagement</span>
                            </div>
                            <p className="text-sm text-green-700 mt-1">
                              Strong social connections through multiple club activities - positive for mental wellbeing.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Prebuilt Marks Tiles */}
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Academic Performance & Marks</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowMarksPanel(!showMarksPanel)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                        <span>{showMarksPanel ? 'Hide' : 'Show'} Tiles</span>
                      </button>
                    </div>
                  </div>
                  
                  {showMarksPanel && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-md font-semibold text-blue-900 mb-3">Quick Fill Templates</h4>
                      <p className="text-sm text-blue-700 mb-3">Click on any template to quickly fill a period with sample marks:</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">🌟 Excellent (90-100)</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">👍 Good (75-90)</span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">📝 Average (60-75)</span>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">⚠️ Poor (40-55)</span>
                      </div>
                    </div>
                  )}
                  
                  {showMarksPanel ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {prebuiltMarksTiles.map((tile) => (
                        <div key={tile.id} className={`p-4 rounded-lg border-2 ${
                          tile.saved ? 'border-green-200 bg-green-50' :
                          tile.filled ? 'border-blue-200 bg-blue-50' :
                          'border-gray-200 bg-white'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{tile.period}</h4>
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                {tile.examType}
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              {tile.saved && !tile.editMode ? (
                                <>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                    ✓ Saved
                                  </span>
                                  <button
                                    onClick={() => enableEditMode(tile.id, 'marks')}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium"
                                  >
                                    Edit
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => saveMarksTile(tile.id)}
                                  disabled={!tile.filled || savingTileId === tile.id}
                                  className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-full font-medium"
                                >
                                  {savingTileId === tile.id ? 'Saving...' : (tile.editMode ? 'Update' : 'Save')}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {(!tile.saved || tile.editMode) && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                <button
                                  onClick={() => applyMarksTemplate(tile.id, 'excellent')}
                                  className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-full"
                                >
                                  🌟 Excellent
                                </button>
                                <button
                                  onClick={() => applyMarksTemplate(tile.id, 'good')}
                                  className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full"
                                >
                                  👍 Good
                                </button>
                                <button
                                  onClick={() => applyMarksTemplate(tile.id, 'average')}
                                  className="text-xs px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-full"
                                >
                                  📝 Average
                                </button>
                                <button
                                  onClick={() => applyMarksTemplate(tile.id, 'poor')}
                                  className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-full"
                                >
                                  ⚠️ Poor
                                </button>
                                <button
                                  onClick={() => applyMarksTemplate(tile.id, 'clear')}
                                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full"
                                >
                                  🗑️ Clear
                                </button>
                              </div>
                            )}
                            
                            {Object.entries(tile.subjects).map(([subject, mark]) => (
                              <div key={subject} className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 flex-1">{subject}:</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={mark}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setPrebuiltMarksTiles(prev => prev.map(t => 
                                      t.id === tile.id ? {
                                        ...t,
                                        subjects: { ...t.subjects, [subject]: newValue },
                                        filled: Object.values({...t.subjects, [subject]: newValue}).some(v => v !== '')
                                      } : t
                                    ));
                                  }}
                                  disabled={tile.saved && !tile.editMode}
                                  className={`w-20 px-2 py-1 border rounded text-sm text-center ${
                                    tile.saved && !tile.editMode ? 'bg-gray-100 text-gray-600' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                                  }`}
                                  placeholder="0-100"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Display existing saved marks
                    selectedStudent.biMonthlyMarks && selectedStudent.biMonthlyMarks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selectedStudent.biMonthlyMarks.map((period, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-semibold text-gray-900">{period.period}</h4>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {period.examType}
                              </span>
                            </div>
                            <div className="mb-3">
                              <div className={`text-3xl font-bold ${
                                period.marks >= 85 ? 'text-green-600' :
                                period.marks >= 70 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {period.marks}
                                <span className="text-lg text-gray-500">/{period.maxMarks}</span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">Overall Score</div>
                            </div>
                            <div className="space-y-2 border-t border-gray-200 pt-3">
                              <div className="text-sm font-medium text-gray-700 mb-2">Subject-wise Scores:</div>
                              {Object.entries(period.subjects).map(([subject, score]) => (
                                <div key={subject} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600 truncate flex-1">{subject}:</span>
                                  <span className={`font-semibold ${
                                    score >= 85 ? 'text-green-600' :
                                    score >= 70 ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>{score}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400">
                          <AcademicCapIcon className="h-12 w-12 mx-auto mb-3" />
                        </div>
                        <p className="text-gray-600 mb-4">No marks recorded yet</p>
                        <p className="text-sm text-gray-500">Click "Show Tiles" to use prebuilt templates for quick data entry</p>
                      </div>
                    )
                  )}
                </div>
                
                {/* Prebuilt Attendance Tiles */}
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Attendance Management</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowAttendancePanel(!showAttendancePanel)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        <span>{showAttendancePanel ? 'Hide' : 'Show'} Tiles</span>
                      </button>
                    </div>
                  </div>
                  
                  {showAttendancePanel && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="text-md font-semibold text-green-900 mb-2">Daily Attendance</h4>
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center space-x-2">
                              <label className="text-sm font-medium text-green-700">Month:</label>
                              <select
                                value={selectedAttendanceMonth}
                                onChange={(e) => handleAttendanceMonthYearChange(parseInt(e.target.value), selectedAttendanceYear)}
                                className="text-sm border border-green-300 rounded-md px-2 py-1 bg-white focus:ring-green-500 focus:border-green-500"
                              >
                                {getMonthNames().map((month, index) => (
                                  <option key={index} value={index}>{month}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <label className="text-sm font-medium text-green-700">Year:</label>
                              <select
                                value={selectedAttendanceYear}
                                onChange={(e) => handleAttendanceMonthYearChange(selectedAttendanceMonth, parseInt(e.target.value))}
                                className="text-sm border border-green-300 rounded-md px-2 py-1 bg-white focus:ring-green-500 focus:border-green-500"
                              >
                                {getYearOptions().map((year) => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <p className="text-sm text-green-700">Mark each day as Present or Absent. Weekends are automatically excluded.</p>
                        </div>
                        <button
                          onClick={saveBulkAttendance}
                          disabled={savingTileId === 'bulk'}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          {savingTileId === 'bulk' ? 'Saving...' : 'Save All'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button
                          onClick={() => applyBulkAttendanceTemplate('all-present')}
                          className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded-full text-xs font-medium"
                        >
                          ✓ Mark All Present
                        </button>
                        <button
                          onClick={() => applyBulkAttendanceTemplate('all-absent')}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-full text-xs font-medium"
                        >
                          ✗ Mark All Absent
                        </button>
                        <button
                          onClick={() => applyBulkAttendanceTemplate('clear-all')}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-medium"
                        >
                          🗑️ Clear All
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {showAttendancePanel ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 max-h-96 overflow-y-auto">
                      {prebuiltAttendanceTiles.map((tile) => {
                        const today = new Date().toISOString().split('T')[0];
                        const isPast = tile.date < today;
                        const isToday = tile.date === today;
                        const isFuture = tile.date > today;
                        
                        return (
                          <div key={tile.id} className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            tile.saved && tile.present === true ? 'border-green-300 bg-green-100' :
                            tile.saved && tile.present === false ? 'border-red-300 bg-red-100' :
                            tile.present === true ? 'border-green-200 bg-green-50' :
                            tile.present === false ? 'border-red-200 bg-red-50' :
                            isToday ? 'border-blue-300 bg-blue-50' :
                            isPast ? 'border-gray-300 bg-gray-50' :
                            'border-gray-200 bg-white'
                          } ${
                            isFuture ? 'opacity-60' : ''
                          }`}>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">{tile.dayNumber}</div>
                              <div className="text-xs text-gray-600 mb-2">
                                {tile.dayName}
                                {isToday && <span className="text-blue-600 font-semibold"> (Today)</span>}
                              </div>
                              
                              {!isFuture && (
                                <>
                                  {tile.saved && !tile.editMode ? (
                                    <div className="space-y-2">
                                      <div className={`text-sm font-medium ${
                                        tile.present ? 'text-green-700' : 'text-red-700'
                                      }`}>
                                        {tile.present ? '✓ Present' : '✗ Absent'}
                                      </div>
                                      <button
                                        onClick={() => enableEditMode(tile.id, 'attendance')}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="flex flex-col gap-1">
                                        <button
                                          onClick={() => {
                                            setPrebuiltAttendanceTiles(prev => prev.map(t => 
                                              t.id === tile.id ? {
                                                ...t,
                                                present: true,
                                                filled: true
                                              } : t
                                            ));
                                          }}
                                          className={`text-xs py-1 px-2 rounded-full font-medium ${
                                            tile.present === true 
                                              ? 'bg-green-600 text-white' 
                                              : 'bg-green-100 hover:bg-green-200 text-green-800'
                                          }`}
                                        >
                                          ✓ Present
                                        </button>
                                        <button
                                          onClick={() => {
                                            setPrebuiltAttendanceTiles(prev => prev.map(t => 
                                              t.id === tile.id ? {
                                                ...t,
                                                present: false,
                                                filled: true
                                              } : t
                                            ));
                                          }}
                                          className={`text-xs py-1 px-2 rounded-full font-medium ${
                                            tile.present === false 
                                              ? 'bg-red-600 text-white' 
                                              : 'bg-red-100 hover:bg-red-200 text-red-800'
                                          }`}
                                        >
                                          ✗ Absent
                                        </button>
                                      </div>
                                      
                                      {tile.present !== null && (
                                        <button
                                          onClick={() => saveAttendanceTile(tile.id)}
                                          disabled={savingTileId === tile.id}
                                          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-2 py-1 rounded-full font-medium w-full"
                                        >
                                          {savingTileId === tile.id ? 'Saving...' : 'Save'}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {isFuture && (
                                <div className="text-xs text-gray-500">Future</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Display existing saved attendance
                    selectedStudent.attendanceData && selectedStudent.attendanceData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                          {selectedStudent.attendanceData.slice(-18).map((period, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                              <div className="text-sm font-medium text-gray-900">{period.period}</div>
                              <div className="text-xs text-gray-500 mb-2">
                                {period.startDate} - {period.endDate}
                              </div>
                              <div className={`text-lg font-bold ${
                                period.percentage >= 90 ? 'text-green-600' :
                                period.percentage >= 75 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {period.present}/{period.total}
                              </div>
                              <div className={`text-sm font-medium ${
                                period.percentage >= 90 ? 'text-green-600' :
                                period.percentage >= 75 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {period.percentage}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400">
                          <CalendarIcon className="h-12 w-12 mx-auto mb-3" />
                        </div>
                        <p className="text-gray-600 mb-4">No attendance recorded yet</p>
                        <p className="text-sm text-gray-500">Click "Show Tiles" to use prebuilt templates for quick data entry</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'early-warning' && (
          <EarlyWarningSystem 
            studentsData={sortedStudentsData}
            institutionCode={institutionCode}
          />
        )}

        {activeTab === 'counselors' && (
          <CounselorManagement institutionCode={institutionCode} currentUser={currentUser} />
        )}

        {activeTab === 'analytics' && (
          <Analytics studentsData={studentsData} institutionCode={institutionCode} />
        )}

        
        {/* Student Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingStudent(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                          <input
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                          <input
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    {/* Academic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
                        <select
                          required
                          value={formData.course}
                          onChange={(e) => setFormData({...formData, course: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Course</option>
                          {courses.map((course) => (
                            <option key={course} value={course}>{course}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                          <select
                            value={formData.year}
                            onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value={1}>1st Year</option>
                            <option value={2}>2nd Year</option>
                            <option value={3}>3rd Year</option>
                            <option value={4}>4th Year</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                          <select
                            value={formData.semester}
                            onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value={1}>1st Semester</option>
                            <option value={2}>2nd Semester</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                        <input
                          type="text"
                          value={formData.address.street}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={formData.address.city}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <input
                          type="text"
                          value={formData.address.state}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                        <input
                          type="text"
                          value={formData.address.zipCode}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, zipCode: e.target.value}})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Emergency Contact & Medical Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={formData.emergencyContact.name}
                          onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, name: e.target.value}})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                        <select
                          value={formData.emergencyContact.relationship}
                          onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, relationship: e.target.value}})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Relationship</option>
                          <option value="Parent">Parent</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={formData.emergencyContact.phone}
                          onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, phone: e.target.value}})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                        <input
                          type="text"
                          value={formData.medicalInfo.allergies}
                          onChange={(e) => setFormData({...formData, medicalInfo: {...formData.medicalInfo, allergies: e.target.value}})}
                          placeholder="None or specify allergies"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Medications</label>
                        <input
                          type="text"
                          value={formData.medicalInfo.medications}
                          onChange={(e) => setFormData({...formData, medicalInfo: {...formData.medicalInfo, medications: e.target.value}})}
                          placeholder="None or specify medications"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
                        <input
                          type="text"
                          value={formData.medicalInfo.conditions}
                          onChange={(e) => setFormData({...formData, medicalInfo: {...formData.medicalInfo, conditions: e.target.value}})}
                          placeholder="None or specify conditions"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingStudent(null);
                        resetForm();
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4" />
                          <span>{editingStudent ? 'Update Student' : 'Add Student'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700">Loading students...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
