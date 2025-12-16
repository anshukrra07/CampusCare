import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ChatBubbleLeftRightIcon,
  UserIcon,
  PaperAirplaneIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PhoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  MicrophoneIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { useWebRTC } from '../../hooks/useWebRTC';
import IncomingCallModal from '../common/IncomingCallModal';

export default function CounselorChats() {
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [counselorProfile, setCounselorProfile] = useState(null);
  const [counselorDocId, setCounselorDocId] = useState(null);
  
  // WebRTC call states
  const [incomingCall, setIncomingCall] = useState(null);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  
  // Handle incoming calls
  const handleIncomingCall = (call) => {
    console.log('📞 Counselor received incoming call:', call);
    setIncomingCall(call);
    setShowIncomingCall(true);
  };
  
  // Custom incoming call listener for counselor's own subcollection
  useEffect(() => {
    if (!counselorDocId || !user) return;
    
    console.log('📞 Setting up counselor call listener for doc:', counselorDocId);
    
    // Listen for calls in counselor's calls subcollection
    const callsRef = collection(db, 'counselors', counselorDocId, 'calls');
    const callsQuery = query(
      callsRef,
      where('status', '==', 'calling'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(callsQuery, (snapshot) => {
      console.log('📞 Counselor calls snapshot:', snapshot.docs.length, 'calls');
      console.log('📞 Current user UID:', user.uid);
      console.log('📞 Counselor document ID:', counselorDocId);
      
      // Debug: Log all calls in the snapshot
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`📞 Call ${index + 1}:`, {
          id: doc.id,
          callerId: data.callerId,
          calleeId: data.calleeId,
          status: data.status,
          type: data.type,
          isForThisCounselor: data.calleeId === user.uid
        });
      });
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const callData = { id: change.doc.id, ...change.doc.data() };
          console.log('📞 New call for counselor:', callData);
          console.log('📞 Call calleeId:', callData.calleeId, 'Current user:', user.uid, 'Match:', callData.calleeId === user.uid);
          
          // Only show incoming calls (where counselor is the recipient)
          if (callData.calleeId === user.uid) {
            console.log('✅ Showing incoming call modal');
            handleIncomingCall(callData);
          } else {
            console.log('❌ Not showing call - calleeId mismatch');
          }
        }
      });
    }, (error) => {
      console.error('Error listening for counselor calls:', error);
    });
    
    return () => unsubscribe();
  }, [counselorDocId, user]);
  
  // WebRTC hook for call functionality (without incoming call handler since we handle it above)
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
  } = useWebRTC(user?.uid, null); // Pass null for incoming call handler
  
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
      console.log(`📞 Counselor initiating ${isVideo ? 'video' : 'audio'} call with student:`, studentId);
      await startCall(studentId, isVideo);
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to start call. Please try again.');
    }
  };

  // Load counselor profile and chats
  useEffect(() => {
    if (!user) return;
    loadCounselorProfile();
    loadCounselorDocId();
  }, [user]);
  
  // Load chats after getting counselor document ID
  useEffect(() => {
    if (counselorDocId) {
      loadChats();
    }
  }, [counselorDocId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCounselorProfile = async () => {
    try {
      const counselorDoc = await getDoc(doc(db, 'users', user.uid));
      if (counselorDoc.exists()) {
        setCounselorProfile(counselorDoc.data());
        console.log('👨‍⚕️ Counselor profile loaded from users collection');
      }
    } catch (error) {
      console.error('Error loading counselor profile:', error);
    }
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

  const loadChats = async () => {
    if (!counselorDocId) {
      console.log('⏳ Waiting for counselor document ID...');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`📋 Loading chats for counselor doc: ${counselorDocId}`);
      
      // Load all active chats from nested chats collection under counselor
      const chatsRef = collection(db, 'counselors', counselorDocId, 'chats');
      const q = query(
        chatsRef,
        where('status', '==', 'active'),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log(`📊 Raw snapshot result: ${snapshot.docs.length} documents found`);
        
        const allChats = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`Chat document ${doc.id}:`, data);
          return {
            id: doc.id,
            ...data
          };
        });
        
        // Group chats by student and keep only the most recent one per student
        const chatsByStudent = {};
        
        allChats.forEach(chat => {
          const studentId = chat.studentId;
          console.log(`Processing chat for student: ${studentId}`);
          if (!chatsByStudent[studentId] || 
              (!chatsByStudent[studentId].updatedAt || 
               (chat.updatedAt && chat.updatedAt.seconds > chatsByStudent[studentId].updatedAt.seconds))) {
            chatsByStudent[studentId] = chat;
          }
        });
        
        // Convert back to array and sort by most recent activity
        const uniqueChats = Object.values(chatsByStudent).sort((a, b) => {
          const aTime = a.updatedAt?.seconds || 0;
          const bTime = b.updatedAt?.seconds || 0;
          return bTime - aTime;
        });
        
        console.log(`📊 Final result: ${allChats.length} total chats, showing ${uniqueChats.length} unique students`);
        console.log('Unique chats:', uniqueChats);
        setChats(uniqueChats);
      }, (error) => {
        console.error('❌ Error loading chats:', error);
        console.error('Query was for counselor doc:', counselorDocId);
      });

      setLoading(false);
      
      // Return cleanup function
      return unsubscribe;
    } catch (error) {
      console.error('Error loading chats:', error);
      setLoading(false);
    }
  };

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    setMessages([]);

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

    // Reset unread count
    if (chat.unreadCount > 0) {
      const chatRef = doc(db, 'counselors', counselorDocId, 'chats', chat.id);
      await updateDoc(chatRef, {
        unreadCount: 0
      });
    }

    // Store cleanup function
    setSelectedChat({ ...chat, unsubscribe });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat?.id) return;

    try {
      const messagesRef = collection(db, 'counselors', counselorDocId, 'chats', selectedChat.id, 'messages');
      
      // Send counselor message
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        senderName: counselorProfile?.name || user.displayName || user.email,
        senderType: 'counselor',
        timestamp: serverTimestamp()
      });

      // Update chat status
      const chatRef = doc(db, 'counselors', counselorDocId, 'chats', selectedChat.id);
      await updateDoc(chatRef, {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
        lastMessageFrom: 'counselor',
        updatedAt: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Chat List Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Student Chats</h1>
          <p className="text-sm text-gray-600">Manage conversations with students</p>
        </div>

        <div className="overflow-y-auto h-full">
          {chats.length === 0 ? (
            <div className="p-6 text-center">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No active chats</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-200 ${
                  selectedChat?.id === chat.id
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{chat.studentName}</h3>
                  <div className="flex items-center">
                    {chat.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 mr-2">
                        {chat.unreadCount}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatLastMessageTime(chat.lastMessageTime)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <UserIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600 truncate">
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>

                {chat.status === 'urgent' && (
                  <div className="flex items-center mt-2">
                    <ExclamationCircleIcon className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-xs text-red-600 font-medium">Urgent</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col">
        {!selectedChat ? (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Chat</h2>
              <p className="text-gray-600">Choose a student conversation to start responding</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedChat.studentName}
                    </h2>
                    <p className="text-sm text-gray-600 flex items-center">
                      Student • Active chat session
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
                <div className="flex items-center space-x-3">
                  {/* Voice Call Button */}
                  <button
                    onClick={() => initiateCall(selectedChat.studentId, false)}
                    disabled={webRTCCallState !== 'idle'}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Voice Call Student"
                  >
                    <PhoneIcon className="w-5 h-5" />
                  </button>
                  
                  {/* Video Call Button */}
                  <button
                    onClick={() => initiateCall(selectedChat.studentId, true)}
                    disabled={webRTCCallState !== 'idle'}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Video Call Student"
                  >
                    <VideoCameraIcon className="w-5 h-5" />
                  </button>
                  
                  <div className="text-sm text-gray-500">
                    <ClockIcon className="w-4 h-4 inline mr-1" />
                    Chat started {formatLastMessageTime(selectedChat.createdAt)}
                  </div>
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
                      Call active with {selectedChat.studentName}
                    </span>
                    {currentCall?.type === 'video' && (
                      <VideoCameraIcon className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Mute Button */}
                    <button
                      onClick={toggleMute}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      <MicrophoneIcon className={`w-4 h-4 ${isMuted ? 'line-through' : ''}`} />
                    </button>
                    
                    {/* Camera Button (for video calls) */}
                    {currentCall?.type === 'video' && (
                      <button
                        onClick={toggleCamera}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          !isCameraOn ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                        }`}
                        title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                      >
                        <CameraIcon className={`w-4 h-4 ${!isCameraOn ? 'line-through' : ''}`} />
                      </button>
                    )}
                    
                    {/* End Call Button */}
                    <button
                      onClick={endCall}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No messages yet</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderType === 'counselor' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderType === 'counselor'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.senderType === 'counselor'
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.timestamp)}
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
                  placeholder={`Reply to ${selectedChat.studentName}...`}
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
          </>
        )}
      </div>
      
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
