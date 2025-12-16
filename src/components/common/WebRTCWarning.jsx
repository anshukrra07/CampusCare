import React from 'react';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const WebRTCWarning = ({ webrtcSupport, deviceCapabilities, onDismiss }) => {
  if (!webrtcSupport || !deviceCapabilities) {
    return null;
  }

  // Don't show warning if everything is supported
  if (webrtcSupport.isSupported && deviceCapabilities.hasAudioInput && !deviceCapabilities.error) {
    return null;
  }

  const getWarningLevel = () => {
    if (!webrtcSupport.isSupported) return 'error';
    if (deviceCapabilities.error || !deviceCapabilities.hasAudioInput) return 'warning';
    return 'info';
  };

  const getWarningColor = () => {
    const level = getWarningLevel();
    switch (level) {
      case 'error': return 'red';
      case 'warning': return 'yellow';
      default: return 'blue';
    }
  };

  const getWarningIcon = () => {
    const level = getWarningLevel();
    const color = getWarningColor();
    const iconClass = `w-5 h-5 text-${color}-600`;

    switch (level) {
      case 'error':
      case 'warning':
        return <ExclamationTriangleIcon className={iconClass} />;
      default:
        return <InformationCircleIcon className={iconClass} />;
    }
  };

  const getTitle = () => {
    if (!webrtcSupport.isSupported) {
      return 'Voice/Video Calls Not Supported';
    }
    if (deviceCapabilities.error) {
      return 'Device Access Issue';
    }
    if (!deviceCapabilities.hasAudioInput) {
      return 'No Microphone Detected';
    }
    return 'Call Feature Notice';
  };

  const getMessage = () => {
    if (!webrtcSupport.isSupported) {
      return 'Your browser does not support voice and video calls. You can still use the chat feature to communicate with counselors.';
    }
    if (deviceCapabilities.error) {
      return deviceCapabilities.error;
    }
    if (!deviceCapabilities.hasAudioInput) {
      return 'No microphone was detected. Voice calls require a microphone, but you can still use chat and video calls.';
    }
    return 'Some call features may not work as expected.';
  };

  const getSuggestions = () => {
    if (!webrtcSupport.isSupported) {
      return [
        'Update your browser to the latest version',
        'Try using Google Chrome, Mozilla Firefox, or Safari',
        'Use the chat feature for communication'
      ];
    }
    if (deviceCapabilities.error) {
      return [
        'Allow camera/microphone permissions when prompted',
        'Check that your devices are connected and not in use',
        'Try refreshing the page',
        'Check your browser settings for media permissions'
      ];
    }
    if (!deviceCapabilities.hasAudioInput) {
      return [
        'Connect a microphone or headset',
        'Check your system audio settings',
        'Use chat or video calls instead'
      ];
    }
    return [];
  };

  const color = getWarningColor();

  return (
    <div className={`border border-${color}-200 bg-${color}-50 rounded-lg p-4 mb-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getWarningIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium text-${color}-800`}>
            {getTitle()}
          </h3>
          
          <div className={`mt-2 text-sm text-${color}-700`}>
            <p>{getMessage()}</p>
            
            {getSuggestions().length > 0 && (
              <div className="mt-3">
                <p className="font-medium">Suggestions:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {getSuggestions().map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Browser and device info */}
            <div className="mt-3 text-xs opacity-75">
              <p>
                WebRTC Support: {webrtcSupport.isSupported ? '✅ Yes' : '❌ No'} • 
                Microphone: {deviceCapabilities.hasAudioInput ? '✅ Detected' : '❌ Not found'} • 
                Camera: {deviceCapabilities.hasVideoInput ? '✅ Detected' : '❌ Not found'}
              </p>
            </div>
          </div>
        </div>
        
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onDismiss}
              className={`inline-flex rounded-md bg-${color}-50 p-1.5 text-${color}-500 hover:bg-${color}-100 focus:outline-none focus:ring-2 focus:ring-${color}-600 focus:ring-offset-2 focus:ring-offset-${color}-50`}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebRTCWarning;