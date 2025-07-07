
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

    const loadTranslations = async () => {
      setIsReady(false);
      const langCode = appLanguage.split('-')[0] || 'en';
      
      const loadFile = async (lang: string): Promise<Record<string, string> | null> => {
        try {
          const module = await import(`@/locales/${lang}.json`);
          // This handles both `export default {...}` and `module.exports = {...}`
          const data = module.default || module;
          if (data && Object.keys(data).length > 0) {
            return data;
          }
          console.error(`Translations for ${lang} are empty or invalid.`);
          return null;
        } catch (error) {
          console.warn(`Could not load translations for language: ${lang}.`, error);
          return null;
        }
      };

      let loadedTranslations = await loadFile(langCode);

      if (active && !loadedTranslations && langCode !== 'en') {
        // If the selected language failed, try falling back to English
        console.warn(`Falling back to English translations.`);
        loadedTranslations = await loadFile('en');
      }

      if (active) {
        setTranslations(loadedTranslations || {}); // Use loaded translations or an empty object if all fails
        setIsReady(true);
      }
    };

    loadTranslations();

    return () => {
      active = false;
    };
  }, [appLanguage]);

  const t: TFunction = useCallback((key, options) => {
    // Return the key as a fallback if translations are not ready or missing.
    // This prevents showing 'undefined' or crashing, making debugging easier.
    if (!isReady || !translations) {
      return key;
    }
    
    let translation = key.split('.').reduce<any>((obj, k) => obj?.[k], translations);

    if (translation === undefined) {
        // Log a warning for developers about the missing key.
        console.warn(`Translation key not found: "${key}" for language "${appLanguage}".`);
        return key; 
    }

    if (options) {
      Object.keys(options).forEach(optionKey => {
        const regex = new RegExp(`{{${optionKey}}}`, 'g');
        translation = translation.replace(regex, String(options[optionKey]));
      });
    }
    return translation;
  }, [translations, isReady, appLanguage]);

  return { t, isReady };
}
