import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  orderBy 
} from 'firebase/firestore';
import { sortStudents, calculateStats } from '../utils/dashboardUtils';

// Custom hook for institution data and authentication
export const useInstitutionAuth = () => {
  const [user] = useAuthState(auth);
  const [currentUser, setCurrentUser] = useState(null);
  const [institutionCode, setInstitutionCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

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
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    currentUser,
    institutionCode,
    loading
  };
};

// Custom hook for student data management
export const useStudentData = (institutionCode) => {
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    if (institutionCode) {
      loadStudents();
    }
  }, [institutionCode]);

  const loadStudents = async () => {
    if (!institutionCode) return;
    
    setLoading(true);
    try {
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
      setStudentsData([]);
      alert('Error loading students. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveStudent = async (studentData) => {
    setSaving(true);
    try {
      const studentsRef = collection(db, 'institutions', institutionCode, 'students');
      const studentId = `ST${String(studentsData.length + 1).padStart(4, '0')}`;
      
      const newStudent = {
        ...studentData,
        name: `${studentData.firstName} ${studentData.lastName}`,
        studentId,
        email: studentData.email || `${studentData.firstName.toLowerCase()}.${studentData.lastName.toLowerCase()}@student.university.edu`,
        enrollmentDate: new Date(),
        biMonthlyMarks: [],
        attendanceData: [],
        averageMarks: 0,
        averageAttendance: 0,
        gpa: '0.00',
        wellnessScore: null,
        status: 'Active',
        counselorAssigned: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await addDoc(studentsRef, newStudent);
      await loadStudents();
      return { success: true, message: 'Student added successfully!' };
    } catch (error) {
      console.error('Error saving student:', error);
      return { success: false, message: 'Error saving student. Please try again.' };
    } finally {
      setSaving(false);
    }
  };

  const updateStudent = async (studentId, updatedData) => {
    setSaving(true);
    try {
      const studentDoc = doc(db, 'institutions', institutionCode, 'students', studentId);
      await updateDoc(studentDoc, {
        ...updatedData,
        name: `${updatedData.firstName} ${updatedData.lastName}`,
        updatedAt: new Date()
      });
      
      await loadStudents();
      return { success: true, message: 'Student updated successfully!' };
    } catch (error) {
      console.error('Error updating student:', error);
      return { success: false, message: 'Error updating student. Please try again.' };
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async (studentId) => {
    try {
      await deleteDoc(doc(db, 'institutions', institutionCode, 'students', studentId));
      await loadStudents();
      return { success: true, message: 'Student deleted successfully!' };
    } catch (error) {
      console.error('Error deleting student:', error);
      return { success: false, message: 'Error deleting student. Please try again.' };
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedStudentsData = sortStudents(studentsData, sortBy, sortOrder);
  const stats = calculateStats(sortedStudentsData);

  return {
    studentsData: sortedStudentsData,
    loading,
    saving,
    sortBy,
    sortOrder,
    stats,
    loadStudents,
    saveStudent,
    updateStudent,
    deleteStudent,
    handleSort
  };
};

// Custom hook for form management
export const useStudentForm = (initialData = null) => {
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

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        dateOfBirth: initialData.dateOfBirth || '',
        course: initialData.course || '',
        department: initialData.department || '',
        year: initialData.year || 1,
        semester: initialData.semester || 1,
        address: initialData.address || {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        emergencyContact: initialData.emergencyContact || {
          name: '',
          relationship: '',
          phone: ''
        },
        medicalInfo: initialData.medicalInfo || {
          allergies: '',
          medications: '',
          conditions: ''
        }
      });
    }
  }, [initialData]);

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

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedFormData = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  return {
    formData,
    setFormData,
    resetForm,
    updateFormData,
    updateNestedFormData
  };
};