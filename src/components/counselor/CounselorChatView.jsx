import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  where,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XCircleIcon,
  UserIcon,
  PhoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  MicrophoneIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { useWebRTC } from '../../hooks/useWebRTC';
import IncomingCallModal from '../common/IncomingCallModal';
import CallingInterface from './CallingInterface';

export default function CounselorChatView() {
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [institutionCode, setInstitutionCode] = useState(null);
  const [counselorDocId, setCounselorDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  // WebRTC call states
  const [incomingCall, setIncomingCall] = useState(null);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  
  // Handle incoming calls
  const handleIncomingCall = (call) => {
    console.log('📞 Dashboard received incoming call:', call);
    setIncomingCall(call);
    setShowIncomingCall(true);
  };

  useEffect(() => {
    if (user) {
      loadCounselorDocId();
    }
  }, [user]);
  
  useEffect(() => {
    if (counselorDocId) {
      loadCounselorChats();
    }
  }, [counselorDocId]);
  
  // Cleanup stale calls on component mount
  useEffect(() => {
    const cleanupStaleCallsOnMount = async () => {
      if (!counselorDocId || !user) return;
      
      try {
        console.log('🧽 Dashboard: Cleaning up stale calls on mount...');
        const callsRef = collection(db, 'counselors', counselorDocId, 'calls');
        const staleCallsQuery = query(callsRef, where('status', '==', 'calling'));
        const snapshot = await getDocs(staleCallsQuery);
        
        const cleanupPromises = [];
        snapshot.docs.forEach((docSnapshot) => {
          const callData = docSnapshot.data();
          const createdAt = callData.createdAt?.toDate?.() || callData.createdAt;
          const isStale = createdAt && (Date.now() - createdAt.getTime()) > 30000; // older than 30 seconds
          
          if (isStale) {
            console.log('🧽 Found stale call on mount:', docSnapshot.id);
            cleanupPromises.push(
              updateDoc(doc(db, 'counselors', counselorDocId, 'calls', docSnapshot.id), {
                status: 'expired',
                updatedAt: serverTimestamp()
              }).then(() => {
                // Delete after updating
                return deleteDoc(doc(db, 'counselors', counselorDocId, 'calls', docSnapshot.id));
              })
            );
          }
        });
        
        if (cleanupPromises.length > 0) {
          await Promise.all(cleanupPromises);
          console.log('✅ Cleaned up', cleanupPromises.length, 'stale calls on mount');
        }
      } catch (error) {
        console.error('Error cleaning up stale calls on mount:', error);
      }
    };
    
    cleanupStaleCallsOnMount();
  }, [counselorDocId, user]);
  
  // Custom incoming call listener for counselor's own subcollection
  useEffect(() => {
    if (!counselorDocId || !user) return;
    
    console.log('📞 Dashboard: Setting up counselor call listener for doc:', counselorDocId);
    
    // Listen for calls in counselor's calls subcollection
    const callsRef = collection(db, 'counselors', counselorDocId, 'calls');
    const callsQuery = query(
      callsRef,
      where('status', '==', 'calling')
      // orderBy('createdAt', 'desc') - Temporarily removed until Firestore index is created
      // Click this link to create the required index:
      // https://console.firebase.google.com/v1/r/project/campuscare-45120/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9jYW1wdXNjYXJlLTQ1MTIwL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jYWxscy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXhAC
    );
    
    const unsubscribe = onSnapshot(callsQuery, (snapshot) => {
      console.log('📞 Dashboard: Counselor calls snapshot:', snapshot.docs.length, 'calls');
      console.log('📞 Dashboard: Current user UID:', user.uid);
      console.log('📞 Dashboard: Counselor document ID:', counselorDocId);
      console.log('📞 Dashboard: Snapshot metadata:', {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites
      });
      
      // Debug: Log all calls in the snapshot with timestamps
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || data.createdAt;
        console.log(`📞 Dashboard: Call ${index + 1}:`, {
          id: doc.id,
          callerId: data.callerId,
          calleeId: data.calleeId,
          status: data.status,
          type: data.type,
          createdAt: createdAt,
          isOld: createdAt && (Date.now() - createdAt.getTime()) > 30000, // older than 30 seconds
          isForThisCounselor: data.calleeId === user.uid
        });
      });
      
      snapshot.docChanges().forEach((change) => {
        console.log('📞 Dashboard: Document change:', {
          type: change.type,
          docId: change.doc.id,
          oldIndex: change.oldIndex,
          newIndex: change.newIndex
        });
        
        if (change.type === 'added') {
          const callData = { id: change.doc.id, ...change.doc.data() };
          const createdAt = callData.createdAt?.toDate?.() || callData.createdAt;
          const isOldCall = createdAt && (Date.now() - createdAt.getTime()) > 30000; // older than 30 seconds
          
          console.log('📞 Dashboard: New call detected:', {
            ...callData,
            createdAt,
            isOldCall,
            ageInSeconds: createdAt ? Math.floor((Date.now() - createdAt.getTime()) / 1000) : 'unknown'
          });
          
          // Only show incoming calls for this counselor that are recent (not old/stale)
          if (callData.calleeId === user.uid) {
            if (isOldCall) {
              console.log('🚫 Dashboard: Ignoring old call (older than 30 seconds)');
              // Clean up old call automatically
              cleanupOldCall(callData.id);
            } else {
              console.log('✅ Dashboard: Showing incoming call modal for recent call');
              handleIncomingCall(callData);
            }
          } else {
            console.log('❌ Dashboard: Not showing call - calleeId mismatch');
          }
        }
      });
    }, (error) => {
      console.error('Dashboard: Error listening for counselor calls:', error);
    });
    
    return () => unsubscribe();
  }, [counselorDocId, user]);
  
  // WebRTC hook for call functionality
  const {
    localStream,
    remoteStream,
    callState: webRTCCallState,
    currentCall,
    error: callError,
    isMuted,
    isCameraOn,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  } = useWebRTC(user?.uid, null); // Pass null since we handle incoming calls above
  
  // Call handler functions
  const handleAcceptCall = (callId, isVideo) => {
    setShowIncomingCall(false);
    setIncomingCall(null);
    answerCall(callId, isVideo);
  };
  
  const handleRejectCall = (callId) => {
    setShowIncomingCall(false);
    setIncomingCall(null);
    rejectCall(callId);
  };
  
  const initiateCall = async (studentId, isVideo = false) => {
    try {
      console.log(`📞 Dashboard: Counselor initiating ${isVideo ? 'video' : 'audio'} call`);
      console.log('📞 Dashboard: Active chat data:', activeChat);
      
      if (!studentId) {
        // Try to find student ID from various possible field names
        const possibleFields = ['studentId', 'studentUid', 'studentUID', 'uid', 'userId'];
        
        for (const field of possibleFields) {
          if (activeChat?.[field]) {
            studentId = activeChat[field];
            console.log(`✅ Found student ID using field '${field}':`, studentId);
            break;
          }
        }
      }
      
      if (!studentId) {
        console.error('❌ No student ID found. Available chat fields:', Object.keys(activeChat || {}));
        throw new Error('Student ID not found in chat data. Please check the chat structure.');
      }
      
      console.log('📞 Starting call with student ID:', studentId);
      await startCall(studentId, isVideo);
    } catch (error) {
      console.error('Failed to start call:', error);
      alert(`Failed to start call: ${error.message}`);
    }
  };
  
  // Function to clean up old/stale call documents
  const cleanupOldCall = async (callId) => {
    try {
      console.log('🧽 Cleaning up old call:', callId);
      const callRef = doc(db, 'counselors', counselorDocId, 'calls', callId);
      await updateDoc(callRef, {
        status: 'expired',
        updatedAt: serverTimestamp()
      });
      
      // Delete after a short delay
      setTimeout(async () => {
        try {
          await deleteDoc(callRef);
          console.log('✅ Old call document deleted:', callId);
        } catch (error) {
          console.log('Call document already deleted or not found');
        }
      }, 5000);
    } catch (error) {
      console.error('Error cleaning up old call:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const loadCounselorDocId = async () => {
    try {
      // Find counselor document by matching the UID
      const counselorsRef = collection(db, 'counselors');
      const q = query(counselorsRef, where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const counselorDoc = querySnapshot.docs[0];
        setCounselorDocId(counselorDoc.id);
        console.log('🎯 Found counselor document ID:', counselorDoc.id);
      } else {
        console.warn('⚠️ No counselor document found for UID:', user.uid);
      }
    } catch (error) {
      console.error('Error loading counselor document ID:', error);
    }
  };

  const loadCounselorChats = async () => {
    if (!counselorDocId) {
      console.log('⏳ Waiting for counselor document ID...');
      return;
    }
    
    try {
      setLoading(true);
      
      // Load active chats from nested chats collection under counselor
      const chatsRef = collection(db, 'counselors', counselorDocId, 'chats');
      const q = query(
        chatsRef,
        where('status', '==', 'active')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setChats(chatsList);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error loading counselor chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (chat) => {
    setActiveChat(chat);
    
    // Listen for messages in this chat using nested structure
    const messagesRef = collection(db, 'counselors', counselorDocId, 'chats', chat.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesList);
    });
    
    setActiveChat({ ...chat, unsubscribe });
  };

  const closeChat = () => {
    if (activeChat?.unsubscribe) {
      activeChat.unsubscribe();
    }
    setActiveChat(null);
    setMessages([]);
    setNewMessage('');
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat?.id) return;
    
    try {
      const messagesRef = collection(db, 'counselors', counselorDocId, 'chats', activeChat.id, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        senderType: 'counselor',
        timestamp: serverTimestamp()
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (activeChat) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg mr-3">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{activeChat.studentName}</h2>
                <p className="text-sm text-gray-600 flex items-center">
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full mr-2 font-medium">
                    Student Connect
                  </span>
                  Chat & Call Session
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
            
            {/* Student Connect Actions */}
            <div className="flex items-center space-x-2">
              {webRTCCallState === 'idle' && (
                <div className="flex items-center space-x-2 mr-4">
                  <span className="text-sm text-gray-500 font-medium">Student Connect:</span>
                  
                  {/* Voice Call Button */}
                  <button
                    onClick={() => initiateCall(null, false)} // Pass null, let initiateCall detect the student ID
                    className="flex items-center px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 border border-green-200 hover:border-green-300"
                    title="Start Voice Call"
                  >
                    <PhoneIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Voice</span>
                  </button>
                  
                  {/* Video Call Button */}
                  <button
                    onClick={() => initiateCall(null, true)} // Pass null, let initiateCall detect the student ID
                    className="flex items-center px-3 py-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200 border border-purple-200 hover:border-purple-300"
                    title="Start Video Call"
                  >
                    <VideoCameraIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Video</span>
                  </button>
                </div>
              )}
              
              {webRTCCallState === 'connected' && (
                <div className="flex items-center space-x-2 mr-4">
                  {/* Quick call controls */}
                  <button
                    onClick={toggleMute}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      isMuted 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    <MicrophoneIcon className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={endCall}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium"
                    title="End Call"
                  >
                    End Call
                  </button>
                </div>
              )}
              
              {/* Close Chat Button */}
              <button
                onClick={closeChat}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Close Chat Session"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Student Connect Call Panel */}
        {webRTCCallState === 'connected' && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mr-3">
                    {currentCall?.type === 'video' ? (
                      <VideoCameraIcon className="w-6 h-6 text-green-600" />
                    ) : (
                      <PhoneIcon className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Student Connect - Active Call</h3>
                    <p className="text-sm text-gray-600">
                      {currentCall?.type === 'video' ? 'Video call' : 'Voice call'} with {activeChat.studentName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Mute Button */}
                  <button
                    onClick={toggleMute}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      isMuted 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    <MicrophoneIcon className={`w-5 h-5 ${isMuted ? 'line-through' : ''}`} />
                  </button>
                  
                  {/* Camera Button (for video calls) */}
                  {currentCall?.type === 'video' && (
                    <button
                      onClick={toggleCamera}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        !isCameraOn 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                      <CameraIcon className={`w-5 h-5 ${!isCameraOn ? 'line-through' : ''}`} />
                    </button>
                  )}
                  
                  {/* End Call Button */}
                  <button
                    onClick={endCall}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                    title="End Call"
                  >
                    <PhoneXMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Video Stream Container */}
              {currentCall?.type === 'video' && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Remote Video (Student) */}
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {activeChat.studentName}
                    </div>
                    {!remoteStream && (
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="text-center">
                          <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm opacity-75">Waiting for student video...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Local Video (Counselor) */}
                  <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      You (Counselor)
                    </div>
                    {!localStream && (
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="text-center">
                          <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm opacity-75">Camera off</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className={`flex flex-col ${
          webRTCCallState === 'connected' && currentCall?.type === 'video' 
            ? 'h-[calc(100vh-400px)]' 
            : webRTCCallState === 'connected' 
            ? 'h-[calc(100vh-160px)]' 
            : 'h-[calc(100vh-80px)]'
        }`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No messages yet. Start the conversation with {activeChat.studentName}</p>
                
                {/* Student Connect Quick Actions */}
                <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200 max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Student Connect</h3>
                  <p className="text-blue-700 text-sm mb-4">Connect with {activeChat.studentName} through voice or video call</p>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => initiateCall(null, false)} // Pass null, let initiateCall detect the student ID
                      disabled={webRTCCallState !== 'idle'}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PhoneIcon className="w-5 h-5 mr-2" />
                      Voice Call
                    </button>
                    
                    <button
                      onClick={() => initiateCall(null, true)} // Pass null, let initiateCall detect the student ID
                      disabled={webRTCCallState !== 'idle'}
                      className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <VideoCameraIcon className="w-5 h-5 mr-2" />
                      Video Call
                    </button>
                  </div>
                </div>
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
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your response..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Chat Sessions</h1>
          <p className="text-gray-600">Manage ongoing conversations with students</p>
        </div>

        {chats.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Chats</h3>
            <p className="text-gray-600">Student chat requests will appear here when they reach out for support.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => openChat(chat)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl mr-4">
                      <UserIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{chat.studentName}</h3>
                      <p className="text-sm text-gray-600">Started: {chat.createdAt?.toDate?.()?.toLocaleDateString()}</p>
                      <p className="text-xs text-green-600 font-medium">Active Session</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-600">Open Chat</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Calling Interface */}
      <CallingInterface
        callState={webRTCCallState}
        currentCall={currentCall}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isCameraOn={isCameraOn}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        studentName={activeChat?.studentName || 'Student'}
        error={callError}
      />
      
      {/* Incoming Call Modal */}
      <IncomingCallModal
        call={incomingCall}
        callerName={incomingCall?.callerName || 'Student'}
        callerAvatar="🎓"
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        show={showIncomingCall}
      />
    </div>
  );
}
