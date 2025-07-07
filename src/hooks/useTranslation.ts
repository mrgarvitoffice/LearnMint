
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

type TFunction = (key: string, options?: { [key: string]: string | number }) => string;

export function useTranslation(): { t: TFunction, isReady: boolean } {
  const { appLanguage } = useSettings();
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    const loadTranslations = async () => {
      setIsReady(false);
      const langCode = appLanguage || 'en';
      
      try {
        const module = await import(`@/locales/${langCode}.json`);
        if (active) {
          setTranslations(module.default || module);
          setIsReady(true);
        }
      } catch (error) {
        console.warn(`Could not load translations for language: ${langCode}. Falling back to English.`);
        try {
          const fallbackModule = await import(`@/locales/en.json`);
          if (active) {
            setTranslations(fallbackModule.default || fallbackModule);
            setIsReady(true);
          }
        } catch (fallbackError) {
          console.error("Failed to load even the fallback English translation file.", fallbackError);
          if (active) {
            setTranslations({});
            setIsReady(true); // Mark as ready but with no translations
          }
        }
      }
    };

    loadTranslations();

    return () => {
      active = false;
    };
  }, [appLanguage]);

  const t: TFunction = useCallback((key, options) => {
    if (!isReady || !translations) {
      return key; // Return key as fallback
    }
    
    // Navigate nested keys: 'a.b.c' -> translations['a']['b']['c']
    const translation = key.split('.').reduce((obj, k) => obj?.[k], translations);

    if (translation === undefined) {
      console.warn(`Translation key not found: "${key}" for language "${appLanguage}".`);
      return key;
    }
    
    let finalTranslation = String(translation);

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
