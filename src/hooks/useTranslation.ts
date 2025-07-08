
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
    setIsReady(false);
    setTranslations(null); // Reset translations on language change

    const loadTranslations = async (lang: string) => {
      try {
        const module = await import(`@/locales/${lang}.json`);
        // This logic is more robust: check if `default` exists and has content, otherwise use the module itself.
        const data = (module.default && Object.keys(module.default).length > 0) ? module.default : module;
        
        if (data && Object.keys(data).length > 0) {
          if (active) {
            setTranslations(data);
          }
        } else {
          // Throw if both the module and its default export are empty/invalid.
          throw new Error(`Translations for ${lang} are empty or invalid.`);
        }
      } catch (error) {
        console.warn(`Could not load translations for language: "${lang}". Falling back to English.`, error);
        try {
          const fallbackModule = await import(`@/locales/en.json`);
          // Use the same robust logic for the fallback.
          const fallbackData = (fallbackModule.default && Object.keys(fallbackModule.default).length > 0) ? fallbackModule.default : fallbackModule;

          if (fallbackData && Object.keys(fallbackData).length > 0) {
             if (active) {
              setTranslations(fallbackData);
            }
          } else {
            // This is a critical failure if even English doesn't load.
             console.error("CRITICAL: Failed to load or parse fallback English translations.", error);
             if (active) {
                setTranslations({}); // Set to empty object to prevent app crash from null.
             }
          }
        } catch (fallbackError) {
          // This catches errors in importing the fallback (en.json) itself.
          console.error("CRITICAL: The fallback 'en.json' translation file itself could not be loaded.", fallbackError);
          if (active) {
             setTranslations({});
          }
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    };

    const langCode = appLanguage.split('-')[0] || 'en';
    loadTranslations(langCode);

    return () => {
      active = false;
    };
  }, [appLanguage]);

  const t: TFunction = useCallback((key, options) => {
    if (!isReady || !translations) {
      return "";
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
