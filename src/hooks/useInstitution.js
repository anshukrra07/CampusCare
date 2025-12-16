import { useState, useEffect } from 'react';
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
import { db } from '../lib/firebase';

export const useInstitution = (user) => {
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [institutionCode, setInstitutionCode] = useState(null);

  // Load user data and institution code
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Load students when institution code is available
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
      const studentsRef = collection(db, 'institutions', institutionCode, 'students');
      const q = query(studentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const students = [];
      
      querySnapshot.forEach((doc) => {
        students.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setStudentsData(students);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (studentData) => {
    if (!institutionCode) return null;
    
    setSaving(true);
    try {
      const studentsRef = collection(db, 'institutions', institutionCode, 'students');
      const docRef = await addDoc(studentsRef, {
        ...studentData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await loadStudents(); // Refresh the list
      return docRef.id;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateStudent = async (studentId, studentData) => {
    if (!institutionCode) return;
    
    setSaving(true);
    try {
      const studentDoc = doc(db, 'institutions', institutionCode, 'students', studentId);
      await updateDoc(studentDoc, {
        ...studentData,
        updatedAt: new Date()
      });
      
      await loadStudents(); // Refresh the list
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async (studentId) => {
    if (!institutionCode) return;
    
    setSaving(true);
    try {
      const studentDoc = doc(db, 'institutions', institutionCode, 'students', studentId);
      await deleteDoc(studentDoc);
      
      await loadStudents(); // Refresh the list
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    } finally {
      setSaving(false);
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
        } else {
          // Add new record
          updatedMarks = [...existingMarks, marksData];
        }
        
        // Calculate new averages
        const averageMarks = updatedMarks.length > 0 ? 
          Math.round(updatedMarks.reduce((sum, mark) => sum + mark.marks, 0) / updatedMarks.length) : 0;
        const gpa = (averageMarks / 25).toFixed(2);
        
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
      }
    } catch (error) {
      console.error('Error saving marks:', error);
      throw error;
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
        } else {
          // Add new record
          updatedAttendance = [...existingAttendance, attendanceData];
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
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      throw error;
    }
  };

  // Calculate statistics
  const stats = {
    totalStudents: studentsData.length,
    totalCounselors: 24,
    activeCrisisAlerts: studentsData.filter(s => s.mentalHealthRisk === 'High').length,
    averageWellnessScore: studentsData.length > 0 ? (studentsData.reduce((sum, s) => sum + (s.wellnessScore || 0), 0) / studentsData.length).toFixed(1) : '0.0',
    dropoutRisk: studentsData.filter(s => s.status === 'At Risk').length,
    lowAttendance: studentsData.filter(s => (s.averageAttendance || 0) < 80).length,
    excellentStudents: studentsData.filter(s => s.status === 'Excellent').length,
    averageGPA: studentsData.length > 0 ? (studentsData.reduce((sum, s) => sum + parseFloat(s.gpa || 0), 0) / studentsData.length).toFixed(2) : '0.00'
  };

  return {
    studentsData,
    loading,
    saving,
    currentUser,
    institutionCode,
    stats,
    loadStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    addMarksData,
    addAttendanceData
  };
};