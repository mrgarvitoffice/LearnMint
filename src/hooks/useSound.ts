
"use client";

import { useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface SoundOptions {
  volume?: number;
  priority?: 'essential' | 'incidental';
}

// Global cache to store a single Audio element instance per sound file.
// This is crucial for performance and reliability, especially on mobile.
const audioCache = new Map<string, { audio: HTMLAudioElement; hasError: boolean }>();

export function useSound(soundPath: string, options: SoundOptions = {}) {
  const { volume = 0.5 } = options;
  const { soundMode } = useSettings();

  const playSound = useCallback(() => {
    // UI click sounds are considered "incidental" and will only play in 'full' mode.
    // Critical sounds (like correct/incorrect answers) are handled separately where they are used.
    if (soundMode !== 'full') {
      return;
    }

    let cacheEntry = audioCache.get(soundPath);

    if (!cacheEntry) {
      if (typeof window === 'undefined') return; // Cannot create Audio element on server
      
      const audio = new Audio(soundPath);
      audio.volume = volume;
      cacheEntry = { audio, hasError: false };
      audioCache.set(soundPath, cacheEntry);

      audio.addEventListener('error', () => {
        console.warn(`LearnMint Sound System: Failed to load sound from "${soundPath}". Playback for this sound is now disabled.`);
        const entry = audioCache.get(soundPath);
        if (entry) {
          entry.hasError = true;
        }
      });
    }

    if (cacheEntry.hasError) return;

    cacheEntry.audio.currentTime = 0;
    cacheEntry.audio.play().catch(playError => {
      // Don't log 'AbortError' which happens on fast navigations.
      if (playError.name !== 'AbortError' && cacheEntry && !cacheEntry.hasError) {
        console.warn(`LearnMint Sound System: Playback failed for "${soundPath}". Error: ${playError.message}`);
        cacheEntry.hasError = true; // Prevent further attempts
      }
    });
  }, [soundMode, soundPath, volume]);
  
  return { playSound };
}
