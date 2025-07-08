
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

type TFunction = (key: string, options?: { [key: string]: string | number }) => string;

interface TranslationState {
  translations: Record<string, any> | null;
  isReady: boolean;
}

// Map of functions that dynamically import the locales. This helps bundlers like Webpack.
const localeLoaders: Record<string, () => Promise<{ default: Record<string, any> }>> = {
  ar: () => import('@/locales/ar.json'),
  bg: () => import('@/locales/bg.json'),
  bn: () => import('@/locales/bn.json'),
  ca: () => import('@/locales/ca.json'),
  cs: () => import('@/locales/cs.json'),
  da: () => import('@/locales/da.json'),
  de: () => import('@/locales/de.json'),
  el: () => import('@/locales/el.json'),
  en: () => import('@/locales/en.json'),
  es: () => import('@/locales/es.json'),
  et: () => import('@/locales/et.json'),
  fa: () => import('@/locales/fa.json'),
  fi: () => import('@/locales/fi.json'),
  fil: () => import('@/locales/fil.json'),
  fr: () => import('@/locales/fr.json'),
  gu: () => import('@/locales/gu.json'),
  he: () => import('@/locales/he.json'),
  hi: () => import('@/locales/hi.json'),
  hr: () => import('@/locales/hr.json'),
  hu: () => import('@/locales/hu.json'),
  id: () => import('@/locales/id.json'),
  is: () => import('@/locales/is.json'),
  it: () => import('@/locales/it.json'),
  ja: () => import('@/locales/ja.json'),
  km: () => import('@/locales/km.json'),
  ko: () => import('@/locales/ko.json'),
  lt: () => import('@/locales/lt.json'),
  lv: () => import('@/locales/lv.json'),
  mr: () => import('@/locales/mr.json'),
  ms: () => import('@/locales/ms.json'),
  my: () => import('@/locales/my.json'),
  nl: () => import('@/locales/nl.json'),
  no: () => import('@/locales/no.json'),
  pa: () => import('@/locales/pa.json'),
  pl: () => import('@/locales/pl.json'),
  pt: () => import('@/locales/pt.json'),
  ro: () => import('@/locales/ro.json'),
  ru: () => import('@/locales/ru.json'),
  sa: () => import('@/locales/sa.json'),
  sk: () => import('@/locales/sk.json'),
  sl: () => import('@/locales/sl.json'),
  sr: () => import('@/locales/sr.json'),
  sv: () => import('@/locales/sv.json'),
  sw: () => import('@/locales/sw.json'),
  ta: () => import('@/locales/ta.json'),
  te: () => import('@/locales/te.json'),
  th: () => import('@/locales/th.json'),
  tr: () => import('@/locales/tr.json'),
  uk: () => import('@/locales/uk.json'),
  ur: () => import('@/locales/ur.json'),
  vi: () => import('@/locales/vi.json'),
  zh: () => import('@/locales/zh.json'),
};

export function useTranslation(): { t: TFunction, isReady: boolean } {
  const { appLanguage } = useSettings();
  const [state, setState] = useState<TranslationState>({
    translations: null,
    isReady: false,
  });

  useEffect(() => {
    let isMounted = true;
    
    const loadTranslations = async (lang: string) => {
      // Set loading state immediately to prevent rendering with stale data
      if (isMounted) {
        setState({ translations: null, isReady: false });
      }
      
      const langCode = lang.split('-')[0] || 'en';
      const loader = localeLoaders[langCode as keyof typeof localeLoaders] || localeLoaders.en;

      try {
        const module = await loader();
        if (isMounted) {
          setState({ translations: module.default, isReady: true });
        }
      } catch (error) {
        console.warn(`Could not load translations for language: "${langCode}". Falling back to English.`, error);
        try {
          const fallbackModule = await localeLoaders.en();
          if (isMounted) {
             setState({ translations: fallbackModule.default, isReady: true });
          }
        } catch (fallbackError) {
           console.error("CRITICAL: The fallback 'en.json' translation file could not be loaded.", fallbackError);
           if (isMounted) {
             setState({ translations: {}, isReady: true });
           }
        }
      }
    };
    
    loadTranslations(appLanguage);

    return () => {
      isMounted = false; 
    };
  }, [appLanguage]);

  const t: TFunction = useCallback((key, options) => {
    if (!state.isReady || !state.translations) {
      return key; 
    }
    
    // Corrected logic: Look for the full key directly.
    const translation = state.translations[key];

    if (translation === undefined) {
        console.warn(`Translation key not found: "${key}" for language "${appLanguage}".`);
        return key; 
    }

    if (typeof translation !== 'string') {
        console.warn(`Value for translation key "${key}" is not a string for language "${appLanguage}".`);
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
  }, [state.translations, state.isReady, appLanguage]);

  return { t, isReady: state.isReady };
}
