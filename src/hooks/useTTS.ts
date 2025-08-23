
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { APP_LANGUAGES } from '@/lib/constants';

type AssistantMode = 'jarvis' | 'alya' | 'gojo' | 'helper' | 'coder' | 'holo';

interface SpeakOptions {
  priority?: 'manual' | 'essential' | 'optional';
  lang?: string;
  onEnd?: () => void;
}

interface TTSHook {
  speak: (text: string, options?: SpeakOptions) => void;
  pauseTTS: () => void;
  resumeTTS: () => void;
  cancelTTS: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isLoading: boolean;
  setVoicePreference: (mode: AssistantMode) => void;
}

let synth: SpeechSynthesis | null = null;
let voices: SpeechSynthesisVoice[] = [];
let voicesLoadedPromise: Promise<void> | null = null;

const loadVoices = () => {
    if (typeof window === 'undefined') return Promise.resolve();
    if (!synth) synth = window.speechSynthesis;
    if (!synth) return Promise.resolve();

    if (voicesLoadedPromise) return voicesLoadedPromise;

    voicesLoadedPromise = new Promise(resolve => {
        const getVoices = () => {
            const availableVoices = synth!.getVoices();
            if (availableVoices.length > 0) {
                voices = availableVoices;
                resolve();
            }
        };
        // Voices might already be loaded
        if (synth.getVoices().length > 0) {
            getVoices();
        } else if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = getVoices;
        } else {
           // Fallback for browsers that don't fire onvoiceschanged reliably
           setTimeout(getVoices, 250);
        }
    });
    return voicesLoadedPromise;
};

// Pre-warm the voices on script load
loadVoices();

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(voices.length === 0);
  const [voicePreference, setVoicePreference] = useState<AssistantMode>('jarvis');
  
  const { soundMode, appLanguage, mode: assistantMode } = useSettings();
  
  const currentOnEndRef = useRef<(() => void) | undefined>();

  useEffect(() => {
    loadVoices().then(() => setIsLoading(false));

    if (!synth) return;

    // Use a simple polling mechanism for state updates, as onstart/onend can be unreliable across browsers.
    const interval = setInterval(() => {
        if(synth) {
            setIsSpeaking(synth.speaking);
            setIsPaused(synth.paused);
        }
    }, 100);

    return () => {
      clearInterval(interval);
      if (synth?.speaking) synth.cancel();
    };
  }, []);

  const speak = useCallback(async (text: string, options: SpeakOptions = {}) => {
    if (!text.trim() || !synth) {
      options.onEnd?.();
      return;
    }
    
    // Wait for voices to be loaded before proceeding.
    await loadVoices();
    setIsLoading(false);

    const { priority = 'optional', lang = appLanguage, onEnd } = options;
    currentOnEndRef.current = onEnd;

    if (soundMode === 'muted' && priority !== 'manual') {
      currentOnEndRef.current?.();
      return;
    }
    if (soundMode === 'essential' && priority === 'optional') {
      currentOnEndRef.current?.();
      return;
    }

    // Cancel any ongoing speech before starting a new one.
    if (synth.speaking) {
        synth.cancel();
    }
    
    // Give cancel a moment to process before speaking again. This is crucial for reliability.
    setTimeout(() => {
        if (!synth) return;
        const utterance = new SpeechSynthesisUtterance(text);
        const bcp47Lang = APP_LANGUAGES.find(l => l.value === lang)?.bcp47 || 'en-US';
        utterance.lang = bcp47Lang;
        
        const potentialVoices = voices.filter(v => v.lang.startsWith(bcp47Lang.split('-')[0]) && !v.localService);
        let selectedVoice: SpeechSynthesisVoice | null = null;
        
        const currentMode = voicePreference || assistantMode;

        if (currentMode === 'helper' || currentMode === 'alya' || currentMode === 'holo') {
          selectedVoice = potentialVoices.find(v => v.name.toLowerCase().includes('female')) || potentialVoices.find(v => v.name.toLowerCase().includes('zira')) || potentialVoices.find(v => !v.name.toLowerCase().includes('male')) || null;
        } else { // 'gojo', 'coder', 'jarvis' get male voices
          selectedVoice = potentialVoices.find(v => v.name.toLowerCase().includes('male')) || potentialVoices.find(v => v.name.toLowerCase().includes('david')) || null;
        }
        
        if (!selectedVoice) selectedVoice = potentialVoices[0] || null;
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith(lang)) || null;

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        } else {
          console.warn(`No suitable voice found for language '${lang}'. Using browser default.`);
        }
        
        if (currentMode === 'alya') {
          utterance.pitch = 1.2;
          utterance.rate = 1.1;
        }

        utterance.onend = () => {
            if (currentOnEndRef.current) {
                currentOnEndRef.current();
                currentOnEndRef.current = undefined; // Clear after execution
            }
        };
        utterance.onerror = (event) => {
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
              console.warn("SpeechSynthesisUtterance.onerror", event);
          }
          if (currentOnEndRef.current) {
             currentOnEndRef.current();
             currentOnEndRef.current = undefined; // Clear after execution
          }
        };
        
        synth!.speak(utterance);
    }, 100);

  }, [appLanguage, soundMode, assistantMode, voicePreference]);

  const pauseTTS = useCallback(() => {
    if (synth?.speaking && !synth.paused) synth.pause();
  }, []);

  const resumeTTS = useCallback(() => {
    if (synth?.paused) synth.resume();
  }, []);

  const cancelTTS = useCallback(() => {
    if (synth) {
        // Clear the onEnd callback reference immediately to prevent it from firing on cancel.
        currentOnEndRef.current = undefined;
        synth.cancel();
    }
  }, []);

  return { speak, pauseTTS, resumeTTS, cancelTTS, isSpeaking, isPaused, isLoading, setVoicePreference };
}
