import React, { useEffect, useRef, useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import useVideoSecurity from '../hooks/useVideoSecurity';

const SimpleProtectedVideo = ({ 
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
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  
  const { backendUrl, getToken } = useContext(AppContext);
  const { securityMeasures, logSecurityEvent } = useVideoSecurity();

  // Handle video play/pause
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
        setShowPlayButton(false);
      } else {
        video.pause();
        setIsPlaying(false);
        setShowPlayButton(true);
      }
    }
  };

  // Fullscreen functionality
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
        logSecurityEvent('fullscreen_enter', { lectureId, src });
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        logSecurityEvent('fullscreen_exit', { lectureId, src });
      }).catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  };

  // Show/hide controls with timeout
  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000); // Hide controls after 3 seconds
    
    setControlsTimeout(timeout);
  };

  // Handle mouse movement to show controls
  const handleMouseMove = () => {
    showControlsTemporarily();
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // Apply security measures to container and video
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    
    if (container) {
      container.style.webkitUserSelect = 'none';
      container.style.userSelect = 'none';
      container.style.webkitTouchCallout = 'none';
    }

    if (video) {
      // Log video events for security monitoring
      const handlePlay = () => {
        logSecurityEvent('video_play', { lectureId, src });
        setIsPlaying(true);
        setShowPlayButton(false);
      };
      const handlePause = () => {
        logSecurityEvent('video_pause', { lectureId, src });
        setIsPlaying(false);
        setShowPlayButton(true);
      };
      const handleSeeking = () => logSecurityEvent('video_seek', { lectureId, src });
      const handleEnded = async () => {
        setIsPlaying(false);
        setShowPlayButton(true);
        // Reset video to beginning for easy rewatching
        video.currentTime = 0;
        
        // Auto-complete the lecture when video ends
        if (onMarkComplete && lectureId) {
          try {
            await onMarkComplete(lectureId);
            logSecurityEvent('auto_complete_on_end', { lectureId, src });
          } catch (error) {
            console.error('Failed to auto-complete lecture:', error);
          }
        }
      };
      
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('seeking', handleSeeking);
      video.addEventListener('ended', handleEnded);
      
      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('seeking', handleSeeking);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [src, lectureId, logSecurityEvent]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg"
        onContextMenu={securityMeasures.onContextMenu}
        onDragStart={securityMeasures.onDragStart}
        onKeyDown={securityMeasures.onKeyDown}
        tabIndex={0}
        style={{ 
          outline: 'none',
          userSelect: 'none',
          webkitUserSelect: 'none',
          webkitTouchCallout: 'none',
          backgroundColor: 'transparent'
        }}
      >
        <video
          ref={videoRef}
          className="w-full h-full cursor-pointer object-contain"
          src={src}
          disablePictureInPicture
          onContextMenu={securityMeasures.onContextMenu}
          onDragStart={securityMeasures.onDragStart}
          onClick={togglePlayPause}
          onMouseMove={handleMouseMove}
          style={{
            userSelect: 'none',
            webkitUserSelect: 'none',
            backgroundColor: 'transparent'
          }}
        >
          Your browser does not support the video tag.
        </video>
        
        {/* Play button overlay */}
        {showPlayButton && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlayPause}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
          >
            <div className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all shadow-lg">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <polygon points="8,5 19,12 8,19" fill="#374151" />
              </svg>
            </div>
          </div>
        )}

        {/* Fullscreen controls overlay */}
        {!showPlayButton && (showControls || isFullscreen) && (
          <div 
            className="absolute bottom-4 right-4 opacity-80 hover:opacity-100 transition-opacity"
            onMouseMove={handleMouseMove}
          >
            <button
              onClick={toggleFullscreen}
              className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-lg p-2 transition-all shadow-lg"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isFullscreen ? (
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                ) : (
                  <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8M3 16l6 6m-6-6v4.8M3 16h4.8M21 8l-6-6m6 6V3.2M21 8h-4.8M3 8l6-6m-6 6V3.2M3 8h4.8" />
                )}
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Lecture Title Display */}
      {playerData && (
        <div className='mt-4 mb-2'>
          <div className='flex justify-between items-center gap-4'>
            <h2 className='text-2xl font-bold text-gray-800 flex-1'>
              {playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}
            </h2>
            <div className='flex items-center gap-3'>
              {isCompleted ? (
                <div className='px-4 py-2 bg-green-600 text-white rounded font-medium flex items-center gap-2'>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  Completed
                </div>
              ) : (
                <div className='px-4 py-2 bg-gray-100 text-gray-600 rounded font-medium text-sm'>
                  Watch to complete
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleProtectedVideo;