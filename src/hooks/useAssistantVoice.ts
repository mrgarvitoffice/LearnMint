
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTTS } from '@/hooks/useTTS';
import { useToast } from './use-toast';
import { useSettings } from '@/contexts/SettingsContext';

export type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface AssistantVoiceProps {
  onCommand: (command: string) => Promise<{ verbalResponse: string, action: () => void } | undefined>;
}

export function useAssistantVoice({ onCommand }: AssistantVoiceProps) {
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false);
  
  const { mode } = useSettings();
  const { speak, isSpeaking, cancelTTS } = useTTS();
  const { toast } = useToast();
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isStoppingManuallyRef = useRef(false);
  const commandProcessingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setBrowserSupportsSpeechRecognition(
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }, []);

  const processAndRespond = useCallback(async (transcript: string) => {
    if (!transcript.trim()) {
      setStatus('listening');
      return;
    }
    
    setStatus('processing');
    
    const result = await onCommand(transcript);
    
    if (result) {
      setStatus('speaking');
      speak(result.verbalResponse, {
        priority: 'manual',
        onEnd: () => {
          result.action();
          setStatus('listening');
        },
      });
    } else {
      setStatus('listening');
    }
  }, [onCommand, speak]);
  
  const startRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !isAssistantActive) return;

    recognition.onstart = () => {
      setStatus('listening');
      isStoppingManuallyRef.current = false;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.error('Speech recognition error:', event.error);
          toast({ title: 'Assistant Error', description: `Voice recognition failed: ${event.error}.`, variant: 'destructive' });
      }
      // onend will handle restart if needed
    };
    
    recognition.onend = () => {
        if (isAssistantActive && !isStoppingManuallyRef.current) {
            startRecognition();
        } else {
            setStatus('idle');
        }
    };
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Clear any existing timeout because the user is still speaking.
      if (commandProcessingTimeoutRef.current) {
        clearTimeout(commandProcessingTimeoutRef.current);
      }

      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      
      finalTranscript = finalTranscript.toLowerCase().trim();

      if (!finalTranscript || isSpeaking) return;
      
      const wakeWord = mode === 'jarvis' ? 'jarvis' : /alya|alia/.test(finalTranscript) ? (finalTranscript.includes('alia') ? 'alia' : 'alya') : '';
      const wakeWordIndex = wakeWord ? finalTranscript.lastIndexOf(wakeWord) : -1;
      
      if (wakeWordIndex !== -1) {
          const command = finalTranscript.substring(wakeWordIndex).trim();
          
          // Set a timeout to process the command after a short pause (e.g., 1 second).
          // This prevents processing partial commands.
          commandProcessingTimeoutRef.current = setTimeout(() => {
            processAndRespond(command);
          }, 1000); // 1-second delay
      }
    };
    
    try {
        recognition.start();
    } catch (e) {
      if ((e as DOMException).name !== 'InvalidStateError') {
          console.error("Could not start recognition:", e);
      }
    }
  }, [isAssistantActive, isSpeaking, mode, processAndRespond, toast]);


  useEffect(() => {
    if (browserSupportsSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        if (commandProcessingTimeoutRef.current) {
          clearTimeout(commandProcessingTimeoutRef.current);
        }
      };
    }
  }, [browserSupportsSpeechRecognition]);

  const toggleAssistant = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      toast({ title: "Unsupported Browser", description: "Voice recognition requires a modern browser like Chrome or Edge.", variant: "destructive" });
      return;
    }
    
    setIsAssistantActive(prev => {
        const nextState = !prev;
        if (nextState) {
            isStoppingManuallyRef.current = false;
        } else {
            isStoppingManuallyRef.current = true;
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (commandProcessingTimeoutRef.current) {
              clearTimeout(commandProcessingTimeoutRef.current);
            }
            cancelTTS();
            setStatus('idle');
        }
        return nextState;
    });
  }, [browserSupportsSpeechRecognition, cancelTTS, toast]);

  useEffect(() => {
    if(isAssistantActive) {
        startRecognition();
    }
  }, [isAssistantActive, startRecognition]);
  
  return { status, toggleAssistant, browserSupportsSpeechRecognition, isAssistantActive };
}
