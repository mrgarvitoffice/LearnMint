
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchNews } from '@/lib/news-api';
import type { NewsArticle } from '@/lib/types';
import { NewsCard } from '@/components/features/news/NewsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Loader2, AlertTriangle, PlayCircle, PauseCircle, StopCircle } from 'lucide-react';
import { NewsFilters } from '@/components/features/news/NewsFilters';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/hooks/useTTS';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';

interface NewsPageFilters {
  query: string;
  country: string;
  stateOrRegion: string;
  city: string;
  category: string;
  language: string;
}

const initialFilters: NewsPageFilters = { query: '', country: '', stateOrRegion: '', city: '', category: 'top', language: 'en' };

export default function NewsPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<NewsPageFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<NewsPageFilters>(initialFilters);
  const pageTitleSpokenRef = useRef(false);
  const { t, isReady } = useTranslation();
  const { userGoal } = useSettings();
  
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { toast } = useToast();
  
  const {
    speak,
    pauseTTS,
    resumeTTS,
    cancelTTS,
    isSpeaking,
    isPaused,
    setVoicePreference
  } = useTTS();

  useEffect(() => {
      // Pre-fill filters from URL if provided by Jarvis/Holo or other links
      const category = searchParams.get('category');
      const country = searchParams.get('country');
      const query = searchParams.get('query');
      const language = searchParams.get('language');
      const stateOrRegion = searchParams.get('stateOrRegion');
      const city = searchParams.get('city');

      const newFilters = { ...initialFilters };
      let filtersApplied = false;

      if (category || country || query || language || stateOrRegion || city) {
          newFilters.category = category || 'top';
          newFilters.country = country || '';
          newFilters.query = query || '';
          newFilters.language = language || 'en';
          newFilters.stateOrRegion = stateOrRegion || '';
          newFilters.city = city || '';
          filtersApplied = true;
      } else if (userGoal?.country) {
          // If no URL params, use goal settings as default
          newFilters.country = userGoal.country;
          filtersApplied = true;
      }

      if (filtersApplied) {
        setFilters(newFilters);
        setAppliedFilters(newFilters);
      }

  }, [searchParams, userGoal]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
    queryKey: ['news', appliedFilters],
    queryFn: ({ pageParam }) => fetchNews({
        query: appliedFilters.query, country: appliedFilters.country,
        stateOrRegion: appliedFilters.stateOrRegion, city: appliedFilters.city,
        category: appliedFilters.category, page: pageParam, language: appliedFilters.language
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setVoicePreference('gojo');
    return () => { cancelTTS(); };
  }, [setVoicePreference, cancelTTS]);

  useEffect(() => {
    if (!isReady || pageTitleSpokenRef.current) return;
    const PAGE_TITLE = t('news.title');
    const timer = setTimeout(() => {
        speak(PAGE_TITLE, { priority: 'optional' });
        pageTitleSpokenRef.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, [speak, t, isReady]);

  const articles = useMemo(() => {
    const allArticlesFlat = data?.pages.flatMap(page => page?.results ?? []) ?? [];
    const uniqueArticlesMap = new Map<string, NewsArticle>();
    const seenNormalizedTitles = new Set<string>();

    const normalizeTitleForKey = (title: string | null | undefined): string => {
      if (!title) return "";
      let normalized = title.toLowerCase();
      const prefixes = ['breaking:', 'update:', 'live:', 'alert:', 'exclusive:', 'video:', 'photos:', 'watch:', 'opinion:'];
      for (const prefix of prefixes) {
        if (normalized.startsWith(prefix)) {
          normalized = normalized.substring(prefix.length).trim();
          break;
        }
      }
      normalized = normalized.replace(/[^a-z0-9\s]/g, '');
      normalized = normalized.replace(/\s+/g, ' ').trim();
      return normalized;
    };

    allArticlesFlat.forEach(article => {
      const currentNormalizedTitle = normalizeTitleForKey(article.title);
      if (currentNormalizedTitle && seenNormalizedTitles.has(currentNormalizedTitle)) return;
      if (currentNormalizedTitle) seenNormalizedTitles.add(currentNormalizedTitle);

      let mapKey: string | null = null;
      if (article.article_id && article.article_id.trim() !== "") mapKey = `id-${article.article_id.trim()}`;
      if (!mapKey && article.link) {
        try {
          const url = new URL(article.link);
          const normalizedLink = url.hostname + url.pathname;
          if (normalizedLink) mapKey = `link-${normalizedLink}`;
        } catch (e) {/* ignore */}
      }
      if (!mapKey && currentNormalizedTitle) mapKey = `title-${currentNormalizedTitle}`;

      if (mapKey && !uniqueArticlesMap.has(mapKey)) uniqueArticlesMap.set(mapKey, article);
    });
    return Array.from(uniqueArticlesMap.values());
  }, [data]);
  
  const handleFilterChange = (name: keyof NewsPageFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      if (name === 'country') {
        newFilters.stateOrRegion = '';
        newFilters.city = '';
      }
      if (name === 'language' && value !== prev.language) {
          cancelTTS(); // Stop speaking if language changes
      }
      return newFilters;
    });
  };

  const handleApplyFilters = () => {
    playActionSound();
    cancelTTS();
    setAppliedFilters(filters);
  };
  const handleResetFilters = () => {
    playActionSound();
    cancelTTS();
    const defaultResetFilters = { ...initialFilters, country: userGoal?.country || '' };
    setFilters(defaultResetFilters);
    setAppliedFilters(defaultResetFilters);
  };

  const readAllHeadlines = useCallback(() => {
    const headlines = articles.map(a => a.title).filter(Boolean).join('. ');
    if (headlines) {
        speak(headlines, { priority: 'manual', lang: appliedFilters.language });
    } else {
        toast({ title: t('news.toast.noHeadlinesTitle'), description: t('news.toast.noHeadlinesDesc') });
    }
  }, [articles, speak, toast, appliedFilters.language, t]);

  const handlePlaybackControl = () => {
    playClickSound();
    if (isSpeaking && !isPaused) {
        pauseTTS();
    } else if (isPaused) {
        resumeTTS();
    } else {
        if (articles.length === 0) {
            toast({ title: t('news.toast.noHeadlinesTitle'), description: t('news.toast.noHeadlinesDesc') });
            return;
        }
        readAllHeadlines();
    }
  };

  const handleStopTTS = () => {
    playClickSound();
    cancelTTS();
  };

  const getPlaybackButtonTextAndIcon = () => {
    if (isSpeaking && !isPaused) return { text: t('news.controls.pause'), icon: <PauseCircle className="h-4 w-4 mr-2" /> };
    if (isPaused) return { text: t('news.controls.resume'), icon: <PlayCircle className="h-4 w-4 mr-2" /> };
    return { text: t('news.controls.read'), icon: <PlayCircle className="h-4 w-4 mr-2" /> };
  };

  if (!isReady) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  const { text: playbackButtonText, icon: playbackButtonIcon } = getPlaybackButtonTextAndIcon();

  return (
    <div className="py-8 space-y-8">
      <Card className="shadow-xl relative overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-10">
            <source src="/icons/v5.mp4" type="video/mp4" />
        </video>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><Newspaper className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{t('news.title')}</CardTitle>
          <CardDescription>{t('news.description')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="mb-6 flex flex-col sm:flex-row justify-center items-center gap-2 border-t border-b py-3 border-border/50">
              <Button onClick={handlePlaybackControl} variant="outline" className="h-9 w-full sm:w-auto" title={playbackButtonText}>
                  {playbackButtonIcon} {playbackButtonText}
              </Button>
              <Button onClick={handleStopTTS} variant="outline" size="icon" className="h-9 w-9" title={t('news.controls.stop')} disabled={!isSpeaking && !isPaused}>
                <StopCircle className="h-5 w-5" />
              </Button>
          </div>
        </CardContent>
        <CardContent>
          <NewsFilters filters={filters} onFilterChange={handleFilterChange} onApplyFilters={handleApplyFilters} onResetFilters={handleResetFilters} isLoading={isLoading || isFetchingNextPage} />
        </CardContent>
      </Card>
      
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">{t('news.loading')}</p>
        </div>
      )}
      {isError && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>{t('news.error.title')}</AlertTitle>
          <AlertDescription>
            {t('news.error.message', { error: error instanceof Error ? error.message : "An unknown error occurred."})}
          </AlertDescription>
        </Alert>
      )}
      {!isLoading && !isError && articles.length === 0 && (
        <div className="text-center py-10">
          <Newspaper className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-xl text-muted-foreground">{t('news.noArticles.title')}</p>
          <p className="text-sm text-muted-foreground/80">{t('news.noArticles.description')}</p>
        </div>
      )}
      {articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {articles.map((article, index) => <NewsCard key={article.article_id || article.link || index} article={article} />)}
        </div>
      )}
      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button onClick={() => { playActionSound(); fetchNextPage(); }} disabled={isFetchingNextPage}>
            {isFetchingNextPage && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {t('news.loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
}
