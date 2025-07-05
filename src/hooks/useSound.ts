
"use client";

import { useCallback, useEffect, useState, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface SoundOptions {
  volume?: number;
  priority?: 'essential' | 'incidental';
}

export function useSound(soundPath: string, options: SoundOptions = {}) {
  // 'incidental' sounds (like UI clicks) only play in 'full' mode.
  // 'essential' sounds (like actions) play in 'full' and 'essential' modes.
  const { volume = 0.5, priority = 'incidental' } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false); 
  const { soundMode } = useSettings();

  useEffect(() => {
    let currentAudio: HTMLAudioElement;

    const specificErrorHandler = () => {
      console.warn(
        `LearnMint Sound System: Failed to load sound from "${soundPath}".\n` +
        `This usually means the file is missing from the 'public/sounds/' directory or the path is incorrect.\n` +
        `Please check that the file exists and the path matches exactly.\n` +
        `Playback for this specific sound will be disabled.`
      );
      setHasLoadError(true);
    };

    if (typeof window !== 'undefined') {
      setHasLoadError(false); 

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      currentAudio = audioRef.current;
      currentAudio.volume = volume;

      const desiredSrc = new URL(soundPath, window.location.origin).href;
      if (currentAudio.src !== desiredSrc) {
        currentAudio.src = soundPath;
        currentAudio.load();
      }

      currentAudio.removeEventListener('error', specificErrorHandler);
      currentAudio.addEventListener('error', specificErrorHandler);
    }

    return () => {
      if (currentAudio) { 
        currentAudio.removeEventListener('error', specificErrorHandler);
      }
    };
  }, [soundPath, volume]);

  const playSound = useCallback(() => {
    // 'muted': no sounds play.
    if (soundMode === 'muted') {
      return;
    }
    
    // 'essential': only sounds with 'essential' priority play.
    if (soundMode === 'essential' && priority === 'incidental') {
      return;
    }
    // 'full': all sounds play (no check needed).

    if (hasLoadError || !audioRef.current) {
      return;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(playError => {
      if (playError.name !== 'AbortError' && !hasLoadError) {
         console.warn(
          `LearnMint Sound System: Playback failed for "${soundPath}".\n`+
          `Error: ${playError.name} - ${playError.message}.\n`+
          `This can happen if the browser blocks autoplay.`
         );
         setHasLoadError(true);
      }
    });
    
  }, [soundMode, priority, hasLoadError, soundPath]);
  
  return { 
    playSound
  };
}
