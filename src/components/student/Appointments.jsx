import React, { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  collectionGroup,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  PlusIcon,
  VideoCameraIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Real counselors will be loaded from Firestore

export default function Appointments() {
  const [user] = useAuthState(auth);
  const [userRole, setUserRole] = useState("student");
  const [appointments, setAppointments] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [counselorsLoading, setCounselorLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userInstitutionCode, setUserInstitutionCode] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Load user's institution code and counselors
  useEffect(() => {
    if (!user) {
      setCounselorLoading(false);
      return;
    }

    const loadUserAndCounselors = async () => {
      try {
        setCounselorLoading(true);
        
        // First get the user's institution code
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        let institutionCode = null;
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          institutionCode = userData.institutionCode;
          
          // If student doesn't have an institution code, assign them to INST001 (default)
          if (!institutionCode && userData.role === 'student') {
            console.log('Assigning student to default institution...');
            institutionCode = 'INST001';
            
            // Update the user document with the default institution
            try {
              await updateDoc(doc(db, 'users', user.uid), {
                institutionCode: institutionCode,
                updatedAt: serverTimestamp()
              });
              console.log('Student assigned to institution:', institutionCode);
            } catch (error) {
              console.error('Failed to assign institution:', error);
            }
          }
          
          setUserInstitutionCode(institutionCode);
        }
        
        if (institutionCode) {
          // Load counselors from the same institution
          const counselorsRef = collection(db, 'counselors');
          const q = query(
            counselorsRef,
            where('institutionCode', '==', institutionCode),
            where('status', '==', 'active') // Only active counselors
          );
          
          const counselorsSnapshot = await getDocs(q);
          const counselorsList = counselorsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || `${data.firstName} ${data.lastName}` || 'Unknown Counselor',
              specialties: data.specialization ? [data.specialization] : ['General Counseling'],
              specialization: data.specialization || 'General Counseling',
              department: data.department || '',
              qualification: data.qualification || '',
              experience: data.experience || '',
              phone: data.phone || '',
              maxStudentsLoad: data.maxStudentsLoad || 50,
              workingHours: data.workingHours || { start: '09:00', end: '17:00' },
              workingDays: data.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              bio: data.bio || '',
              rating: 4.5, // Default rating
              avatar: '👨‍⚕️' // Default avatar
            };
          });
          
          console.log(`Loaded ${counselorsList.length} counselors from institution ${institutionCode}`);
          setCounselors(counselorsList);
        } else {
          console.warn('User has no institution code - cannot load counselors');
          setCounselors([]);
        }
        
      } catch (error) {
        console.error('Error loading counselors:', error);
        setCounselors([]);
      } finally {
        setCounselorLoading(false);
      }
    };

    loadUserAndCounselors();
  }, [user]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Load appointments from Firebase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadAppointments = async () => {
      try {
        setLoading(true);
        console.log('Loading appointments for student:', user.uid);
        
        // Check if user has proper authentication and data
        if (!user || !user.uid) {
          console.error('User not properly authenticated');
          setLoading(false);
          return;
        }
        
        // Debug: Check user data in Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Student user data:', {
              role: userData.role,
              institutionCode: userData.institutionCode,
              email: userData.email
            });
          } else {
            console.warn('User document does not exist in Firestore');
          }
        } catch (debugError) {
          console.error('Error checking user data:', debugError);
        }
        
        // Load appointments from user's collection first (faster and simpler)
        const userAppointmentsRef = collection(db, 'users', user.uid, 'appointments');
        const q = query(
          userAppointmentsRef,
          orderBy('scheduledDate', 'asc')
        );
        
        // Set up real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const appointmentsList = snapshot.docs.map(doc => {
            const data = doc.data();
            const counselor = counselors.find(c => c.id === data.counselorId);
            
            return {
              id: doc.id,
              ...data,
              counselorData: counselor,
              // Format dates for display
              date: data.scheduledDate,
              time: data.scheduledTime || '10:00'
            };
          });
          
          console.log(`Found ${appointmentsList.length} appointments for student`);
          setAppointments(appointmentsList);
          
        }, (error) => {
          console.error('Error fetching appointments:', error);
          
          // Handle different types of errors
          if (error.code === 'permission-denied') {
            console.log('Permission denied - trying fallback approach...');
            // Try loading without orderBy to see if it's an index issue
            const simpleQuery = query(
              userAppointmentsRef
            );
            
            const fallbackUnsubscribe = onSnapshot(simpleQuery, (snapshot) => {
              const appointmentsList = snapshot.docs.map(doc => {
                const data = doc.data();
                const counselor = counselors.find(c => c.id === data.counselorId);
                
                return {
                  id: doc.id,
                  ...data,
                  counselorData: counselor,
                  // Format dates for display
                  date: data.scheduledDate,
                  time: data.scheduledTime || '10:00'
                };
              }).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
              
              console.log(`Found ${appointmentsList.length} appointments for student (fallback)`);
              setAppointments(appointmentsList);
              setLoading(false);
            }, (fallbackError) => {
              console.error('Fallback query also failed:', fallbackError);
              setAppointments([]);
              setLoading(false);
            });
            
            return fallbackUnsubscribe;
          } else if (error.code === 'failed-precondition' && error.message.includes('index')) {
            console.log('Index still building, will retry...');
            setAppointments([]);
          } else {
            console.error('Unexpected error:', error.code, error.message);
            console.log('Trying alternative approach: loading from each counselor individually...');
            
            // Alternative approach: query each counselor's appointments individually
            loadAppointmentsAlternative();
            return; // Don't set empty appointments yet
          }
          
          setLoading(false);
        });
        
        setLoading(false);
        return unsubscribe;
        
      } catch (error) {
        console.error('Error loading appointments:', error);
        setLoading(false);
        setAppointments([]);
      }
    };

    const unsubscribe = loadAppointments();
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user, counselors]); // Reload appointments when counselors change
  
  // Alternative approach: load appointments from each counselor individually
  const loadAppointmentsAlternative = async () => {
    if (!user || counselors.length === 0) {
      console.log('No user or counselors available for alternative loading');
      setAppointments([]);
      setLoading(false);
      return;
    }
    
    try {
      console.log('Loading appointments from', counselors.length, 'counselors individually...');
      const allAppointments = [];
      
      for (const counselor of counselors) {
        try {
          const appointmentsRef = collection(db, 'counselors', counselor.id, 'appointments');
          const q = query(
            appointmentsRef,
            where('studentId', '==', user.uid)
          );
          
          const snapshot = await getDocs(q);
          const counselorAppointments = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              counselorData: counselor,
              // Format dates for display
              date: data.scheduledDate,
              time: data.scheduledTime || '10:00'
            };
          });
          
          allAppointments.push(...counselorAppointments);
          console.log(`Found ${counselorAppointments.length} appointments with counselor ${counselor.name}`);
        } catch (counselorError) {
          console.warn(`Error loading appointments from counselor ${counselor.name}:`, counselorError);
          // Continue with other counselors even if one fails
        }
      }
      
      // Sort appointments by date
      allAppointments.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
      
      console.log(`Total appointments found (alternative method): ${allAppointments.length}`);
      setAppointments(allAppointments);
      setLoading(false);
      
    } catch (error) {
      console.error('Alternative appointment loading also failed:', error);
      setAppointments([]);
      setLoading(false);
    }
  };

  // Create sample appointments in Firebase
  const createSampleAppointments = async () => {
    if (!user || counselors.length === 0) {
      alert('No counselors available to create appointments with.');
      return;
    }
    
    try {
      console.log('Creating sample appointments for user:', user.uid);
      
      const sampleAppointments = [
        {
          userId: user.uid,
          counselorId: counselors[0].id,
          counselorName: counselors[0].name,
          counselorSpecialties: counselors[0].specialties,
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
          scheduledTime: "14:00",
          type: "video",
          status: "confirmed",
          notes: "Initial consultation",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      ];
      
      // Add second appointment if there's a second counselor
      if (counselors.length > 1) {
        sampleAppointments.push({
          userId: user.uid,
          counselorId: counselors[1].id,
          counselorName: counselors[1].name,
          counselorSpecialties: counselors[1].specialties,
          scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
          scheduledTime: "10:00",
          type: "phone",
          status: "pending",
          notes: "Follow-up session",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Add appointments to BOTH user and counselor subcollections
      const userAppointmentsRef = collection(db, 'users', user.uid, 'appointments');
      for (const appointment of sampleAppointments) {
        // 1. Store in user's collection
        const userDocRef = await addDoc(userAppointmentsRef, appointment);
        
        // 2. Store in counselor's collection with reference
        const counselorAppointmentsRef = collection(db, 'counselors', appointment.counselorId, 'appointments');
        await addDoc(counselorAppointmentsRef, {
          ...appointment,
          userAppointmentId: userDocRef.id
        });
      }
      
      console.log('Sample appointments created successfully');
      alert('Sample appointments created successfully!');
    } catch (error) {
      console.error('Error creating sample appointments:', error);
      alert('Failed to create sample appointments. Please try again.');
    }
  };

  const handleBookAppointment = async (appointmentData) => {
    if (!user || !userInstitutionCode) {
      alert("Please sign in to book an appointment.");
      return;
    }
    
    try {
      const counselor = counselors.find(c => c.id === appointmentData.counselorId);
      
      const newAppointment = {
        studentId: user.uid,
        studentName: user.displayName || user.email,
        studentEmail: user.email,
        counselorId: appointmentData.counselorId,
        counselorName: counselor?.name || "Unknown Counselor",
        counselorSpecialties: counselor?.specialties || [],
        institutionCode: userInstitutionCode,
        scheduledDate: appointmentData.date,
        scheduledTime: appointmentData.time,
        type: appointmentData.type,
        status: "pending", // Will be reviewed by counselor
        notes: appointmentData.notes || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Booking appointment:', newAppointment);
      
      // Store appointment in BOTH locations:
      // 1. User's collection (for easy summary access)
      const userAppointmentsRef = collection(db, 'users', user.uid, 'appointments');
      const userDocRef = await addDoc(userAppointmentsRef, newAppointment);
      
      // 2. Counselor's collection (for counselor management) - use same ID
      const counselorAppointmentsRef = collection(db, 'counselors', appointmentData.counselorId, 'appointments');
      await addDoc(counselorAppointmentsRef, {
        ...newAppointment,
        userAppointmentId: userDocRef.id // Reference to user's appointment
      });
      
      console.log('Appointment stored in both locations with ID:', userDocRef.id);
      setShowBookingModal(false);
      alert("Appointment booked successfully! The counselor will review your request.");
      
    } catch (error) {
      console.error("Error booking appointment:", error);
      alert("Failed to book appointment. Please try again.");
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, newStatus, counselorId) => {
    if (!user) {
      alert("Please sign in to update appointment.");
      return;
    }
    
    if (!counselorId) {
      alert("Error: Counselor information missing. Please try again.");
      return;
    }
    
    try {
      const appointmentRef = doc(db, 'counselors', counselorId, 'appointments', appointmentId);
      await updateDoc(appointmentRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      console.log(`Appointment ${appointmentId} status updated to:`, newStatus);

      // Update local state
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: newStatus }
          : apt
      ));
      
      alert(`Appointment ${newStatus} successfully!`);
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert("Failed to update appointment status. Please try again.");
    }
  };

  const handleCancelAppointment = async (appointmentId, counselorId) => {
    if (!user) {
      alert("Please sign in to cancel appointment.");
      return;
    }
    
    if (!counselorId) {
      alert("Error: Counselor information missing. Please try again.");
      return;
    }
    
    if (!confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }
    
    try {
      const appointmentRef = doc(db, 'counselors', counselorId, 'appointments', appointmentId);
      await updateDoc(appointmentRef, { 
        status: "cancelled",
        updatedAt: serverTimestamp()
      });

      console.log(`Appointment ${appointmentId} cancelled successfully`);

      // Update local state
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: "cancelled" }
          : apt
      ));
      
      alert("Appointment cancelled successfully!");
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "video":
        return <VideoCameraIcon className="w-4 h-4" />;
      case "phone":
        return <PhoneIcon className="w-4 h-4" />;
      case "in-person":
        return <BuildingOfficeIcon className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
              <p className="text-gray-600 mt-2">
                Manage your counseling sessions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowBookingModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Book Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
                  Your Appointments
                </h2>
              </div>

              <div className="p-6">
                {appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
                    <p className="text-gray-500 mb-6">
                      Book your first appointment to get started
                    </p>
                    
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => setShowBookingModal(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
                      >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Book Appointment
                      </button>
                      <button
                        onClick={createSampleAppointments}
                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
                      >
                        Add Sample Data
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              {getTypeIcon(appointment.type)}
                              <h3 className="text-lg font-medium text-gray-900 ml-2">
                                {appointment.counselorData?.name || "Counselor"}
                              </h3>
                              <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-gray-600 space-x-4">
                              <div className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                <span>{new Date(appointment.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                <span>{appointment.time}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPinIcon className="w-4 h-4 mr-1" />
                                <span className="capitalize">{appointment.type}</span>
                              </div>
                            </div>

                            {appointment.notes && (
                              <p className="text-gray-600 text-sm mt-2">
                                <strong>Notes:</strong> {appointment.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex space-x-2">
                            {appointment.status === "confirmed" && (
                              <button
                                onClick={() => handleCancelAppointment(appointment.id, appointment.counselorId)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 text-sm"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Appointments</span>
                  <span className="font-medium text-2xl text-blue-600">{appointments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Confirmed</span>
                  <span className="font-medium text-green-600">
                    {appointments.filter(apt => apt.status === "confirmed").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-medium text-yellow-600">
                    {appointments.filter(apt => apt.status === "pending").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium text-blue-600">
                    {appointments.filter(apt => apt.status === "completed").length}
                  </span>
                </div>
              </div>
            </div>

            {/* Available Counselors */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                Available Counselors
              </h3>
              
              {counselorsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading counselors...</p>
                </div>
              ) : counselors.length === 0 ? (
                <div className="text-center py-4">
                  <UserIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No counselors available</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {counselors.map((counselor) => (
                    <div key={counselor.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg mr-3 flex-shrink-0">
                          {counselor.avatar || '👨‍⚕️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{counselor.name}</h4>
                          <p className="text-xs text-gray-600 truncate">{counselor.specialization || 'General Counseling'}</p>
                          
                          {counselor.qualification && (
                            <p className="text-xs text-gray-500 mt-1 truncate">{counselor.qualification}</p>
                          )}
                          
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-400 text-sm">★</span>
                            <span className="text-xs text-gray-600 ml-1">{counselor.rating || '4.5'}</span>
                            
                            {counselor.workingHours && (
                              <span className="text-xs text-gray-500 ml-2">
                                {counselor.workingHours.start || '09:00'} - {counselor.workingHours.end || '17:00'}
                              </span>
                            )}
                          </div>
                          
                          {counselor.experience && (
                            <p className="text-xs text-gray-500 mt-1 truncate">{counselor.experience}</p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setShowBookingModal(true)}
                        className="w-full mt-2 px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors duration-200"
                      >
                        Book Appointment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Support */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Need Immediate Help?</h3>
              <p className="text-red-700 text-sm mb-4">
                If you're experiencing a mental health crisis, don't wait for your appointment.
              </p>
              <div className="space-y-2">
                <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200">
                  Crisis Hotline: 988
                </button>
                <button className="w-full bg-white text-red-600 border border-red-300 py-2 px-4 rounded-lg font-medium hover:bg-red-50 transition-colors duration-200">
                  Campus Security: 911
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && (
          <BookingModal
            counselors={counselors}
            onClose={() => setShowBookingModal(false)}
            onBook={handleBookAppointment}
          />
        )}
      </div>
    </div>
  );
}

// Booking Modal Component
function BookingModal({ counselors, onClose, onBook }) {
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedType, setSelectedType] = useState("video");
  const [notes, setNotes] = useState("");

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCounselor || !selectedDate || !selectedTime) {
      alert("Please fill in all required fields");
      return;
    }

    onBook({
      counselorId: selectedCounselor,
      date: selectedDate,
      time: selectedTime,
      type: selectedType,
      notes: notes
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Counselor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Counselor *
              </label>
              <select
                value={selectedCounselor}
                onChange={(e) => setSelectedCounselor(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a counselor</option>
                {counselors.map((counselor) => (
                  <option key={counselor.id} value={counselor.id}>
                    {counselor.name} - {counselor.specialization || "General Counseling"}
                  </option>
                ))}
              </select>
              
              {/* Counselor Details */}
              {selectedCounselor && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {(() => {
                    const counselor = counselors.find(c => c.id === selectedCounselor);
                    if (!counselor) return null;
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mr-3">
                            {counselor.avatar || '👨‍⚕️'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{counselor.name}</h3>
                            <p className="text-sm text-gray-600">{counselor.specialization || 'General Counseling'}</p>
                          </div>
                        </div>
                        
                        {counselor.qualification && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Qualification</p>
                            <p className="text-sm text-gray-800">{counselor.qualification}</p>
                          </div>
                        )}
                        
                        {counselor.experience && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Experience</p>
                            <p className="text-sm text-gray-800">{counselor.experience}</p>
                          </div>
                        )}
                        
                        {counselor.department && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</p>
                            <p className="text-sm text-gray-800">{counselor.department}</p>
                          </div>
                        )}
                        
                        {counselor.bio && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">About</p>
                            <p className="text-sm text-gray-800">{counselor.bio}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Working Hours</p>
                            <p className="text-gray-800">
                              {counselor.workingHours?.start || '09:00'} - {counselor.workingHours?.end || '17:00'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rating</p>
                            <div className="flex items-center">
                              <span className="text-yellow-400">★</span>
                              <span className="text-gray-800 ml-1">{counselor.rating || '4.5'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {counselor.workingDays && counselor.workingDays.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Available Days</p>
                            <div className="flex flex-wrap gap-1">
                              {counselor.workingDays.map((day) => (
                                <span key={day} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {day.substring(0, 3)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time *
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {/* Appointment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="video">Video Call</option>
                <option value="phone">Phone Call</option>
                <option value="in-person">In-Person</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any specific topics or concerns you'd like to discuss..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200"
              >
                Book Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}