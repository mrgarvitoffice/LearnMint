
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

type TFunction = (key: string, options?: { [key: string]: string | number }) => string;

export function useTranslation(): { t: TFunction, isReady: boolean } {
  const { appLanguage } = useSettings();
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    // Immediately mark as not ready when the language changes.
    setIsReady(false); 

    const loadTranslations = async (lang: string) => {
      let loadedTranslations: Record<string, any> | null = null;
      try {
        // Attempt to load the requested language file.
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
        // Only update state if the component is still mounted.
        setTranslations(loadedTranslations);
        // CRITICAL: Mark as ready only AFTER the translations state has been set.
        setIsReady(true); 
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
    // If translations are not ready or available, return the key as a fallback.
    // The UI should ideally show a loading state until isReady is true.
    if (!isReady || !translations) {
      return key;
    }
    
    // Using a simple lookup for flat JSON structure.
    const translation = translations[key];

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
  }, [translations, isReady, appLanguage]);

  return { t, isReady };
}
