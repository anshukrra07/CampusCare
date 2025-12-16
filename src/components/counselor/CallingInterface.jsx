import React, { useEffect, useState } from 'react';
import {
  PhoneIcon,
  PhoneXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  SpeakerXMarkIcon,
  UserIcon,
  SignalIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  PhoneIcon as PhoneIconSolid,
  VideoCameraIcon as VideoCameraIconSolid,
} from '@heroicons/react/24/solid';

export default function CallingInterface({ 
  callState, 
  currentCall, 
  localVideoRef, 
  remoteVideoRef,
  localStream,
  remoteStream,
  isMuted, 
  isCameraOn,
  onEndCall, 
  onToggleMute, 
  onToggleCamera,
  studentName = 'Student',
  error 
}) {
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);

  // Track call duration
  useEffect(() => {
    let interval = null;
    if (callState === 'connected' && !callStartTime) {
      setCallStartTime(Date.now());
    }
    
    if (callState === 'connected' && callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    } else if (callState === 'idle') {
      setCallDuration(0);
      setCallStartTime(null);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState, callStartTime]);

  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Don't render if not in a call
  if (callState === 'idle') {
    return null;
  }

  const isVideo = currentCall?.type === 'video';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">
        
        {/* Call Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{studentName}</h2>
                <p className="text-blue-100 flex items-center space-x-2">
                  <span className="flex items-center">
                    {isVideo ? (
                      <VideoCameraIconSolid className="w-4 h-4 mr-1" />
                    ) : (
                      <PhoneIconSolid className="w-4 h-4 mr-1" />
                    )}
                    {isVideo ? 'Video Call' : 'Voice Call'}
                  </span>
                  {callState === 'connected' && (
                    <>
                      <span>•</span>
                      <span>{formatDuration(callDuration)}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            
            {/* Call Status */}
            <div className="text-right">
              <div className="flex items-center space-x-2 text-sm">
                {callState === 'calling' && (
                  <>
                    <div className="animate-pulse">
                      <SignalIcon className="w-4 h-4" />
                    </div>
                    <span>Calling...</span>
                  </>
                )}
                {callState === 'ringing' && (
                  <>
                    <div className="animate-bounce">
                      <PhoneIcon className="w-4 h-4" />
                    </div>
                    <span>Ringing...</span>
                  </>
                )}
                {callState === 'connected' && (
                  <>
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    <span>Connected</span>
                  </>
                )}
                {error && (
                  <>
                    <ExclamationCircleIcon className="w-4 h-4 text-yellow-300" />
                    <span className="text-yellow-300">Connection Issue</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Area */}
        {isVideo && (
          <div className="relative bg-gray-900" style={{ height: '400px' }}>
            {/* Remote Video (Main) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ backgroundColor: '#1f2937' }}
            />
            
            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ backgroundColor: '#374151' }}
              />
              {!isCameraOn && (
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                  <VideoCameraSlashIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* No video placeholder */}
            {callState === 'connected' && !remoteStream && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium">{studentName}</p>
                  <p className="text-gray-400">Waiting for video...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audio-only Call Display */}
        {!isVideo && (
          <div className="bg-gradient-to-b from-gray-50 to-gray-100 py-16">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserIcon className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">{studentName}</h3>
              <p className="text-gray-600">
                {callState === 'calling' && 'Calling student...'}
                {callState === 'ringing' && 'Student is being called...'}
                {callState === 'connected' && 'Voice call in progress'}
              </p>
              
              {/* Audio visualization */}
              {callState === 'connected' && (
                <div className="flex justify-center items-center mt-6 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-blue-500 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 30 + 10}px`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mb-4">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="bg-white p-6">
          <div className="flex justify-center space-x-6">
            
            {/* Mute Button */}
            <button
              onClick={onToggleMute}
              className={`p-3 rounded-full transition-all duration-200 ${
                isMuted 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="w-6 h-6" />
              ) : (
                <MicrophoneIcon className="w-6 h-6" />
              )}
            </button>

            {/* Camera Button (for video calls) */}
            {isVideo && (
              <button
                onClick={onToggleCamera}
                className={`p-3 rounded-full transition-all duration-200 ${
                  !isCameraOn 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
              >
                {isCameraOn ? (
                  <VideoCameraIcon className="w-6 h-6" />
                ) : (
                  <VideoCameraSlashIcon className="w-6 h-6" />
                )}
              </button>
            )}

            {/* End Call Button */}
            <button
              onClick={onEndCall}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-105"
              title="End call"
            >
              <PhoneXMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Additional Info */}
          <div className="mt-4 text-center text-sm text-gray-500">
            {callState === 'calling' && 'Connecting to student...'}
            {callState === 'ringing' && 'Waiting for student to answer...'}
            {callState === 'connected' && 'Call in progress • Use controls above to manage your call'}
          </div>
        </div>
      </div>
    </div>
  );
}