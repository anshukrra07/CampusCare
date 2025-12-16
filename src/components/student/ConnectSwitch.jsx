import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useWebRTC } from '../../hooks/useWebRTC';
import IncomingCallModal from '../common/IncomingCallModal';
import WebRTCWarning from '../common/WebRTCWarning';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon,
  UserIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  PhoneXMarkIcon,
  SignalIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  PhoneArrowUpRightIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  CameraIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  PhoneIcon as PhoneIconSolid,
  VideoCameraIcon as VideoCameraIconSolid,
} from '@heroicons/react/24/solid';

export default function ConnectSwitch() {
  const [user] = useAuthState(auth);
  const [counselors, setCounselors] = useState([]);
  const [counselorsLoading, setCounselorsLoading] = useState(true);
  const [userInstitutionCode, setUserInstitutionCode] = useState(null);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [connectionType, setConnectionType] = useState('chat'); // 'chat', 'phone', 'video'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [callStatus, setCallStatus] = useState(null); // 'connecting', 'connected', 'ended'
  const [activeChat, setActiveChat] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStartTime, setCallStartTime] = useState(null);
  const [restoringChat, setRestoringChat] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [showWebRTCWarning, setShowWebRTCWarning] = useState(true);
  const messagesEndRef = useRef(null);
  const callTimerRef = useRef(null);
  
  // WebRTC hook for real call functionality
  const {
    localStream,
    remoteStream,
    callState: webRTCCallState,
    currentCall: webRTCCurrentCall,
    error: webRTCError,
    isMuted: webRTCIsMuted,
    isCameraOn: webRTCIsCameraOn,
    webrtcSupport,
    deviceCapabilities,
    localVideoRef,
    remoteVideoRef,
    startCall: webRTCStartCall,
    answerCall: webRTCAnswerCall,
    rejectCall: webRTCRejectCall,
    endCall: webRTCEndCall,
    toggleMute: webRTCToggleMute,
    toggleCamera: webRTCToggleCamera,
    clearError: webRTCClearError
  } = useWebRTC(user?.uid, handleIncomingCall);

  // Handle incoming call
  function handleIncomingCall(call) {
    console.log('📞 Incoming call:', call);
    setIncomingCall(call);
    setShowIncomingCall(true);
  }

  // Sync WebRTC states with component states
  useEffect(() => {
    if (webRTCCallState === 'connected') {
      setCallStatus('connected');
      setCallStartTime(new Date());
      
      // Debug media state when call connects
      console.log('🔍 ConnectSwitch: Call connected, checking media state:');
      console.log('- Local stream:', !!localStream, localStream?.getTracks()?.length, 'tracks');
      console.log('- Remote stream:', !!remoteStream, remoteStream?.getTracks()?.length, 'tracks');
      console.log('- Local video ref:', !!localVideoRef?.current);
      console.log('- Remote video ref:', !!remoteVideoRef?.current);
      
      if (localStream) {
        localStream.getTracks().forEach(track => {
          console.log('- Local track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
        });
      }
      
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => {
          console.log('- Remote track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
        });
      }
      
      // Check video element states
      setTimeout(() => {
        if (localVideoRef.current) {
          console.log('- Local video element srcObject:', !!localVideoRef.current.srcObject);
          console.log('- Local video element paused:', localVideoRef.current.paused);
          console.log('- Local video element readyState:', localVideoRef.current.readyState);
        }
        
        if (remoteVideoRef.current) {
          console.log('- Remote video element srcObject:', !!remoteVideoRef.current.srcObject);
          console.log('- Remote video element paused:', remoteVideoRef.current.paused);
          console.log('- Remote video element readyState:', remoteVideoRef.current.readyState);
        }
      }, 1000);
      
    } else if (webRTCCallState === 'calling') {
      setCallStatus('connecting');
    } else if (webRTCCallState === 'idle') {
      setCallStatus(null);
      setCallStartTime(null);
      setCallDuration(0);
    }
    
    // Sync mute and camera states
    setIsMuted(webRTCIsMuted);
    setIsCameraOn(webRTCIsCameraOn);
  }, [webRTCCallState, webRTCIsMuted, webRTCIsCameraOn, localStream, remoteStream, localVideoRef, remoteVideoRef]);

  // Handle WebRTC errors
  useEffect(() => {
    if (webRTCError) {
      console.error('WebRTC Error:', webRTCError);
      alert(webRTCError);
      webRTCClearError();
    }
  }, [webRTCError, webRTCClearError]);
  
  // Ensure video elements are updated when streams change
  useEffect(() => {
    console.log('📹 ConnectSwitch: Stream update - localStream:', !!localStream, 'remoteStream:', !!remoteStream);
    
    if (localStream && localVideoRef.current) {
      console.log('📹 ConnectSwitch: Setting local video srcObject');
      localVideoRef.current.srcObject = localStream;
    }
    
    if (remoteStream && remoteVideoRef.current) {
      console.log('📹 ConnectSwitch: Setting remote video srcObject');
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream, localVideoRef, remoteVideoRef]);

  // Load counselors on component mount and restore active chats
  useEffect(() => {
    if (!user) {
      setCounselorsLoading(false);
      return;
    }
    loadCounselors();
  }, [user]);

  // Auto-restore active chat sessions after counselors are loaded
  useEffect(() => {
    if (counselors.length > 0 && !activeChat && !counselorsLoading) {
      restoreActiveChat();
    }
  }, [counselors, counselorsLoading, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Call timer effect
  useEffect(() => {
    if (callStatus === 'connected' && callStartTime) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callStatus, callStartTime]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const restoreActiveChat = async () => {
    if (!user || !counselors.length) return;
    
    try {
      setRestoringChat(true);
      console.log('🔎 Searching for active chat sessions to restore...');
      
      // Search through each counselor's nested chats
      for (const counselor of counselors) {
        try {
          const chatsRef = collection(db, 'counselors', counselor.id, 'chats');
          const activeChatsQuery = query(
            chatsRef,
            where('studentId', '==', user.uid),
            where('status', '==', 'active')
          );
          
          const activeChatsSnapshot = await getDocs(activeChatsQuery);
          
          if (!activeChatsSnapshot.empty) {
            // Found active chats, restore the most recent one
            const sortedChats = activeChatsSnapshot.docs.sort((a, b) => {
              const aTime = a.data().updatedAt?.seconds || 0;
              const bTime = b.data().updatedAt?.seconds || 0;
              return bTime - aTime;
            });
            
            const chatDoc = sortedChats[0];
            const chatData = chatDoc.data();
            
            console.log(`🔄 Restoring active chat with ${counselor.name}`);
            
            // Restore the selected counselor
            setSelectedCounselor(counselor);
            setConnectionType('chat');
            
            // Show brief success notification
            setTimeout(() => {
              console.log(`✅ Chat session with ${counselor.name} restored successfully`);
            }, 500);
            
            // Set up message listener using nested structure
            const messagesRef = collection(db, 'counselors', counselor.id, 'chats', chatDoc.id, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
              const messagesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setMessages(messagesList);
            });
            
            // Store active chat info
            setActiveChat({ 
              ...counselor, 
              chatId: chatDoc.id, 
              unsubscribe,
              chatData 
            });
            
            break; // Stop searching once we find an active chat
          }
        } catch (error) {
          console.error(`Error checking chats for counselor ${counselor.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error restoring active chat:', error);
    } finally {
      setRestoringChat(false);
    }
  };

  const loadCounselors = async () => {
    try {
      setCounselorsLoading(true);
      
      // Get user's institution code
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let institutionCode = null;
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        institutionCode = userData.institutionCode;
        
        // Auto-assign to INST001 if needed
        if (!institutionCode && userData.role === 'student') {
          console.log('Assigning student to default institution...');
          institutionCode = 'INST001';
          await updateDoc(doc(db, 'users', user.uid), {
            institutionCode: institutionCode,
            updatedAt: serverTimestamp()
          });
        }
        
        setUserInstitutionCode(institutionCode);
      }
      
      if (institutionCode) {
        // Load counselors from the counselors collection (same as appointments)
        const counselorsRef = collection(db, 'counselors');
        const q = query(
          counselorsRef,
          where('institutionCode', '==', institutionCode),
          where('status', '==', 'active')
        );
        
        const counselorsSnapshot = await getDocs(q);
        const counselorsList = counselorsSnapshot.docs.map(doc => {
          const data = doc.data();
          const avatars = ['👨‍⚕️', '👩‍⚕️', '👨‍💼', '👩‍💼', '👨‍🏫', '👩‍🏫'];
          const isOnline = Math.random() > 0.3;
          return {
            id: doc.id, // This is the counselor document ID
            uid: data.uid, // This is the user ID for authentication and chats
            name: data.name || `${data.firstName} ${data.lastName}` || 'Unknown Counselor',
            specialization: data.specialization || 'General Counseling',
            department: data.department || '',
            isOnline: isOnline,
            lastSeen: isOnline ? 'Online' : new Date(Date.now() - Math.random() * 3600000),
            avatar: avatars[Math.floor(Math.random() * avatars.length)],
            rating: (4.0 + Math.random() * 1.0).toFixed(1),
            yearsExperience: Math.floor(Math.random() * 15) + 2,
            languages: ['English', 'Spanish', 'French'][Math.floor(Math.random() * 3)],
            nextAvailable: isOnline ? 'Now' : 'Tomorrow 2:00 PM',
          };
        });
        
        setCounselors(counselorsList);
      }
    } catch (error) {
      console.error('Error loading counselors:', error);
    } finally {
      setCounselorsLoading(false);
    }
  };

  const selectCounselor = (counselor) => {
    setSelectedCounselor(counselor);
    // Reset connection state when switching counselors
    setMessages([]);
    setCallStatus(null);
    if (activeChat?.unsubscribe) {
      activeChat.unsubscribe();
    }
    setActiveChat(null);
  };

  const initiateConnection = async (type) => {
    if (!selectedCounselor) {
      alert('Please select a counselor first.');
      return;
    }
    
    console.log(`Initiating ${type} connection with ${selectedCounselor.name}`);
    setConnectionType(type);
    
    if (type === 'chat') {
      // Start chat session
      await startChatSession(selectedCounselor);
    } else if (type === 'phone' || type === 'video') {
      // Start real WebRTC call
      const isVideo = type === 'video';
      setCallDuration(0);
      setIsSpeakerOn(true);
      
      // Use counselor's uid for the call (real user ID, not document ID)
      const recipientId = selectedCounselor.uid || selectedCounselor.id;
      console.log('📞 ConnectSwitch: Starting', type, 'call with counselor:', {
        counselor: selectedCounselor.name,
        recipientId,
        counselorData: selectedCounselor
      });
      
      webRTCStartCall(recipientId, isVideo);
    }
  };

  const startChatSession = async (counselor) => {
    try {
      // Check if we already have an active chat for this student-counselor pair
      // Using nested chats under counselors collection
      const counselorChatsRef = collection(db, 'counselors', counselor.id, 'chats');
      const existingChatsQuery = query(
        counselorChatsRef,
        where('studentId', '==', user.uid),
        where('status', '==', 'active')
      );
      
      const existingChats = await getDocs(existingChatsQuery);
      let chatDoc;
      
      if (!existingChats.empty) {
        // If multiple chats exist for the same pair, use the most recent one
        // and mark others as inactive to clean up duplicates
        const sortedChats = existingChats.docs.sort((a, b) => {
          const aTime = a.data().updatedAt?.seconds || 0;
          const bTime = b.data().updatedAt?.seconds || 0;
          return bTime - aTime;
        });
        
        chatDoc = sortedChats[0]; // Use most recent chat
        
        // Mark other duplicate chats as inactive (cleanup)
        if (sortedChats.length > 1) {
          console.log(`🧧 Found ${sortedChats.length} chats for same pair, cleaning up duplicates...`);
          for (let i = 1; i < sortedChats.length; i++) {
            await updateDoc(sortedChats[i].ref, {
              status: 'inactive',
              updatedAt: serverTimestamp()
            });
          }
        }
        
        // Update the active chat to ensure it's marked as active
        await updateDoc(chatDoc.ref, {
          status: 'active',
          updatedAt: serverTimestamp()
        });
        
        console.log('🔄 Reusing existing chat:', chatDoc.id);
      } else {
        // Create new chat session only if none exists
        console.log('🆕 Creating new chat for:', counselor.name);
        chatDoc = await addDoc(counselorChatsRef, {
          studentId: user.uid,
          studentName: user.displayName || user.email,
          counselorId: counselor.id, // Use counselor document ID
          counselorName: counselor.name,
          institutionCode: userInstitutionCode,
          status: 'active',
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          lastMessageFrom: '',
          unreadCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      // Listen for messages in this chat using nested structure
      const messagesRef = collection(db, 'counselors', counselor.id, 'chats', chatDoc.id, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messagesList);
      });
      
      // Store unsubscribe function for cleanup
      setActiveChat({ ...counselor, chatId: chatDoc.id, unsubscribe });
      
    } catch (error) {
      console.error('Error starting chat session:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat?.chatId) return;
    
    try {
      const messagesRef = collection(db, 'counselors', activeChat.id, 'chats', activeChat.chatId, 'messages');
      
      // Send student message
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        senderType: 'student',
        timestamp: serverTimestamp()
      });
      
      setNewMessage('');
      
      // Update chat status to show there's a new message
      const chatRef = doc(db, 'counselors', activeChat.id, 'chats', activeChat.chatId);
      await updateDoc(chatRef, {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
        lastMessageFrom: 'student',
        unreadCount: increment(1),
        updatedAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const endConnection = () => {
    // End WebRTC call if active
    if (webRTCCallState !== 'idle') {
      webRTCEndCall();
    }
    
    // Clean up chat
    if (activeChat?.unsubscribe) {
      activeChat.unsubscribe();
    }
    
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    setActiveChat(null);
    setMessages([]);
    setCallStatus(null);
    setCallDuration(0);
    setCallStartTime(null);
    setIsMuted(false);
    setIsCameraOn(true);
    setIsSpeakerOn(true);
    setNewMessage('');
    setConnectionType('chat'); // Reset to chat
  };
  
  // Handle incoming call acceptance
  const handleAcceptCall = (callId, isVideo) => {
    setShowIncomingCall(false);
    const counselorId = incomingCall?.counselorId;
    setIncomingCall(null);
    setConnectionType(isVideo ? 'video' : 'phone');
    webRTCAnswerCall(callId, isVideo, counselorId);
  };
  
  // Handle incoming call rejection
  const handleRejectCall = (callId) => {
    setShowIncomingCall(false);
    const counselorId = incomingCall?.counselorId;
    setIncomingCall(null);
    webRTCRejectCall(callId, counselorId);
  };
  
  const toggleMute = () => {
    if (webRTCCallState === 'connected') {
      webRTCToggleMute();
    } else {
      setIsMuted(!isMuted);
    }
  };
  
  const toggleCamera = () => {
    if (webRTCCallState === 'connected') {
      webRTCToggleCamera();
    } else {
      setIsCameraOn(!isCameraOn);
    }
  };
  
  const toggleSpeaker = () => setIsSpeakerOn(!isSpeakerOn);
  
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const scheduleAppointment = async (counselor) => {
    // This would integrate with your appointments system
    alert(`Appointment scheduling with ${counselor.name} - This would open the appointments page`);
    // navigate('/appointments?counselor=' + counselor.id);
  };

  const formatLastSeen = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (counselorsLoading || restoringChat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">
            {counselorsLoading ? 'Loading counselors...' : 'Restoring your chat session...'}
          </p>
        </div>
      </div>
    );
  }

  // Unified Communication Interface
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar - Counselor Selection */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          {/* WebRTC Compatibility Warning */}
          {showWebRTCWarning && (
            <WebRTCWarning
              webrtcSupport={webrtcSupport}
              deviceCapabilities={deviceCapabilities}
              onDismiss={() => setShowWebRTCWarning(false)}
            />
          )}
          
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Connect with Counselors</h1>
            
            {/* Connection Type Buttons */}
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => initiateConnection('chat')}
                className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 ${connectionType === 'chat'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                Chat
              </button>
              <button
                onClick={() => initiateConnection('phone')}
                disabled={!selectedCounselor?.isOnline || !webrtcSupport?.isSupported || !deviceCapabilities?.hasAudioInput}
                className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${connectionType === 'phone'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <PhoneIcon className="w-4 h-4 mr-2" />
                Phone
              </button>
              <button
                onClick={() => initiateConnection('video')}
                disabled={!selectedCounselor?.isOnline || !webrtcSupport?.isSupported || !deviceCapabilities?.hasAudioInput}
                className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${connectionType === 'video'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <VideoCameraIcon className="w-4 h-4 mr-2" />
                Video
              </button>
            </div>
          </div>
          
          {/* Counselor Selection */}
          <div className="flex items-center space-x-4 overflow-x-auto pb-2">
            {counselors.length === 0 ? (
              <div className="text-center py-8 w-full">
                <p className="text-gray-500">No counselors available</p>
              </div>
            ) : (
              counselors.map((counselor) => (
                <div
                  key={counselor.id}
                  className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 min-w-80 flex-shrink-0 border-2 ${
                    selectedCounselor?.id === counselor.id
                      ? 'bg-blue-50 border-blue-200 shadow-lg transform scale-105'
                      : 'bg-white hover:bg-gray-50 border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div onClick={() => selectCounselor(counselor)} className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                          {counselor.avatar}
                        </div>
                        {counselor.isOnline ? (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        ) : (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-400 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{counselor.name}</h3>
                          <div className="flex items-center">
                            <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-600">{counselor.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{counselor.specialization}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            counselor.isOnline 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {counselor.isOnline ? '🟢 Available Now' : '⚫ Offline'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {counselor.yearsExperience}+ years exp.
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Languages: {counselor.languages}</span>
                        <span>Next: {counselor.nextAvailable}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Action Buttons - Only show for selected counselor */}
                  {selectedCounselor?.id === counselor.id && (
                    <div className="mt-3 pt-3 border-t border-blue-200 flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          scheduleAppointment(counselor);
                        }}
                        className="flex-1 text-xs bg-white text-blue-600 border border-blue-300 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center"
                      >
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        Schedule
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          initiateConnection('chat');
                        }}
                        className="flex-1 text-xs bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                      >
                        <ChatBubbleLeftRightIcon className="w-3 h-3 mr-1" />
                        Chat Now
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Communication Area */}
      <div className="flex-1 flex flex-col">
        {!selectedCounselor ? (
          /* No Counselor Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-8">
              <UserIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Counselor</h2>
              <p className="text-gray-600 mb-6">
                Choose a counselor from the list above to start a conversation.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Available Connection Types:</h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center">
                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                    <span>Chat - Real-time messaging (always available)</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    <span>Phone - Voice calls (when counselor is online)</span>
                  </div>
                  <div className="flex items-center">
                    <VideoCameraIcon className="w-4 h-4 mr-2" />
                    <span>Video - Face-to-face calls (when counselor is online)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : connectionType === 'chat' ? (
          /* Chat Interface */
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                      {selectedCounselor.avatar}
                    </div>
                    {selectedCounselor.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedCounselor.name}</h2>
                    <p className="text-sm text-gray-600 flex items-center">
                      <ChatBubbleLeftRightIconSolid className="w-4 h-4 mr-1 text-blue-500" />
                      {activeChat ? 'Active Chat Session' : 'Chat Session'}
                      {activeChat && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Connected
                        </span>
                      )}
                      {/* Call Status Indicator */}
                      {webRTCCallState !== 'idle' && (
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          webRTCCallState === 'calling' ? 'bg-yellow-100 text-yellow-700' :
                          webRTCCallState === 'connected' ? 'bg-green-100 text-green-700' :
                          webRTCCallState === 'ringing' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {webRTCCallState === 'calling' ? '📞 Calling...' :
                           webRTCCallState === 'connected' ? '📞 Call Active' :
                           webRTCCallState === 'ringing' ? '📞 Incoming Call' :
                           webRTCCallState}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Call Actions */}
                <div className="flex items-center space-x-2">
                  {activeChat && selectedCounselor.isOnline && (
                    <>
                      {/* Voice Call Button */}
                      <button
                        onClick={() => {
                          const recipientId = selectedCounselor.uid || selectedCounselor.id;
                          console.log('📞 Starting voice call with counselor from chat:', selectedCounselor.name);
                          webRTCStartCall(recipientId, false);
                        }}
                        disabled={webRTCCallState !== 'idle'}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Voice Call"
                      >
                        <PhoneIcon className="w-5 h-5" />
                      </button>
                      
                      {/* Video Call Button */}
                      <button
                        onClick={() => {
                          const recipientId = selectedCounselor.uid || selectedCounselor.id;
                          console.log('📞 Starting video call with counselor from chat:', selectedCounselor.name);
                          webRTCStartCall(recipientId, true);
                        }}
                        disabled={webRTCCallState !== 'idle'}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Video Call"
                      >
                        <VideoCameraIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {/* End Chat Button */}
                  {activeChat && (
                    <button
                      onClick={endConnection}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="End Chat"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Call Controls Overlay */}
            {webRTCCallState === 'connected' && (
              <div className="bg-green-50 border-b border-green-200 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-800">
                      Call active with {selectedCounselor.name}
                    </span>
                    {webRTCCurrentCall?.type === 'video' && (
                      <VideoCameraIcon className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Mute Button */}
                    <button
                      onClick={webRTCToggleMute}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        webRTCIsMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}
                      title={webRTCIsMuted ? 'Unmute' : 'Mute'}
                    >
                      <MicrophoneIcon className={`w-4 h-4 ${webRTCIsMuted ? 'line-through' : ''}`} />
                    </button>
                    
                    {/* Camera Button (for video calls) */}
                    {webRTCCurrentCall?.type === 'video' && (
                      <button
                        onClick={webRTCToggleCamera}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          !webRTCIsCameraOn ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                        }`}
                        title={webRTCIsCameraOn ? 'Turn off camera' : 'Turn on camera'}
                      >
                        <CameraIcon className={`w-4 h-4 ${!webRTCIsCameraOn ? 'line-through' : ''}`} />
                      </button>
                    )}
                    
                    {/* End Call Button */}
                    <button
                      onClick={webRTCEndCall}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200"
                      title="End Call"
                    >
                      <PhoneXMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Start the conversation with {selectedCounselor.name}</p>
                  <p className="text-sm text-gray-400 mt-2">Your messages will appear here in real-time</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user.uid
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === user.uid ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Sending...'}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={`Message ${selectedCounselor.name}...`}
                  disabled={!activeChat}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !activeChat}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
              {!activeChat ? (
                <p className="text-xs text-gray-500 mt-2 text-center">Click "Chat" button above to start messaging</p>
              ) : (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Connected to {selectedCounselor.name} • {selectedCounselor.isOnline ? 'Online' : 'Offline'}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Call Interface */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              {callStatus === 'connecting' ? (
                <>
                  <div className="relative">
                    <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                      {selectedCounselor.avatar}
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-pulse"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Connecting to {selectedCounselor.name}...
                  </h3>
                  <div className="flex items-center justify-center text-blue-600">
                    <SignalIcon className="w-5 h-5 mr-2 animate-bounce" />
                    <p>Please wait while we connect you</p>
                  </div>
                </>
              ) : callStatus === 'connected' ? (
                <>
                  {connectionType === 'video' ? (
                    /* Video Call Interface */
                    <div className="relative w-full max-w-4xl mx-auto">
                      {/* Video Windows */}
                      <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video mb-6">
                        {/* Counselor Video (Main) */}
                        {remoteStream ? (
                          <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            muted={false}
                            controls={false}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <div className="text-center text-white">
                              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-6xl mx-auto mb-4">
                                {selectedCounselor.avatar}
                              </div>
                              <h3 className="text-2xl font-semibold">{selectedCounselor.name}</h3>
                              <p className="text-blue-100">{webRTCCallState === 'connected' ? 'Connecting video...' : 'Video call active'}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* User Video (Picture-in-Picture) */}
                        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/50">
                          {localStream && isCameraOn ? (
                            <video
                              ref={localVideoRef}
                              autoPlay
                              playsInline
                              muted={true}
                              controls={false}
                              className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                              <span className="text-2xl">{isCameraOn ? '😊' : '📷❌'}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Call Duration */}
                        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {formatCallDuration(callDuration)}
                        </div>
                      </div>
                      
                      {/* Video Call Controls */}
                      <div className="flex items-center justify-center space-x-4 mb-6">
                        <button
                          onClick={toggleMute}
                          className={`p-4 rounded-full transition-colors duration-200 ${
                            isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {isMuted ? <NoSymbolIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
                        </button>
                        
                        <button
                          onClick={toggleCamera}
                          className={`p-4 rounded-full transition-colors duration-200 ${
                            !isCameraOn ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {isCameraOn ? <CameraIcon className="w-6 h-6" /> : <NoSymbolIcon className="w-6 h-6" />}
                        </button>
                        
                        <button
                          onClick={toggleSpeaker}
                          className={`p-4 rounded-full transition-colors duration-200 ${
                            !isSpeakerOn ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <SpeakerWaveIcon className="w-6 h-6" />
                        </button>
                        
                        <button
                          onClick={endConnection}
                          className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                        >
                          <PhoneXMarkIcon className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Phone Call Interface */
                    <div className="text-center">
                      <div className="w-48 h-48 bg-green-100 rounded-full flex items-center justify-center text-6xl mx-auto mb-6 relative">
                        {selectedCounselor.avatar}
                        <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-pulse"></div>
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                        {selectedCounselor.name}
                      </h3>
                      <p className="text-green-600 mb-2 text-lg">
                        📞 Phone call active
                      </p>
                      <p className="text-gray-500 mb-8 text-xl font-mono">
                        {formatCallDuration(callDuration)}
                      </p>
                      
                      {/* Phone Call Controls */}
                      <div className="flex items-center justify-center space-x-6">
                        <button
                          onClick={toggleMute}
                          className={`p-4 rounded-full transition-colors duration-200 ${
                            isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {isMuted ? <NoSymbolIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
                        </button>
                        
                        <button
                          onClick={toggleSpeaker}
                          className={`p-4 rounded-full transition-colors duration-200 ${
                            !isSpeakerOn ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <SpeakerWaveIcon className="w-6 h-6" />
                        </button>
                        
                        <button
                          onClick={endConnection}
                          className="p-6 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                        >
                          <PhoneXMarkIcon className="w-8 h-8" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                    {selectedCounselor.avatar}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {connectionType === 'phone' ? 'Phone Call' : 'Video Call'} with {selectedCounselor.name}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {selectedCounselor.isOnline 
                      ? 'Ready to connect' 
                      : 'Counselor is currently offline'}
                  </p>
                  {selectedCounselor.isOnline ? (
                    <p className="text-sm text-gray-500">Click the {connectionType} button above to start the call</p>
                  ) : (
                    <p className="text-sm text-red-600">Please select an online counselor or try chat instead</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Emergency Support Bar */}
      <div className="bg-red-50 border-t border-red-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="flex items-center text-red-700">
            <ExclamationCircleIcon className="w-5 h-5 mr-2" />
            <span className="text-sm">
              <strong>Crisis Support:</strong> Call 988 (Suicide & Crisis Lifeline) or 911 for immediate help
            </span>
          </div>
        </div>
      </div>
      
      {/* Incoming Call Modal */}
      <IncomingCallModal
        call={incomingCall}
        callerName={incomingCall?.callerName || 'Counselor'}
        callerAvatar={incomingCall?.callerAvatar}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        show={showIncomingCall}
      />
    </div>
  );
}