
"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { UserGoal } from '@/lib/types';

export type SoundMode = 'full' | 'essential' | 'muted';
export type FontSize = 'small' | 'normal' | 'large';
export type AssistantMode = 'jarvis' | 'alya';

interface SettingsContextType {
  soundMode: SoundMode;
  setSoundMode: (mode: SoundMode) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  appLanguage: string;
  setAppLanguage: (lang: string) => void;
  mode: AssistantMode; 
  setMode: (mode: AssistantMode) => void;
  userGoal: UserGoal | null;
  setUserGoal: (goal: UserGoal | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [soundMode, setSoundModeState] = useState<SoundMode>('essential');
  const [fontSize, setFontSizeState] = useState<FontSize>('normal');
  const [appLanguage, setAppLanguageState] = useState<string>('en');
  const [mode, setModeState] = useState<AssistantMode>('jarvis');
  const [userGoal, setUserGoalState] = useState<UserGoal | null>(null);

  useEffect(() => {
    const savedSoundMode = localStorage.getItem('nexithra-soundMode') as SoundMode;
    const savedFontSize = localStorage.getItem('nexithra-fontSize') as FontSize;
    const savedLanguage = localStorage.getItem('nexithra-appLanguage');
    const savedMode = localStorage.getItem('nexithra-assistantMode') as AssistantMode;
    const savedGoal = localStorage.getItem('nexithra-user-goal');

    if (savedSoundMode && ['full', 'essential', 'muted'].includes(savedSoundMode)) {
      setSoundModeState(savedSoundMode);
    } else {
      setSoundModeState('essential');
    }
    if (savedFontSize && ['small', 'normal', 'large'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize);
    }
    if (savedLanguage) setAppLanguageState(savedLanguage);
    if (savedMode && ['jarvis', 'alya'].includes(savedMode)) {
      setModeState(savedMode);
    }
    if (savedGoal) {
        try { setUserGoalState(JSON.parse(savedGoal)); } catch(e) { console.error("Failed to parse user goal"); }
    } else {
      // Set a default goal if none exists
      setUserGoalState({ type: 'college', university: 'RGPV', program: 'B.Tech', branch: 'CSE', semester: '4', country: 'in'});
    }

  }, []);

  const handleSetFontSize = useCallback((size: FontSize) => {
    const root = document.documentElement;
    root.classList.remove('font-size-small', 'font-size-normal', 'font-size-large');
    root.classList.add(`font-size-${size}`);
    localStorage.setItem('nexithra-fontSize', size);
    setFontSizeState(size);
  }, []);

  useEffect(() => {
    handleSetFontSize(fontSize);
  }, [fontSize, handleSetFontSize]);

  const handleSetSoundMode = useCallback((mode: SoundMode) => {
    localStorage.setItem('nexithra-soundMode', mode);
    setSoundModeState(mode);
  }, []);
  
  const handleSetAppLanguage = useCallback((lang: string) => {
    localStorage.setItem('nexithra-appLanguage', lang);
    setAppLanguageState(lang);
  }, []);

  const handleSetMode = useCallback((newMode: AssistantMode) => {
    localStorage.setItem('nexithra-assistantMode', newMode);
    setModeState(newMode);
  }, []);

  const handleSetUserGoal = useCallback((goal: UserGoal | null) => {
    if (goal) {
      localStorage.setItem('nexithra-user-goal', JSON.stringify(goal));
    } else {
      localStorage.removeItem('nexithra-user-goal');
    }
    setUserGoalState(goal);
  }, []);

  const providerValue = {
    soundMode,
    setSoundMode: handleSetSoundMode,
    fontSize,
    setFontSize: handleSetFontSize,
    appLanguage,
    setAppLanguage: handleSetAppLanguage,
    mode,
    setMode: handleSetMode,
    userGoal,
    setUserGoal: handleSetUserGoal,
  };

  return (
    <SettingsContext.Provider value={providerValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
