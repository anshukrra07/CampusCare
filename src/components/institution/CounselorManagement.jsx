import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  HeartIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  KeyIcon
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
  orderBy,
  where,
  getDoc 
} from 'firebase/firestore';
import { auth } from '../../lib/firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useCounselorAuth } from '../../hooks/useCounselorAuth';

const CounselorManagement = ({ institutionCode, currentUser }) => {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCounselor, setEditingCounselor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCounselorForAuth, setSelectedCounselorForAuth] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Use counselor auth hook
  const { 
    createCounselorAccount, 
    sendWelcomeEmail, 
    checkCounselorExists,
    loading: authLoading 
  } = useCounselorAuth();

  // Form state for adding/editing counselors
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience: '',
    licenseNumber: '',
    department: '',
    maxStudentsLoad: 50,
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    bio: '',
    status: 'active', // active, inactive, on-leave
    accountSetupOption: 'later', // 'later', 'now', 'email'
    temporaryPassword: '', // Temporary password if creating auth account
    generatePassword: false // Whether to auto-generate a password
  });

  // Specialization options for counselors
  const specializations = [
    'Clinical Psychology',
    'Educational Psychology',
    'Counseling Psychology',
    'Behavioral Therapy',
    'Cognitive Behavioral Therapy',
    'Family Therapy',
    'Substance Abuse Counseling',
    'Trauma Counseling',
    'Career Counseling',
    'Academic Counseling',
    'Mental Health Counseling',
    'Marriage and Family Therapy',
    'Group Therapy',
    'Crisis Intervention'
  ];

  const departments = [
    'Student Affairs',
    'Mental Health Services',
    'Academic Support',
    'Career Services',
    'Counseling Center',
    'Wellness Center',
    'Psychology Department'
  ];

  const workingDayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Generate a secure random password
  const generateRandomPassword = () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '@#$%&*'[Math.floor(Math.random() * 6)];
    
    // Fill remaining characters
    for (let i = 4; i < 12; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  useEffect(() => {
    if (institutionCode) {
      loadCounselors();
    }
  }, [institutionCode]);

  const loadCounselors = async () => {
    if (!institutionCode) return;
    
    setLoading(true);
    try {
      // Load counselors from root-level collection filtered by institution code
      const counselorsRef = collection(db, 'counselors');
      const q = query(
        counselorsRef,
        where('institutionCode', '==', institutionCode),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const counselorsData = [];
      
      querySnapshot.forEach((doc) => {
        counselorsData.push({ id: doc.id, ...doc.data() });
      });
      
      setCounselors(counselorsData);
    } catch (error) {
      console.error('Error loading counselors:', error);
      alert('Error loading counselors. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialization: '',
      qualification: '',
      experience: '',
      licenseNumber: '',
      department: '',
      maxStudentsLoad: 50,
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      bio: '',
      status: 'active',
      accountSetupOption: 'later',
      temporaryPassword: '',
      generatePassword: false
    });
    setEditingCounselor(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // Validate password if creating account now
    if (formData.accountSetupOption === 'now' && (!formData.temporaryPassword || formData.temporaryPassword.length < 6)) {
      alert('Please provide a password of at least 6 characters when creating account now.');
      return;
    }

    // Note: We don't check for existing emails anymore - the system will handle it gracefully

    setSaving(true);
    try {
      const counselorData = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`,
        institutionCode,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.uid || 'admin',
        role: 'counselor',
        assignedStudents: [],
        totalSessions: 0,
        activeCases: 0
      };

      if (editingCounselor) {
        // Update existing counselor at root level
        const counselorRef = doc(db, 'counselors', editingCounselor.id);
        await updateDoc(counselorRef, {
          ...counselorData,
          createdAt: editingCounselor.createdAt, // Keep original creation date
        });
        alert('Counselor updated successfully!');
      } else {
        // Check if counselor already exists with this email
        let existingCounselor = null;
        try {
          const existingQuery = query(
            collection(db, 'counselors'),
            where('email', '==', formData.email),
            where('institutionCode', '==', institutionCode)
          );
          const existingSnapshot = await getDocs(existingQuery);
          if (!existingSnapshot.empty) {
            existingCounselor = { id: existingSnapshot.docs[0].id, ...existingSnapshot.docs[0].data() };
          }
        } catch (error) {
          console.warn('Could not check for existing counselor:', error.message);
        }

        let docRef;
        if (existingCounselor) {
          // Update existing counselor
          docRef = doc(db, 'counselors', existingCounselor.id);
          await updateDoc(docRef, {
            ...counselorData,
            counselorId: existingCounselor.counselorId, // Keep existing ID
            createdAt: existingCounselor.createdAt, // Keep original creation date
          });
        } else {
          // Create new counselor
          const counselorsRef = collection(db, 'counselors');
          
          // Generate counselor ID
          const counselorId = `CNS${String(counselors.length + 1).padStart(4, '0')}`;
          counselorData.counselorId = counselorId;
          
          docRef = await addDoc(counselorsRef, counselorData);
        }
        
        // Handle authentication account creation based on selected option
        if (formData.accountSetupOption === 'now' && formData.temporaryPassword) {
          console.log('🚀 About to create counselor account with data:', counselorData);
          console.log('🏢 Institution code being passed:', institutionCode);
          // Create auth account with temporary password
          const authResult = await createCounselorAccount(counselorData, formData.temporaryPassword);
          
          if (authResult.success) {
            console.log('🎉 Auth result success:', authResult);
            
            // Handle existing account case
            if (authResult.isExistingAccount && !authResult.uid) {
              console.warn('⚠️ Existing Firebase Auth account detected but no user document created');
              console.log('💡 The counselor will need to contact support or use password reset to complete setup');
            }
            
            // Update counselor document with auth info
            if (authResult.uid) {
              console.log('🔄 Updating counselor document with UID:', authResult.uid);
              await updateDoc(docRef, {
                uid: authResult.uid,
                authAccountCreated: true,
                passwordSet: true
              });
              console.log('✅ Counselor document updated with auth info');
            } else {
              console.warn('⚠️ No UID in auth result - counselor document not updated with auth info');
            }
            
            // Show appropriate success message
            if (authResult.isExistingAccount || existingCounselor) {
              if (authResult.isExistingAccount && !authResult.uid) {
                alert(`Counselor profile updated successfully!\n\n⚠️ The email ${formData.email} already had a Firebase account (possibly from a previously deleted counselor).\n\nThe profile has been updated, but this counselor may not be able to login immediately.\n\nSolution: Have the counselor use "Forgot Password" on the login page to set up their account properly.`);
              } else {
                alert(`Counselor profile updated successfully!\n\nThe email ${formData.email} already had an account/profile, so it has been updated with the new information.\n\n${authResult.isExistingAccount ? 'Note: The existing account password was not changed.' : ''}`);
              }
            } else {
              alert(`Counselor added with login account created successfully!\n\nLogin credentials:\nEmail: ${formData.email}\nPassword: ${formData.temporaryPassword}\n\nPlease share these credentials securely with the counselor.`);
            }
          } else {
            alert(`Failed to create counselor account: ${authResult.message}\n\nPlease try again or contact support.`);
          }
        } else if (formData.accountSetupOption === 'email') {
          // Send password reset email for account setup
          const emailResult = await sendWelcomeEmail(formData.email);
          if (emailResult.success) {
            alert(`Counselor added successfully!\n\nA welcome email with account setup instructions has been sent to ${formData.email}.`);
          } else {
            alert('Counselor added successfully, but failed to send welcome email. You can send it later from the counselor list.');
          }
        } else {
          // Just create the counselor record without auth
          alert('Counselor added successfully! You can set up their login account later from the counselor list.');
        }
      }

      resetForm();
      setShowAddForm(false);
      await loadCounselors();
    } catch (error) {
      console.error('Error saving counselor:', error);
      alert('Error saving counselor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (counselor) => {
    setFormData({
      firstName: counselor.firstName || '',
      lastName: counselor.lastName || '',
      email: counselor.email || '',
      phone: counselor.phone || '',
      specialization: counselor.specialization || '',
      qualification: counselor.qualification || '',
      experience: counselor.experience || '',
      licenseNumber: counselor.licenseNumber || '',
      department: counselor.department || '',
      maxStudentsLoad: counselor.maxStudentsLoad || 50,
      workingHours: counselor.workingHours || { start: '09:00', end: '17:00' },
      workingDays: counselor.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      bio: counselor.bio || '',
      status: counselor.status || 'active'
    });
    setEditingCounselor(counselor);
    setShowAddForm(true);
  };

  const handleDelete = async (counselorId) => {
    if (!window.confirm('Are you sure you want to delete this counselor? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      
      // First get the counselor data to find the UID
      const counselorDoc = await getDoc(doc(db, 'counselors', counselorId));
      const counselorData = counselorDoc.exists() ? counselorDoc.data() : null;
      
      // Delete counselor document
      await deleteDoc(doc(db, 'counselors', counselorId));
      
      // If counselor had a UID, also delete their user document
      if (counselorData?.uid) {
        try {
          await deleteDoc(doc(db, 'users', counselorData.uid));
          console.log('Also deleted user document for UID:', counselorData.uid);
        } catch (userError) {
          console.warn('Could not delete user document:', userError.message);
          // Don't fail the whole operation if user doc deletion fails
        }
      }
      
      if (counselorData?.uid) {
        alert('Counselor deleted successfully!\n\n⚠️ Note: The Firebase authentication account still exists and cannot be deleted from here. If you recreate a counselor with the same email, you may encounter login issues.');
      } else {
        alert('Counselor deleted successfully!');
      }
      await loadCounselors();
    } catch (error) {
      console.error('Error deleting counselor:', error);
      alert('Error deleting counselor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendWelcomeEmail = async (counselor) => {
    const result = await sendWelcomeEmail(counselor.email);
    if (result.success) {
      alert(`Welcome email sent to ${counselor.email}`);
    } else {
      alert(result.message);
    }
  };

  const handleCreateAuthAccount = (counselor) => {
    setSelectedCounselorForAuth(counselor);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!tempPassword || tempPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    try {
      const result = await createCounselorAccount(selectedCounselorForAuth, tempPassword);
      
      if (result.success) {
        // Update counselor document
        const counselorRef = doc(db, 'counselors', selectedCounselorForAuth.id);
        if (result.uid) {
          await updateDoc(counselorRef, {
            uid: result.uid,
            authAccountCreated: true,
            passwordSet: true,
            updatedAt: new Date()
          });
        }
        
        // Show appropriate success message
        if (result.isExistingAccount) {
          alert(`Profile updated successfully!\n\nThe email ${selectedCounselorForAuth.email} already had an account, so the profile has been updated.\n\nNote: The existing account password was not changed.`);
        } else {
          alert('Authentication account created successfully!');
        }
        
        setShowPasswordModal(false);
        setSelectedCounselorForAuth(null);
        setTempPassword('');
        await loadCounselors();
      } else {
        alert(`Failed to create account: ${result.message}\n\nPlease try again.`);
      }
    } catch (error) {
      console.error('Error creating auth account:', error);
      alert('Error creating authentication account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCounselors = counselors
    .filter(counselor => 
      counselor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counselor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counselor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      if (sortOrder === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Counselor Management</h2>
          <p className="text-gray-600">Manage counselors and their assignments</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <UserPlusIcon className="h-5 w-5" />
          <span>Add Counselor</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Counselors</p>
              <p className="text-2xl font-bold text-gray-900">{counselors.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {counselors.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-blue-600">
                {counselors.reduce((sum, c) => sum + (c.assignedStudents?.length || 0), 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Load</p>
              <p className="text-2xl font-bold text-purple-600">
                {counselors.length > 0 
                  ? Math.round(counselors.reduce((sum, c) => sum + (c.assignedStudents?.length || 0), 0) / counselors.length)
                  : 0
                }
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <HeartIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search counselors by name, email, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="specialization">Sort by Specialization</option>
              <option value="status">Sort by Status</option>
              <option value="createdAt">Sort by Date Added</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Counselors List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredCounselors.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Counselors Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No counselors match your search criteria.' : 'Get started by adding your first counselor.'}
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Add Counselor
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Counselor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCounselors.map((counselor) => (
                  <tr key={counselor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {counselor.firstName?.[0]}{counselor.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{counselor.name}</div>
                          <div className="text-sm text-gray-500">{counselor.counselorId || 'ID Pending'}</div>
                          <div className="text-xs text-gray-400">{counselor.qualification}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{counselor.specialization}</div>
                      <div className="text-sm text-gray-500">{counselor.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          counselor.status === 'active' ? 'bg-green-100 text-green-800' :
                          counselor.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {counselor.status?.charAt(0).toUpperCase() + counselor.status?.slice(1) || 'Active'}
                        </span>
                        <div className="text-xs text-gray-500">
                          {counselor.authAccountCreated ? (
                            <span className="text-green-600">✓ Has Login</span>
                          ) : (
                            <span className="text-orange-600">⚠ No Login</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {counselor.assignedStudents?.length || 0} / {counselor.maxStudentsLoad || 50}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${((counselor.assignedStudents?.length || 0) / (counselor.maxStudentsLoad || 50)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-sm text-gray-900 mb-1">
                        <EnvelopeIcon className="h-3 w-3 text-gray-400" />
                        <span className="truncate max-w-[120px]">{counselor.email}</span>
                      </div>
                      {counselor.phone && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <PhoneIcon className="h-3 w-3 text-gray-400" />
                          <span>{counselor.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(counselor)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Counselor"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {counselor.authAccountCreated ? (
                          <button 
                            onClick={() => handleSendWelcomeEmail(counselor)}
                            className="text-green-600 hover:text-green-900"
                            title="Send Password Reset Email"
                          >
                            <EnvelopeIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleCreateAuthAccount(counselor)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Create Login Account"
                          >
                            <ShieldCheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(counselor.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Counselor"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Counselor Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCounselor ? 'Edit Counselor' : 'Add New Counselor'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialization
                    </label>
                    <select
                      value={formData.specialization}
                      onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Specialization</option>
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualification
                    </label>
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                      placeholder="e.g., Ph.D. in Clinical Psychology"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience (years)
                    </label>
                    <input
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Students Load
                    </label>
                    <input
                      type="number"
                      value={formData.maxStudentsLoad}
                      onChange={(e) => setFormData({...formData, maxStudentsLoad: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Working Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.workingHours.start}
                      onChange={(e) => setFormData({
                        ...formData, 
                        workingHours: {...formData.workingHours, start: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.workingHours.end}
                      onChange={(e) => setFormData({
                        ...formData, 
                        workingHours: {...formData.workingHours, end: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {workingDayOptions.map((day) => (
                      <label key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.workingDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                workingDays: [...formData.workingDays, day]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                workingDays: formData.workingDays.filter(d => d !== day)
                              });
                            }
                          }}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bio and Status */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio / About
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      rows={3}
                      placeholder="Brief description about the counselor..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on-leave">On Leave</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Authentication Settings (only for new counselors) */}
              {!editingCounselor && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🔐 Login Account Setup</h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Choose how you want to set up the counselor's login account:
                    </p>
                    
                    {/* Account Setup Options */}
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="accountSetupOption"
                          value="later"
                          checked={formData.accountSetupOption === 'later'}
                          onChange={(e) => setFormData({...formData, accountSetupOption: e.target.value, temporaryPassword: ''})}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">⏰ Set up later</div>
                          <div className="text-xs text-gray-500">Create the counselor profile first, set up login account later</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="accountSetupOption"
                          value="now"
                          checked={formData.accountSetupOption === 'now'}
                          onChange={(e) => setFormData({...formData, accountSetupOption: e.target.value})}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">🔑 Create account with password now</div>
                          <div className="text-xs text-gray-500">Set a login password for the counselor account</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="accountSetupOption"
                          value="email"
                          checked={formData.accountSetupOption === 'email'}
                          onChange={(e) => setFormData({...formData, accountSetupOption: e.target.value, temporaryPassword: ''})}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">📧 Send welcome email</div>
                          <div className="text-xs text-gray-500">Send password reset email for the counselor to set their own password</div>
                        </div>
                      </label>
                    </div>
                    
                    {/* Password Input Section */}
                    {formData.accountSetupOption === 'now' && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-blue-900 mb-2">
                            Login Password *
                          </label>
                          
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="generatePassword"
                                checked={formData.generatePassword}
                                onChange={(e) => {
                                  const generate = e.target.checked;
                                  setFormData({
                                    ...formData, 
                                    generatePassword: generate,
                                    temporaryPassword: generate ? generateRandomPassword() : ''
                                  });
                                }}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor="generatePassword" className="text-sm text-blue-800">
                                🎲 Auto-generate secure password
                              </label>
                            </div>
                            
                            <div className="relative">
                              <input
                                type={formData.generatePassword || showPassword ? 'text' : 'password'}
                                value={formData.temporaryPassword}
                                onChange={(e) => setFormData({...formData, temporaryPassword: e.target.value, generatePassword: false})}
                                placeholder={formData.generatePassword ? 'Generated password will appear here' : 'Enter login password (minimum 6 characters)'}
                                disabled={formData.generatePassword}
                                className={`w-full px-3 py-2 pr-20 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  formData.generatePassword ? 'bg-blue-100 text-blue-900 font-mono text-sm' : ''
                                }`}
                              />
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                                {formData.generatePassword && formData.temporaryPassword && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(formData.temporaryPassword);
                                      alert('Password copied to clipboard!');
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-xs px-1"
                                    title="Copy password"
                                  >
                                    📋
                                  </button>
                                )}
                                {!formData.generatePassword && (
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                  >
                                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {formData.generatePassword && (
                              <button
                                type="button"
                                onClick={() => setFormData({...formData, temporaryPassword: generateRandomPassword()})}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                🔄 Generate new password
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-blue-100 rounded p-3 mt-3">
                          <p className="text-xs text-blue-800">
                            <strong>💡 Security Tips:</strong>
                          </p>
                          <ul className="text-xs text-blue-700 mt-1 space-y-1">
                            <li>• This will be the counselor's login password</li>
                            <li>• Share the password securely (phone call, encrypted message, etc.)</li>
                            <li>• Auto-generated passwords are more secure but harder to remember</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    
                    {formData.accountSetupOption === 'email' && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-green-600">✅</span>
                          <span className="text-sm font-medium text-green-900">Welcome email setup</span>
                        </div>
                        <p className="text-sm text-green-700">
                          A welcome email with account setup instructions will be sent to <strong>{formData.email || '[email address]'}</strong>.
                          The counselor can use the link in the email to set their own password.
                        </p>
                      </div>
                    )}
                    
                    {formData.accountSetupOption === 'later' && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-gray-600">⏳</span>
                          <span className="text-sm font-medium text-gray-900">Account setup postponed</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          The counselor profile will be created without a login account. You can set up their login account later from the counselor list using the "Create Login Account" button.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckIcon className="h-4 w-4" />
                  )}
                  <span>{saving ? 'Saving...' : (editingCounselor ? 'Update' : 'Add')} Counselor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Setup Modal */}
      {showPasswordModal && selectedCounselorForAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Create Login Account
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedCounselorForAuth(null);
                    setTempPassword('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {selectedCounselorForAuth.firstName?.[0]}{selectedCounselorForAuth.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{selectedCounselorForAuth.name}</div>
                    <div className="text-sm text-gray-500">{selectedCounselorForAuth.email}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Create a login account for this counselor. They will be able to log in with their email and the password you set.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The counselor should change this password on first login.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedCounselorForAuth(null);
                    setTempPassword('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={saving || !tempPassword || tempPassword.length < 6}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <ShieldCheckIcon className="h-4 w-4" />
                  )}
                  <span>{saving ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounselorManagement;