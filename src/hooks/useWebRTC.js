import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../lib/firebase';
import { 
  checkWebRTCSupport, 
  getMediaConstraints, 
  handleWebRTCError, 
  testMediaDevices,
  retryWithBackoff
} from '../utils/webrtcUtils';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

// ICE servers for WebRTC
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all', // Use both STUN and TURN
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

export const useWebRTC = (userId, onIncomingCall) => {
  // States
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected, ended
  const [currentCall, setCurrentCall] = useState(null);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [webrtcSupport, setWebrtcSupport] = useState(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState(null);

  // Refs
  const peerConnection = useRef(null);
  const callDocRef = useRef(null);
  const unsubscribeCall = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const isInitializing = useRef(false);
  const disconnectionTimeout = useRef(null);

  // Initialize WebRTC (simplified)
  const createNewPeerConnection = useCallback(() => {
    console.log('🔧 Creating fresh RTCPeerConnection');
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    console.log('✅ Peer connection created, state:', pc.signalingState);

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('📹 Received remote stream:', event);
      console.log('📹 Event streams:', event.streams);
      console.log('📹 Event track:', event.track);
      
      const [remoteStream] = event.streams;
      if (remoteStream) {
        console.log('📹 Setting remote stream with tracks:', remoteStream.getTracks().length);
        remoteStream.getTracks().forEach(track => {
          console.log('📹 Remote track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
        });
        
        setRemoteStream(remoteStream);
        
        // Set the remote video element source
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          console.log('📹 Set remote video element srcObject');
          
          // Ensure video starts playing
          remoteVideoRef.current.play().catch(error => {
            console.warn('⚠️ Remote video autoplay failed:', error);
          });
        } else {
          console.warn('⚠️ Remote video ref not available');
        }
      } else {
        console.warn('⚠️ No remote stream in ontrack event');
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && callDocRef.current) {
        console.log('🧊 Adding ICE candidate');
        try {
          const { id, counselorId } = callDocRef.current;
          await addDoc(
            collection(db, 'counselors', counselorId, 'calls', id, 'candidates'), 
            {
              candidate: event.candidate.toJSON(),
              type: 'offer-candidate',
              timestamp: serverTimestamp()
            }
          );
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    };

    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      const state = pc?.signalingState;
      console.log('📶 Signaling state changed to:', state);
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc?.connectionState;
      console.log('🔗 Connection state:', state);
      
      if (state === 'connected') {
        // Clear disconnection timeout if we connect/reconnect
        if (disconnectionTimeout.current) {
          clearTimeout(disconnectionTimeout.current);
          disconnectionTimeout.current = null;
          console.log('✅ Reconnected successfully!');
        }
        console.log('✅ WebRTC connection established successfully!');
        setCallState('connected');
      } else if (state === 'failed') {
        console.log('❌ Connection failed, ending call');
        setCallState('ended');
        setError('Connection failed. Please try again.');
      } else if (state === 'disconnected') {
        console.log('⚠️ Connection disconnected - monitoring for reconnection...');
        // Set a timeout to end the call if it doesn't reconnect
        disconnectionTimeout.current = setTimeout(() => {
          if (pc?.connectionState === 'disconnected') {
            console.log('🔴 Connection remained disconnected, ending call');
            setCallState('ended');
            setError('Connection lost. Please try calling again.');
          }
        }, 10000); // Wait 10 seconds before giving up
      } else if (state === 'closed') {
        console.log('🔴 Connection closed');
        setCallState('ended');
      } else if (state === 'connecting') {
        console.log('🔄 Connection attempting to reconnect...');
      }
    };
    
    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      const iceState = pc?.iceConnectionState;
      console.log('🧊 ICE connection state:', iceState);
      
      if (iceState === 'connected' || iceState === 'completed') {
        console.log('✅ ICE connection established!');
      } else if (iceState === 'failed') {
        console.log('❌ ICE connection failed');
        setError('Connection failed due to network issues. Please check your internet connection.');
      } else if (iceState === 'disconnected') {
        console.log('⚠️ ICE connection disconnected - this is often temporary');
        // Don't immediately fail on disconnected - this can be temporary
        // The connection might reconnect automatically
      } else if (iceState === 'closed') {
        console.log('🔴 ICE connection closed');
        setCallState('ended');
      }
    };
    
    // Handle ICE gathering state changes
    pc.onicegatheringstatechange = () => {
      const gatheringState = pc?.iceGatheringState;
      console.log('🗺 ICE gathering state:', gatheringState);
    };

    return pc;
  }, []);

  // Get user media with improved error handling
  const getUserMedia = useCallback(async (video = false) => {
    try {
      // Check WebRTC support first
      const support = checkWebRTCSupport();
      if (!support.isSupported) {
        throw new Error('WebRTC not supported: ' + support.issues.join(', '));
      }
      
      const constraints = getMediaConstraints(video);
      console.log('🎥 Using media constraints:', constraints);
      
      // Use retry mechanism for getUserMedia
      const stream = await retryWithBackoff(async () => {
        console.log('🎥 Requesting user media...');
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('🎥 Got media stream with tracks:', mediaStream.getTracks().length);
        mediaStream.getTracks().forEach(track => {
          console.log('🎥 Track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
        });
        return mediaStream;
      }, 2, 1000);
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        console.log('📹 Setting local video element srcObject');
        localVideoRef.current.srcObject = stream;
        
        // Ensure video starts playing
        localVideoRef.current.play().catch(error => {
          console.warn('⚠️ Local video autoplay failed:', error);
        });
      } else {
        console.warn('⚠️ Local video ref not available when setting stream');
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      const errorMessage = handleWebRTCError(error);
      setError(errorMessage);
      throw error;
    }
  }, []);

  // Start a call
  const startCall = useCallback(async (recipientId, isVideo = false) => {
    try {
      console.log('📞 Starting call...', { recipientId, isVideo, userId });
      setCallState('calling');
      setError(null);

      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!recipientId) {
        throw new Error('Recipient ID is required');
      }

      // Get user media first
      console.log('🎤 Getting user media...');
      const stream = await getUserMedia(isVideo);
      
      // Create a fresh peer connection (don't reuse old ones)
      console.log('🔗 Creating new peer connection...');
      const pc = createNewPeerConnection();
      
      // Store the peer connection reference
      peerConnection.current = pc;
      
      // Add local stream to peer connection
      console.log('🎧 Adding tracks to peer connection...');
      console.log('🎧 Local stream tracks:', stream.getTracks().length);
      
      stream.getTracks().forEach(track => {
        console.log('🎧 Adding track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
        const sender = pc.addTrack(track, stream);
        console.log('🎧 Track added, sender:', sender);
      });
      
      console.log('🎧 All tracks added to peer connection');
      console.log('🎧 PC senders:', pc.getSenders().length);

      // Determine call storage location based on caller type
      // For counselor-to-student calls, store in caller's (counselor's) subcollection
      // For student-to-counselor calls, store in recipient's (counselor's) subcollection
      console.log('🔍 Determining call storage location...', { userId, recipientId });
      
      let storageDocId;
      
      // First, check if the current user (caller) is a counselor
      const callersRef = collection(db, 'counselors');
      const callerQuery = query(callersRef, where('uid', '==', userId));
      const callerSnapshot = await getDocs(callerQuery);
      
      if (!callerSnapshot.empty) {
        // Caller is a counselor, store in their own subcollection
        storageDocId = callerSnapshot.docs[0].id;
        console.log('✅ Caller is counselor, storing in counselor doc:', storageDocId);
      } else {
        // Caller is not a counselor (probably student), find the recipient counselor
        console.log('🔍 Caller is student, finding recipient counselor:', recipientId);
        const recipientQuery = query(callersRef, where('uid', '==', recipientId));
        const recipientSnapshot = await getDocs(recipientQuery);
        
        if (recipientSnapshot.empty) {
          throw new Error('Counselor not found for recipient');
        }
        
        storageDocId = recipientSnapshot.docs[0].id;
        console.log('✅ Found recipient counselor doc:', storageDocId);
      }

      // Create call document in the determined counselor's calls subcollection
      console.log('📄 Creating call document under counselor doc:', storageDocId);
      const callDoc = await addDoc(collection(db, 'counselors', storageDocId, 'calls'), {
        callerId: userId,
        calleeId: recipientId,
        status: 'calling',
        type: isVideo ? 'video' : 'audio',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Call document created:', callDoc.id);
      console.log('✅ Call stored in counselor doc:', storageDocId);
      console.log('✅ Call data:', {
        callerId: userId,
        calleeId: recipientId,
        status: 'calling',
        type: isVideo ? 'video' : 'audio'
      });

      callDocRef.current = { id: callDoc.id, counselorId: storageDocId };
      setCurrentCall({ id: callDoc.id, callerId: userId, calleeId: recipientId, type: isVideo ? 'video' : 'audio' });
      
      // Create offer immediately (connection should be fresh and ready)
      console.log('📝 Creating offer with fresh connection...');
      console.log('- Signaling state:', pc.signalingState);
      console.log('- Connection state:', pc.connectionState);
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('✅ Offer created and set as local description');

      // Save offer to Firestore
      await updateDoc(doc(db, 'counselors', storageDocId, 'calls', callDoc.id), {
        offer: {
          sdp: offer.sdp,
          type: offer.type
        },
        updatedAt: serverTimestamp()
      });

      // Listen for answer
      const callDocReference = doc(db, 'counselors', storageDocId, 'calls', callDoc.id);
      const unsubscribe = onSnapshot(callDocReference, (doc) => {
        const data = doc.data();
        console.log('📝 Call document updated:', data);
        
        if (data?.answer && !pc.currentRemoteDescription) {
          console.log('📝 Received answer, setting remote description...');
          const answer = new RTCSessionDescription(data.answer);
          console.log('📝 Answer SDP type:', answer.type, 'SDP length:', answer.sdp.length);
          
          pc.setRemoteDescription(answer).then(() => {
            console.log('✅ Successfully set remote description (answer)');
            setCallState('connected');
          }).catch(error => {
            console.error('❌ Failed to set remote description (answer):', error);
            setError('Failed to establish call connection.');
          });
        }
        
        if (data?.status === 'rejected') {
          console.log('❌ Call was rejected');
          setCallState('ended');
          setError('Call was rejected');
          unsubscribe();
        }
      });

      unsubscribeCall.current = unsubscribe;

      // Listen for ICE candidates
      const candidatesRef = collection(db, 'counselors', storageDocId, 'calls', callDoc.id, 'candidates');
      const candidatesQuery = query(candidatesRef, orderBy('timestamp'));
      
      const unsubscribeCandidates = onSnapshot(candidatesQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidateData = change.doc.data();
            console.log('🧊 Caller: Processing ICE candidate:', candidateData.type);
            
            if (candidateData.type === 'answer-candidate') {
              const candidate = new RTCIceCandidate(candidateData.candidate);
              console.log('🧊 Caller: Adding answer ICE candidate:', candidate);
              pc.addIceCandidate(candidate).then(() => {
                console.log('✅ Caller: Successfully added answer ICE candidate');
              }).catch(error => {
                console.error('❌ Caller: Failed to add answer ICE candidate:', error);
              });
            }
          }
        });
      });

      // Cleanup candidates listener when call ends
      const originalCleanup = unsubscribeCall.current;
      unsubscribeCall.current = () => {
        originalCleanup?.();
        unsubscribeCandidates();
      };

    } catch (error) {
      console.error('Error starting call:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      const errorMessage = handleWebRTCError(error);
      setError(errorMessage);
      setCallState('idle');
    }
  }, [userId, getUserMedia, createNewPeerConnection]);

  // Answer incoming call
  const answerCall = useCallback(async (callId, isVideo = false, counselorId = null) => {
    try {
      setCallState('connecting');
      setError(null);

      // Get user media
      const stream = await getUserMedia(isVideo);
      
      // Create fresh peer connection
      const pc = createNewPeerConnection();
      peerConnection.current = pc;
      
      // Add local stream to peer connection
      console.log('🎧 Answer: Adding tracks to peer connection...');
      console.log('🎧 Answer: Local stream tracks:', stream.getTracks().length);
      
      stream.getTracks().forEach(track => {
        console.log('🎧 Answer: Adding track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
        const sender = pc.addTrack(track, stream);
        console.log('🎧 Answer: Track added, sender:', sender);
      });
      
      console.log('🎧 Answer: All tracks added to peer connection');
      console.log('🎧 Answer: PC senders:', pc.getSenders().length);

      // Determine counselor document ID
      let counselorDocId;
      
      if (counselorId) {
        // If counselorId is provided (from incoming call data), use it
        counselorDocId = counselorId;
        console.log('✅ Using provided counselor document ID:', counselorDocId);
      } else {
        // Otherwise, find counselor document for current user (they must be the counselor)
        console.log('🔍 Finding counselor document for current user:', userId);
        const counselorsRef = collection(db, 'counselors');
        const counselorQuery = query(counselorsRef, where('uid', '==', userId));
        const counselorSnapshot = await getDocs(counselorQuery);
        
        if (counselorSnapshot.empty) {
          throw new Error('Counselor document not found and no counselorId provided');
        }
        
        const counselorDoc = counselorSnapshot.docs[0];
        counselorDocId = counselorDoc.id;
        console.log('✅ Found counselor document ID:', counselorDocId);
      }

      callDocRef.current = { id: callId, counselorId: counselorDocId };
      
      // Get call document from counselor's subcollection
      const callDocReference = doc(db, 'counselors', counselorDocId, 'calls', callId);
      const callSnapshot = await getDoc(callDocReference);
      const callData = callSnapshot.data();

      if (!callData?.offer) {
        throw new Error('No offer found in call document');
      }

      // Set remote description (offer)
      const offer = new RTCSessionDescription(callData.offer);
      console.log('📝 Answerer: Setting remote description (offer)...');
      console.log('📝 Answerer: Offer SDP type:', offer.type, 'SDP length:', offer.sdp.length);
      
      await pc.setRemoteDescription(offer);
      console.log('✅ Answerer: Successfully set remote description (offer)');

      // Create and set answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Update call document with answer
      await updateDoc(callDocReference, {
        answer: {
          sdp: answer.sdp,
          type: answer.type
        },
        status: 'connected',
        updatedAt: serverTimestamp()
      });

      setCurrentCall({ id: callId, ...callData });
      setCallState('connected');

      // Listen for ICE candidates
      const candidatesRef = collection(db, 'counselors', counselorDocId, 'calls', callId, 'candidates');
      const candidatesQuery = query(candidatesRef, orderBy('timestamp'));
      
      const unsubscribeCandidates = onSnapshot(candidatesQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidateData = change.doc.data();
            console.log('🧊 Answerer: Processing ICE candidate:', candidateData.type);
            
            if (candidateData.type === 'offer-candidate') {
              const candidate = new RTCIceCandidate(candidateData.candidate);
              console.log('🧊 Answerer: Adding offer ICE candidate:', candidate);
              pc.addIceCandidate(candidate).then(() => {
                console.log('✅ Answerer: Successfully added offer ICE candidate');
              }).catch(error => {
                console.error('❌ Answerer: Failed to add offer ICE candidate:', error);
              });
            }
          }
        });
      });

      // Handle answer ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            await addDoc(candidatesRef, {
              candidate: event.candidate.toJSON(),
              type: 'answer-candidate',
              timestamp: serverTimestamp()
            });
          } catch (error) {
            console.error('Error adding answer ICE candidate:', error);
          }
        }
      };

      unsubscribeCall.current = unsubscribeCandidates;

    } catch (error) {
      console.error('Error answering call:', error);
      setError('Failed to answer call. Please try again.');
      setCallState('idle');
    }
  }, [getUserMedia, createNewPeerConnection]);

  // Reject call
  const rejectCall = useCallback(async (callId, counselorId = null) => {
    try {
      let counselorDocId;
      
      if (counselorId) {
        // Use provided counselorId
        counselorDocId = counselorId;
      } else {
        // Find counselor document (user must be the counselor)
        const counselorsRef = collection(db, 'counselors');
        const counselorQuery = query(counselorsRef, where('uid', '==', userId));
        const counselorSnapshot = await getDocs(counselorQuery);
        
        if (!counselorSnapshot.empty) {
          const counselorDoc = counselorSnapshot.docs[0];
          counselorDocId = counselorDoc.id;
        }
      }
      
      if (counselorDocId) {
        await updateDoc(doc(db, 'counselors', counselorDocId, 'calls', callId), {
          status: 'rejected',
          updatedAt: serverTimestamp()
        });
      }
      
      setCallState('idle');
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  }, [userId]);

  // End call
  const endCall = useCallback(async () => {
    try {
      // Stop all tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
      }

      // Close peer connection
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      // Update call document
      if (callDocRef.current) {
        const { id, counselorId } = callDocRef.current;
        if (counselorId) {
          await updateDoc(doc(db, 'counselors', counselorId, 'calls', id), {
            status: 'ended',
            endedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          // Clean up call document after a delay
          setTimeout(async () => {
            try {
              await deleteDoc(doc(db, 'counselors', counselorId, 'calls', id));
            } catch (error) {
              console.log('Call document already cleaned up');
            }
          }, 30000); // 30 seconds
        }
      }

      // Cleanup listeners
      if (unsubscribeCall.current) {
        unsubscribeCall.current();
        unsubscribeCall.current = null;
      }

      callDocRef.current = null;
      setCurrentCall(null);
      setCallState('idle');
      setError(null);

    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [localStream, remoteStream]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Initialize WebRTC support and device capabilities
  useEffect(() => {
    const initializeWebRTC = async () => {
      // Check WebRTC support
      const support = checkWebRTCSupport();
      setWebrtcSupport(support);
      
      // Test device capabilities
      try {
        const deviceTest = await testMediaDevices();
        setDeviceCapabilities(deviceTest);
      } catch (error) {
        console.warn('Could not test media devices:', error);
        setDeviceCapabilities({
          hasAudioInput: false,
          hasVideoInput: false,
          hasAudioOutput: false,
          error: handleWebRTCError(error)
        });
      }
    };
    
    initializeWebRTC();
  }, []);

  // Listen for incoming calls
  useEffect(() => {
    if (!userId || !onIncomingCall) return;

    console.log('📞 Setting up incoming call listener for user:', userId);
    
    // First, determine if the user is a counselor or student
    // Students need to listen across all counselor collections
    const setupCallListener = async () => {
      try {
        // Check if user is a counselor
        const counselorsRef = collection(db, 'counselors');
        const counselorQuery = query(counselorsRef, where('uid', '==', userId));
        const counselorSnapshot = await getDocs(counselorQuery);
        
        if (!counselorSnapshot.empty) {
          // User is a counselor - listen in their own calls subcollection
          const counselorDocId = counselorSnapshot.docs[0].id;
          console.log('📞 Counselor setting up incoming call listener in own subcollection:', counselorDocId);
          
          const callsQuery = query(
            collection(db, 'counselors', counselorDocId, 'calls'),
            where('calleeId', '==', userId),
            where('status', '==', 'calling'),
            orderBy('createdAt', 'desc'),
            limit(1)
          );

          const unsubscribe = onSnapshot(callsQuery, 
            (snapshot) => {
              console.log('📞 Counselor incoming calls query snapshot:', snapshot.docs.length, 'calls');
              snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                  const callData = { id: change.doc.id, counselorId: counselorDocId, ...change.doc.data() };
                  console.log('📞 New incoming call detected for counselor:', callData);
                  setCallState('ringing');
                  onIncomingCall(callData);
                }
              });
            },
            (error) => {
              console.error('Error listening for counselor incoming calls:', error);
              if (error.code !== 'failed-precondition') {
                setError('Failed to listen for incoming calls: ' + error.message);
              }
            }
          );
          
          return unsubscribe;
        } else {
          // User is a student - listen across all counselor subcollections using collection group
          console.log('📞 Student setting up incoming call listener across all counselors');
          
          // Use collection group query to listen across all counselor calls subcollections
          const callsQuery = query(
            collection(db, 'calls'), // This won't work for subcollections
            where('calleeId', '==', userId),
            where('status', '==', 'calling'),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          
          // For now, we need to get all counselors and set up individual listeners
          // This is not optimal but necessary until we restructure the data
          const allCounselorsSnapshot = await getDocs(collection(db, 'counselors'));
          const unsubscribers = [];
          
          allCounselorsSnapshot.docs.forEach((counselorDoc) => {
            const counselorDocId = counselorDoc.id;
            
            const counselorCallsQuery = query(
              collection(db, 'counselors', counselorDocId, 'calls'),
              where('calleeId', '==', userId),
              where('status', '==', 'calling'),
              orderBy('createdAt', 'desc'),
              limit(1)
            );
            
            const unsubscribe = onSnapshot(counselorCallsQuery, 
              (snapshot) => {
                console.log(`📞 Student checking calls in counselor ${counselorDocId}:`, snapshot.docs.length, 'calls');
                snapshot.docChanges().forEach((change) => {
                  if (change.type === 'added') {
                    const callData = { id: change.doc.id, counselorId: counselorDocId, ...change.doc.data() };
                    console.log('📞 New incoming call detected for student:', callData);
                    setCallState('ringing');
                    onIncomingCall(callData);
                  }
                });
              },
              (error) => {
                console.error(`Error listening for calls in counselor ${counselorDocId}:`, error);
              }
            );
            
            unsubscribers.push(unsubscribe);
          });
          
          // Return a function that unsubscribes from all listeners
          return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
          };
        }
      } catch (error) {
        console.error('Error setting up call listener:', error);
        setError('Failed to set up call listener: ' + error.message);
      }
    };
    
    let unsubscribeFunction = null;
    
    setupCallListener().then((unsubscribe) => {
      unsubscribeFunction = unsubscribe;
    });
    
    return () => {
      if (unsubscribeFunction) {
        unsubscribeFunction();
      }
    };
  }, [userId, onIncomingCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧨 Component unmounting, cleaning up WebRTC...');
      // Clean up without calling endCall to avoid circular dependencies
      if (localStream) {
        localStream.getTracks().forEach(track => {
          console.log('📵 Stopping track:', track.kind);
          track.stop();
        });
      }
      
      if (peerConnection.current && peerConnection.current.signalingState !== 'closed') {
        console.log('📵 Closing peer connection on unmount');
        peerConnection.current.close();
      }
      
      if (unsubscribeCall.current) {
        unsubscribeCall.current();
      }
      
      // Clean up disconnection timeout
      if (disconnectionTimeout.current) {
        clearTimeout(disconnectionTimeout.current);
        disconnectionTimeout.current = null;
      }
    };
  }, []); // Remove endCall dependency to avoid re-running

  return {
    // States
    localStream,
    remoteStream,
    callState,
    currentCall,
    error,
    isMuted,
    isCameraOn,
    webrtcSupport,
    deviceCapabilities,
    
    // Refs for video elements
    localVideoRef,
    remoteVideoRef,
    
    // Actions
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    
    // Utils
    clearError: () => setError(null)
  };
};