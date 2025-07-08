
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

type TFunction = (key: string, options?: { [key: string]: string | number }) => string;

interface TranslationState {
  translations: Record<string, any> | null;
  isReady: boolean;
}

export function useTranslation(): { t: TFunction, isReady: boolean } {
  const { appLanguage } = useSettings();
  const [state, setState] = useState<TranslationState>({
    translations: null,
    isReady: false,
  });

  useEffect(() => {
    let isMounted = true;
    // Reset state to loading on language change
    setState({ translations: null, isReady: false }); 

    const loadTranslations = async (lang: string) => {
      let loadedTranslations: Record<string, any> | null = null;
      try {
        const module = await import(`@/locales/${lang}.json`);
        loadedTranslations = module.default;
        if (!loadedTranslations || typeof loadedTranslations !== 'object' || Object.keys(loadedTranslations).length === 0) {
          throw new Error(`Translations for '${lang}' are empty or invalid.`);
        }
      } catch (error) {
        console.warn(`Could not load translations for language: "${lang}". Falling back to English.`, error);
        try {
          // If the requested language fails, fall back to English.
          const fallbackModule = await import(`@/locales/en.json`);
          loadedTranslations = fallbackModule.default;
        } catch (fallbackError) {
          console.error("CRITICAL: The fallback 'en.json' translation file could not be loaded.", fallbackError);
          // As a last resort, use an empty object to prevent a crash.
          loadedTranslations = {}; 
        }
      }

      if (isMounted) {
        // Atomically update both translations and readiness state
        setState({ translations: loadedTranslations, isReady: true });
      }
    };

    const langCode = appLanguage.split('-')[0] || 'en';
    loadTranslations(langCode);

    return () => {
      // Cleanup function to prevent state updates on an unmounted component.
      isMounted = false; 
    };
  }, [appLanguage]);

  const t: TFunction = useCallback((key, options) => {
    // This guard is now robust because isReady and translations are set together.
    if (!state.isReady || !state.translations) {
      return key;
    }
    
    // Using a simple lookup for flat JSON structure.
    const translation = state.translations[key];

    if (translation === undefined) {
        // Warn developer in console if a key is missing.
        console.warn(`Translation key not found: "${key}" for language "${appLanguage}".`);
        return key; 
    }

    let finalTranslation = translation;

    // Replace placeholders like {{count}} with values from the options object.
    if (options) {
      Object.keys(options).forEach(optionKey => {
        const regex = new RegExp(`{{${optionKey}}}`, 'g');
        finalTranslation = finalTranslation.replace(regex, String(options[optionKey]));
      });
    }

    return finalTranslation;
  }, [state.translations, state.isReady, appLanguage]);

  return { t, isReady: state.isReady };
}
