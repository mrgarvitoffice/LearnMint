
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

type TFunction = (key: string, options?: { [key: string]: string | number }) => string;

export function useTranslation(): { t: TFunction, isReady: boolean } {
  const { appLanguage } = useSettings();
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    const loadTranslations = async (lang: string) => {
      // Always reset loading state at the start of an effect run
      if (active) {
        setIsReady(false);
      }

      try {
        const module = await import(`@/locales/${lang}.json`);
        // The imported JSON can be the module itself or under a `default` property.
        const data = module.default || module;

        if (active && data && typeof data === 'object' && Object.keys(data).length > 0) {
          setTranslations(data);
        } else {
          // This error will be caught and handled by the fallback logic.
          throw new Error(`Translations for ${lang} are empty or invalid.`);
        }
      } catch (error) {
        console.warn(`Could not load translations for language: ${lang}. Falling back to English.`, error);
        // Attempt to load the English fallback if the primary language fails.
        try {
          const fallbackModule = await import(`@/locales/en.json`);
          const fallbackData = fallbackModule.default || fallbackModule;
          if (active && fallbackData && typeof fallbackData === 'object' && Object.keys(fallbackData).length > 0) {
            setTranslations(fallbackData);
          } else {
            // This is a critical failure if even English cannot be loaded.
            console.error("CRITICAL: Failed to load or parse fallback English translations.", error);
            if (active) setTranslations({}); // Set to empty object to prevent app crash
          }
        } catch (fallbackError) {
          console.error("CRITICAL: Error loading fallback English translations.", fallbackError);
          if (active) setTranslations({}); // Prevent app crash
        }
      } finally {
        // Crucially, always set isReady to true after attempting to load.
        // This unblocks the UI even if all translation attempts fail.
        if (active) {
          setIsReady(true);
        }
      }
    };

    const langCode = appLanguage.split('-')[0] || 'en';
    loadTranslations(langCode);

    // Cleanup function to prevent state updates on unmounted components
    return () => {
      active = false;
    };
  }, [appLanguage]);

  const t: TFunction = useCallback((key, options) => {
    // If not ready or if translations failed to load, return the key itself.
    // This makes debugging much easier than returning an empty string.
    if (!isReady || !translations) {
      return key;
    }
    
    const translation = translations[key];

    if (translation === undefined) {
        console.warn(`Translation key not found: "${key}" for language "${appLanguage}".`);
        return key; 
    }

    let finalTranslation = translation;

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
