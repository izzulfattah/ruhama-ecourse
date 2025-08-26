import { useState, useEffect, useCallback, useContext } from 'react';
import { AppContext } from '../context/AppContext';

const useVideoSecurity = () => {
  const [isSecurityActive, setIsSecurityActive] = useState(false);
  const [suspiciousActivity, setSuspiciousActivity] = useState(0);
  const [sessionToken, setSessionToken] = useState('');
  const [videoTokens, setVideoTokens] = useState(new Map());
  
  const { backendUrl, getToken } = useContext(AppContext);

  // Initialize security session
  useEffect(() => {
    const initSecurity = () => {
      const token = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionToken(token);
      setIsSecurityActive(true);
      logSecurityEvent('security_session_start', { sessionToken: token });
    };

    initSecurity();

    // Cleanup on unmount
    return () => {
      logSecurityEvent('security_session_end', { sessionToken });
    };
  }, []);

  // Log security events
  const logSecurityEvent = useCallback(async (event, details = {}) => {
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
          action: 'security_event',
          details: {
            event,
            ...details,
            timestamp: new Date().toISOString(),
            sessionToken,
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        })
      });
    } catch (error) {
      console.warn('Security logging failed:', error);
    }
  }, [backendUrl, getToken, sessionToken]);

  // Generate secure video token
  const generateVideoToken = useCallback(async (courseId, lectureId) => {
    try {
      const token = await getToken?.();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${backendUrl}/api/user/generate-video-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseId, lectureId })
      });

      const data = await response.json();
      if (data.success) {
        const key = `${courseId}_${lectureId}`;
        setVideoTokens(prev => new Map(prev.set(key, {
          token: data.videoToken,
          expiresAt: data.expiresAt
        })));
        return data.videoToken;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to generate video token:', error);
      throw error;
    }
  }, [backendUrl, getToken]);

  // Validate video token
  const validateVideoToken = useCallback((courseId, lectureId) => {
    const key = `${courseId}_${lectureId}`;
    const tokenData = videoTokens.get(key);
    
    if (!tokenData) return false;
    if (Date.now() > tokenData.expiresAt) {
      videoTokens.delete(key);
      return false;
    }
    
    return true;
  }, [videoTokens]);

  // Handle suspicious activity
  const reportSuspiciousActivity = useCallback((type, details = {}) => {
    setSuspiciousActivity(prev => {
      const newCount = prev + 1;
      logSecurityEvent('suspicious_activity', { 
        type, 
        count: newCount,
        ...details 
      });
      
      // Escalate if too many suspicious activities
      if (newCount > 5) {
        logSecurityEvent('security_threat_detected', { 
          totalSuspiciousActivities: newCount,
          type 
        });
      }
      
      return newCount;
    });
  }, [logSecurityEvent]);

  // Security measures
  const securityMeasures = {
    // Disable right-click
    onContextMenu: useCallback((e) => {
      e.preventDefault();
      reportSuspiciousActivity('right_click_attempt');
      return false;
    }, [reportSuspiciousActivity]),

    // Prevent drag and drop
    onDragStart: useCallback((e) => {
      e.preventDefault();
      reportSuspiciousActivity('drag_attempt');
      return false;
    }, [reportSuspiciousActivity]),

    // Handle keyboard shortcuts
    onKeyDown: useCallback((e) => {
      const forbiddenKeys = [
        { key: 's', ctrl: true }, // Ctrl+S
        { key: 'a', ctrl: true }, // Ctrl+A
        { key: 'u', ctrl: true }, // Ctrl+U
        { key: 'i', ctrl: true, shift: true }, // Ctrl+Shift+I
        { key: 'j', ctrl: true, shift: true }, // Ctrl+Shift+J
        { key: 'c', ctrl: true, shift: true }, // Ctrl+Shift+C
        { key: 'k', ctrl: true, shift: true }, // Ctrl+Shift+K
        { key: 'p', ctrl: true }, // Ctrl+P
        { key: 'F12' }, // F12
      ];

      const currentKey = {
        key: e.key,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey
      };

      const isForbidden = forbiddenKeys.some(forbidden => {
        return forbidden.key === currentKey.key && 
               (forbidden.ctrl === undefined || forbidden.ctrl === currentKey.ctrl) &&
               (forbidden.shift === undefined || forbidden.shift === currentKey.shift);
      });

      if (isForbidden) {
        e.preventDefault();
        reportSuspiciousActivity('forbidden_shortcut', { 
          key: e.key, 
          ctrlKey: e.ctrlKey, 
          shiftKey: e.shiftKey 
        });
        return false;
      }
    }, [reportSuspiciousActivity]),

    // Monitor DevTools
    onDevToolsDetected: useCallback(() => {
      reportSuspiciousActivity('devtools_detected');
    }, [reportSuspiciousActivity])
  };

  // DevTools detection
  useEffect(() => {
    let devToolsOpen = false;
    const threshold = 160;

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if ((widthThreshold || heightThreshold) && !devToolsOpen) {
        devToolsOpen = true;
        securityMeasures.onDevToolsDetected();
      } else if (!(widthThreshold || heightThreshold) && devToolsOpen) {
        devToolsOpen = false;
      }
    };

    const interval = setInterval(checkDevTools, 1000);
    return () => clearInterval(interval);
  }, [securityMeasures.onDevToolsDetected]);

  return {
    isSecurityActive,
    suspiciousActivity,
    sessionToken,
    generateVideoToken,
    validateVideoToken,
    reportSuspiciousActivity,
    logSecurityEvent,
    securityMeasures
  };
};

export default useVideoSecurity;