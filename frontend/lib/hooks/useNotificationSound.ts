import { useState, useEffect, useCallback, useRef } from 'react';

export function useNotificationSound() {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load sound preference from localStorage on mount
  useEffect(() => {
    const storedPreference = localStorage.getItem('notificationSoundEnabled');
    if (storedPreference !== null) {
      setIsSoundEnabled(storedPreference === 'true');
    }
  }, []);

  // Save sound preference to localStorage when changed
  const toggleSound = useCallback((enabled: boolean) => {
    setIsSoundEnabled(enabled);
    localStorage.setItem('notificationSoundEnabled', String(enabled));
  }, []);

  // Initialize audio context on first user interaction
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Resume audio context if suspended (browser requirement)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  }, []);

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    // Check if sound is enabled
    if (!isSoundEnabled) {
      return;
    }

    // Check if page is visible (don't play if tab is in background)
    if (typeof document !== 'undefined' && document.hidden) {
      return;
    }

    try {
      const audioContext = initializeAudioContext();
      
      // Create oscillator for sound generation
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect oscillator to gain node to output
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure sound: 2-note ascending chime
      const now = audioContext.currentTime;
      
      // First note (880Hz - A5)
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      // Second note (1100Hz - C#6) - starts at 0.3s
      oscillator.frequency.setValueAtTime(1100, now + 0.3);
      gainNode.gain.setValueAtTime(0.3, now + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      // Start and stop oscillator
      oscillator.start(now);
      oscillator.stop(now + 0.8);
      
      // Cleanup after sound completes
      setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
      }, 1000);
      
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [isSoundEnabled, initializeAudioContext]);

  // Set up user interaction listener to initialize audio context
  useEffect(() => {
    const handleUserInteraction = () => {
      initializeAudioContext();
    };

    // Add event listeners for common user interactions
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [initializeAudioContext]);

  return {
    playNotificationSound,
    isSoundEnabled,
    toggleSound,
  };
}
