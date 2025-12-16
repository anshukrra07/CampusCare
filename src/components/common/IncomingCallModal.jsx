import React, { useState, useEffect } from 'react';
import {
  PhoneIcon,
  PhoneXMarkIcon,
  VideoCameraIcon,
  UserIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import {
  PhoneIcon as PhoneIconSolid,
  VideoCameraIcon as VideoCameraIconSolid
} from '@heroicons/react/24/solid';

const IncomingCallModal = ({ 
  call, 
  callerName, 
  callerAvatar, 
  onAccept, 
  onReject, 
  show 
}) => {
  const [ringingTime, setRingingTime] = useState(0);
  
  useEffect(() => {
    if (!show) return;
    
    // Play ringing sound (if audio is available)
    const audio = new Audio();
    // You can add a ringing sound file to your public folder
    // audio.src = '/sounds/ringtone.mp3';
    // audio.loop = true;
    // audio.play().catch(console.error);
    
    // Start ringing timer
    const timer = setInterval(() => {
      setRingingTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      // audio.pause();
      clearInterval(timer);
      setRingingTime(0);
    };
  }, [show]);

  if (!show || !call) return null;

  const isVideo = call.type === 'video';
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm"></div>
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 p-1 shadow-2xl transition-all">
          <div className="rounded-2xl bg-white p-8 text-center">
            {/* Incoming Call Animation */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-75"></div>
              <div className="absolute inset-4 rounded-full border-4 border-purple-500 animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
              <div className="relative w-32 h-32 mx-auto">
                {callerAvatar ? (
                  <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-4xl border-4 border-white shadow-lg">
                    {callerAvatar}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <UserIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Call Info */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {callerName || 'Unknown Caller'}
              </h3>
              <div className="flex items-center justify-center space-x-2 text-gray-600 mb-2">
                {isVideo ? (
                  <>
                    <VideoCameraIconSolid className="w-5 h-5 text-purple-600" />
                    <span>Incoming video call</span>
                  </>
                ) : (
                  <>
                    <PhoneIconSolid className="w-5 h-5 text-green-600" />
                    <span>Incoming voice call</span>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center text-sm text-gray-500">
                <SpeakerWaveIcon className="w-4 h-4 mr-1" />
                <span>Ringing • {formatTime(ringingTime)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-8">
              {/* Reject Button */}
              <button
                onClick={() => onReject(call.id)}
                className="group relative p-4 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                title="Decline call"
              >
                <PhoneXMarkIcon className="w-8 h-8 text-white" />
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs text-gray-600 whitespace-nowrap bg-white px-2 py-1 rounded shadow">
                    Decline
                  </span>
                </div>
              </button>

              {/* Accept Button */}
              <button
                onClick={() => onAccept(call.id, isVideo)}
                className={`group relative p-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                  isVideo 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                title={isVideo ? "Accept video call" : "Accept voice call"}
              >
                {isVideo ? (
                  <VideoCameraIcon className="w-8 h-8 text-white" />
                ) : (
                  <PhoneIcon className="w-8 h-8 text-white" />
                )}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs text-gray-600 whitespace-nowrap bg-white px-2 py-1 rounded shadow">
                    Accept
                  </span>
                </div>
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 text-xs text-gray-500">
              <p>CampusCare secure connection</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default IncomingCallModal;