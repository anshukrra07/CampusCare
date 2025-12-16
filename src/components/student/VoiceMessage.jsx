import React, { useState, useRef, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const VoiceMessage = ({ audioUrl, duration, isUser, timestamp, transcript, emotion }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (audio.currentTime && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      } else if (duration && isFinite(duration)) {
        // Fallback to provided duration prop
        setAudioDuration(duration);
      }
    };

    const handleEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      // Reset states when loading starts
      setCurrentTime(0);
      setIsPlaying(false);
    };

    const handleError = (e) => {
      console.error('Audio loading error:', e);
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('error', handleError);
    };
  }, [duration]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress || !audioDuration || !isFinite(audioDuration)) return;

    const rect = progress.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * audioDuration;
    
    if (isFinite(newTime)) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    // Handle invalid time values
    if (!time || isNaN(time) || !isFinite(time)) {
      return '0:00';
    }
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (audioDuration && isFinite(audioDuration) && audioDuration > 0) 
    ? Math.min((currentTime / audioDuration) * 100, 100) 
    : 0;

  return (
    <>
      <div className={`flex items-center space-x-3 p-3 rounded-2xl max-w-xs ${
        isUser 
          ? 'bg-indigo-500 text-white rounded-br-sm' 
          : 'bg-white border rounded-tl-sm'
      }`}>
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className={`p-2 rounded-full transition-colors ${
            isUser
              ? 'bg-white/20 hover:bg-white/30 text-white'
              : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
          }`}
        >
          {isPlaying ? (
            <PauseIcon className="h-4 w-4" />
          ) : (
            <PlayIcon className="h-4 w-4" />
          )}
        </button>

        {/* Waveform/Progress Area */}
        <div className="flex-1 space-y-2">
          {/* Visual waveform representation */}
          <div className="flex items-center space-x-1 h-6">
            {Array.from({ length: 20 }).map((_, index) => {
              const isActive = progressPercentage > (index / 20) * 100;
              const height = Math.random() * 16 + 8; // Random heights for visual effect
              
              return (
                <div
                  key={index}
                  className={`w-1 rounded-full transition-colors ${
                    isActive
                      ? isUser ? 'bg-white' : 'bg-indigo-500'
                      : isUser ? 'bg-white/30' : 'bg-gray-300'
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>

          {/* Progress Bar */}
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="w-full h-1 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
          >
            <div
              className={`h-full transition-all duration-100 ${
                isUser ? 'bg-white' : 'bg-indigo-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Time Display */}
          <div className={`flex items-center justify-between text-xs ${
            isUser ? 'text-white/80' : 'text-gray-500'
          }`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>

        {/* Voice Icon */}
        <div className={`p-1 ${
          isUser ? 'text-white/60' : 'text-gray-400'
        }`}>
          <SpeakerWaveIcon className="h-4 w-4" />
        </div>
      </div>
      
      {/* Optional: Show transcript below voice message */}
      {transcript && (
        <div className={`mt-2 text-xs p-2 rounded-lg ${
          isUser 
            ? 'bg-indigo-100 text-indigo-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          <div className="font-medium mb-1">Transcript:</div>
          <div>{transcript}</div>
          {emotion && (
            <div className="mt-1 text-xs opacity-75">
              Emotion: {emotion.emotion} ({emotion.intensity}%)
            </div>
          )}
          {/* Show emotion model if available */}
          {emotion && emotion.model && (
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                💭 {emotion.model}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default VoiceMessage;