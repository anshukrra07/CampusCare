// WebRTC compatibility and error handling utilities

export const checkWebRTCSupport = () => {
  const issues = [];
  
  // Check if WebRTC is supported
  if (!window.RTCPeerConnection) {
    issues.push('WebRTC is not supported in this browser');
  }
  
  // Check if getUserMedia is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    issues.push('Camera/microphone access is not supported in this browser');
  }
  
  // Check if running on HTTPS (required for WebRTC in production)
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    issues.push('WebRTC requires HTTPS connection');
  }
  
  return {
    isSupported: issues.length === 0,
    issues
  };
};

export const getMediaConstraints = (isVideo = false) => {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    video: isVideo ? {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user'
    } : false
  };
};

export const handleWebRTCError = (error) => {
  console.error('WebRTC Error:', error);
  
  switch (error.name) {
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera or microphone found. Please check your devices.';
    
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Camera or microphone is already in use by another application.';
    
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'Camera or microphone does not meet the requirements.';
    
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera or microphone access was denied. Please allow permissions and try again.';
    
    case 'TypeError':
      return 'Browser does not support the requested media configuration.';
    
    case 'AbortError':
      return 'Media access was aborted.';
    
    case 'InvalidStateError':
      return 'WebRTC connection is in an invalid state. Please try again.';
    
    case 'OperationError':
      return 'WebRTC operation failed. Please check your internet connection.';
    
    default:
      if (error.message) {
        return `WebRTC Error: ${error.message}`;
      }
      return 'An unknown WebRTC error occurred. Please try again.';
  }
};

export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';
  
  if (userAgent.indexOf('Chrome') > -1) {
    browser = 'Chrome';
    version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Safari') > -1) {
    browser = 'Safari';
    version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Edge') > -1) {
    browser = 'Edge';
    version = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }
  
  return { browser, version };
};

export const getConnectionQualityInfo = (peerConnection) => {
  if (!peerConnection) return null;
  
  return peerConnection.getStats().then(stats => {
    let info = {
      bytesReceived: 0,
      bytesSent: 0,
      packetsLost: 0,
      packetsReceived: 0,
      roundTripTime: 0,
      bandwidth: 0
    };
    
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
        info.bytesReceived += report.bytesReceived || 0;
        info.packetsReceived += report.packetsReceived || 0;
        info.packetsLost += report.packetsLost || 0;
      } else if (report.type === 'outbound-rtp' && report.mediaType === 'audio') {
        info.bytesSent += report.bytesSent || 0;
      } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        info.roundTripTime = report.currentRoundTripTime || 0;
      }
    });
    
    return info;
  }).catch(error => {
    console.warn('Could not get connection stats:', error);
    return null;
  });
};

export const testMediaDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    const videoInputs = devices.filter(device => device.kind === 'videoinput');
    const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
    
    return {
      hasAudioInput: audioInputs.length > 0,
      hasVideoInput: videoInputs.length > 0,
      hasAudioOutput: audioOutputs.length > 0,
      devices: {
        audioInputs,
        videoInputs,
        audioOutputs
      }
    };
  } catch (error) {
    console.error('Error enumerating devices:', error);
    return {
      hasAudioInput: false,
      hasVideoInput: false,
      hasAudioOutput: false,
      devices: {
        audioInputs: [],
        videoInputs: [],
        audioOutputs: []
      },
      error: handleWebRTCError(error)
    };
  }
};

export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const createFallbackMessage = (webrtcSupport, deviceTest) => {
  if (!webrtcSupport.isSupported) {
    return {
      title: 'Browser Not Supported',
      message: 'Your browser does not support voice/video calls. Please try using a modern browser like Chrome, Firefox, or Safari.',
      suggestions: [
        'Update your browser to the latest version',
        'Try using Google Chrome or Mozilla Firefox',
        'Use the chat feature instead'
      ]
    };
  }
  
  if (deviceTest?.error) {
    return {
      title: 'Device Access Issue',
      message: deviceTest.error,
      suggestions: [
        'Check that your camera and microphone are connected',
        'Allow camera/microphone permissions when prompted',
        'Close other applications that might be using your camera/microphone',
        'Try refreshing the page and allowing permissions again'
      ]
    };
  }
  
  if (!deviceTest?.hasAudioInput) {
    return {
      title: 'No Microphone Detected',
      message: 'No microphone was found. Voice calls require a microphone.',
      suggestions: [
        'Connect a microphone or headset',
        'Check your system audio settings',
        'Use the chat feature instead'
      ]
    };
  }
  
  return null;
};