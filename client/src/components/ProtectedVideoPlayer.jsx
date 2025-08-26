import React, { useEffect, useRef, useState, useContext } from 'react';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import useVideoSecurity from '../hooks/useVideoSecurity';

const ProtectedVideoPlayer = ({ 
  src, 
  className = "", 
  onMarkComplete = null, 
  isCompleted = false,
  lectureId = null,
  playerData = null
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [suspiciousActivity, setSuspiciousActivity] = useState(0);
  
  const { backendUrl, getToken } = useContext(AppContext);
  const { securityMeasures, reportSuspiciousActivity } = useVideoSecurity();

  // Generate session token for this video session
  useEffect(() => {
    const generateSessionToken = () => {
      const token = `vp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionToken(token);
      logActivity('session_start', { token, src });
    };
    generateSessionToken();
    
    return () => {
      logActivity('session_end', { token: sessionToken });
    };
  }, [src]);

  // Activity logging function
  const logActivity = async (action, details = {}) => {
    try {
      const token = await getToken?.();
      if (!token) return;

      await fetch(`${backendUrl}/api/user/log-video-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          details: {
            ...details,
            sessionToken,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        })
      });
    } catch (error) {
      console.warn('Activity logging failed:', error);
    }
  };

  // Detect suspicious activity
  const handleSuspiciousActivity = (type, details = {}) => {
    setSuspiciousActivity(prev => prev + 1);
    logActivity('suspicious_activity', { type, count: suspiciousActivity + 1, ...details });
    
    if (suspiciousActivity > 5) {
      toast.warning('Suspicious activity detected. Video access may be restricted.');
      logActivity('suspicious_threshold_exceeded', { count: suspiciousActivity });
    }
  };


  // Monitor rapid seeking behavior
  const lastSeekTime = useRef(0);
  const seekCount = useRef(0);
  
  const handleSeek = () => {
    const now = Date.now();
    if (now - lastSeekTime.current < 1000) {
      seekCount.current++;
      if (seekCount.current > 5) {
        handleSuspiciousActivity('rapid_seeking', { seekCount: seekCount.current });
      }
    } else {
      seekCount.current = 0;
    }
    lastSeekTime.current = now;
    logActivity('video_seek', { time: currentTime });
  };

  // Video event handlers
  const handlePlay = () => {
    setIsPlaying(true);
    logActivity('video_play', { time: currentTime });
  };

  const handlePause = () => {
    setIsPlaying(false);
    logActivity('video_pause', { time: currentTime });
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime;
      setCurrentTime(newTime);
      
      // Check for unusual playback patterns
      const timeDiff = Math.abs(newTime - currentTime);
      if (timeDiff > 5 && currentTime > 0) {
        handleSeek();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      logActivity('video_loaded', { duration: videoRef.current.duration });
    }
  };

  const handleVolumeChange = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  };

  // Control functions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeekClick = (e) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      videoRef.current.currentTime = newTime;
      handleSeek();
    }
  };

  const handleVolumeClick = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.volume = Math.max(0, Math.min(1, percent));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
      logActivity('fullscreen_enter');
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
      logActivity('fullscreen_exit');
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Disable selection and context menu on container
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.style.webkitUserSelect = 'none';
      container.style.userSelect = 'none';
      container.style.webkitTouchCallout = 'none';
    }
  }, []);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black ${className}`}
      onContextMenu={securityMeasures.onContextMenu}
      onDragStart={securityMeasures.onDragStart}
      onKeyDown={securityMeasures.onKeyDown}
      tabIndex={0}
      style={{ 
        outline: 'none',
        userSelect: 'none',
        webkitUserSelect: 'none',
        webkitTouchCallout: 'none'
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={src}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onVolumeChange={handleVolumeChange}
        onContextMenu={securityMeasures.onContextMenu}
        onDragStart={securityMeasures.onDragStart}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          webkitUserSelect: 'none'
        }}
      />

      {/* Custom Controls Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/50 via-transparent to-black/30 opacity-0 hover:opacity-100 transition-opacity duration-300">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center p-4">
          {playerData && (
            <div className="text-white text-sm font-medium">
              {playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}
            </div>
          )}
          <div className="flex gap-2">
            {onMarkComplete && (
              <button
                onClick={() => onMarkComplete(lectureId)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  isCompleted 
                    ? 'bg-green-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isCompleted ? 'Completed' : 'Mark Complete'}
              </button>
            )}
          </div>
        </div>

        {/* Center Play Button */}
        <div className="flex justify-center items-center">
          <button
            onClick={togglePlay}
            className="bg-white/20 hover:bg-white/30 rounded-full p-4 transition-colors"
          >
            <div className={`w-6 h-6 ${isPlaying ? 'pause-icon' : 'play-icon'}`}>
              {isPlaying ? (
                <div className="flex gap-1">
                  <div className="w-1 h-6 bg-white"></div>
                  <div className="w-1 h-6 bg-white"></div>
                </div>
              ) : (
                <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[6px] border-y-transparent ml-1"></div>
              )}
            </div>
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 space-y-2">
          {/* Progress Bar */}
          <div 
            className="relative w-full h-1 bg-white/30 rounded-full cursor-pointer"
            onClick={handleSeekClick}
          >
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay} 
                className="hover:text-blue-400 transition-colors p-1 rounded hover:bg-white/10"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="3" y="2" width="3" height="12" rx="1"/>
                    <rect x="10" y="2" width="3" height="12" rx="1"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 2l10 6-10 6V2z"/>
                  </svg>
                )}
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleMute} 
                  className="hover:text-blue-400 transition-colors p-1 rounded hover:bg-white/10"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1a1 1 0 0 1 .5.134L12 3.5H14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H12l-3.5 2.366A1 1 0 0 1 8 15V1zM5.707 6.293a1 1 0 0 0-1.414 1.414L6.586 10l-2.293 2.293a1 1 0 1 0 1.414 1.414L8 11.414l2.293 2.293a1 1 0 0 0 1.414-1.414L9.414 10l2.293-2.293a1 1 0 0 0-1.414-1.414L8 8.586 5.707 6.293z"/>
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1a1 1 0 0 1 .5.134L12 3.5H14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H12l-3.5 2.366A1 1 0 0 1 8 15V1z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1a1 1 0 0 1 .5.134L12 3.5H14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H12l-3.5 2.366A1 1 0 0 1 8 15V1z"/>
                      <path d="M15.5 8a7.5 7.5 0 0 1-2.072 5.136l-.707-.707A6.5 6.5 0 0 0 14.5 8a6.5 6.5 0 0 0-1.779-4.429l.707-.707A7.5 7.5 0 0 1 15.5 8z"/>
                    </svg>
                  )}
                </button>
                <div 
                  className="w-20 h-2 bg-white/30 rounded-full cursor-pointer hover:bg-white/40 transition-colors"
                  onClick={handleVolumeClick}
                  title="Volume"
                >
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-150"
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={toggleFullscreen}
                className="hover:text-blue-400 transition-colors p-1 rounded hover:bg-white/10"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  {isFullscreen ? (
                    <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zM10.5 16a.5.5 0 0 1-.5-.5v-4A1.5 1.5 0 0 1 11.5 10h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-.5.5z"/>
                  ) : (
                    <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay to prevent direct video access */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ 
          background: 'transparent',
          userSelect: 'none',
          webkitUserSelect: 'none'
        }}
      ></div>
    </div>
  );
};

export default ProtectedVideoPlayer;