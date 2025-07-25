
"use client";

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OTHER_RESOURCES } from '@/lib/constants';
import { getTranslatedMathFact } from '@/lib/actions/fact-actions';
import type { MathFact, YoutubeVideoItem, GoogleBookItem, QueryError, YoutubeSearchInput, GoogleBooksSearchInput, YoutubeSearchOutput, GoogleBooksSearchOutput } from '@/lib/types';
import { ResourceCard } from '@/components/features/library/ResourceCard';
import { YoutubeVideoResultItem } from '@/components/features/library/YoutubeVideoResultItem';
import { BookResultItem } from '@/components/features/library/BookResultItem';
import { BookMarked, Search, Youtube, Lightbulb, BookOpen, Brain, ExternalLink, Loader2, Quote, Video, X, Mic, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { directYoutubeSearch, directGoogleBooksSearch } from '@/lib/actions'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useSound } from '@/hooks/useSound';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings } from '@/contexts/SettingsContext';


export default function LibraryPage() {
  const [youtubeSearchTerm, setYoutubeSearchTerm] = useState('');
  const [googleBooksSearchTerm, setGoogleBooksSearchTerm] = useState('');
  
  const [youtubeResults, setYoutubeResults] = useState<YoutubeVideoItem[]>([]);
  const [selectedYoutubeVideo, setSelectedYoutubeVideo] = useState<YoutubeVideoItem | null>(null);

  const [googleBooksResults, setGoogleBooksResults] = useState<GoogleBookItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<GoogleBookItem | null>(null);
  
  const { speak, setVoicePreference } = useTTS();
  const pageTitleSpokenRef = useRef(false);
  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { volume: 0.4, priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3');
  const { t, isReady } = useTranslation();
  const { appLanguage } = useSettings();

  const { isListening, transcript, startListening, stopListening, error: voiceError, browserSupportsSpeechRecognition } = useVoiceRecognition();
  const [voiceSearchTarget, setVoiceSearchTarget] = useState<'youtube' | 'books' | null>(null);

  useEffect(() => {
    setVoicePreference('holo');
  }, [setVoicePreference]);

  useEffect(() => {
    if (!isReady || pageTitleSpokenRef.current) return;
    const PAGE_TITLE = t('library.title');
    const timer = setTimeout(() => {
        speak(PAGE_TITLE, { priority: 'optional' });
        pageTitleSpokenRef.current = true;
    }, 500);

    return () => clearTimeout(timer);
  }, [speak, t, isReady]);

  useEffect(() => {
    if (transcript && voiceSearchTarget) {
      if (voiceSearchTarget === 'youtube') setYoutubeSearchTerm(transcript);
      else if (voiceSearchTarget === 'books') setGoogleBooksSearchTerm(transcript);
    }
  }, [transcript, voiceSearchTarget]);

  useEffect(() => {
    if (voiceError) toast({ title: "Voice Input Error", description: voiceError, variant: "destructive" });
  }, [voiceError, toast]);

  const handleMicClick = (target: 'youtube' | 'books') => {
    playClickSound();
    if (isListening && voiceSearchTarget === target) {
      stopListening();
      setVoiceSearchTarget(null);
    } else {
      setVoiceSearchTarget(target);
      if (target === 'youtube') setYoutubeSearchTerm('');
      else if (target === 'books') setGoogleBooksSearchTerm('');
      startListening();
    }
  };

  const { data: mathFact, isLoading: isLoadingMathFact, isError: isErrorMathFact, refetch: refetchMathFact } = useQuery<MathFact>({
    queryKey: ['mathFact', appLanguage],
    queryFn: () => getTranslatedMathFact(appLanguage),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 65,
    refetchOnWindowFocus: false,
  });

  const handleRefreshMathFact = () => {
    playClickSound(); refetchMathFact();
    speak(t('library.mathFact.speak.fetching'), { priority: 'optional' });
  };

  const youtubeSearchMutation = useMutation<YoutubeSearchOutput, QueryError, YoutubeSearchInput>({
    mutationFn: directYoutubeSearch, 
    onSuccess: (data) => {
      if (data.videos && data.videos.length > 0) {
        setYoutubeResults(data.videos);
        toast({ title: t('library.youtube.toast.successTitle'), description: t('library.youtube.toast.successDesc', { count: data.videos.length }) });
      } else {
        setYoutubeResults([]);
        toast({ title: t('library.youtube.toast.noResultsTitle'), description: t('library.youtube.toast.noResultsDesc') });
      }
    },
    onError: (error) => {
      console.error("YouTube search error:", error);
      toast({ title: t('library.youtube.toast.errorTitle'), description: error.message || t('library.youtube.toast.errorDesc'), variant: "destructive" });
      setYoutubeResults([]);
    }
  });

  const googleBooksSearchMutation = useMutation<GoogleBooksSearchOutput, QueryError, GoogleBooksSearchInput>({
    mutationFn: directGoogleBooksSearch, 
    onSuccess: (data) => {
      if (data.books && data.books.length > 0) {
        setGoogleBooksResults(data.books);
        toast({ title: t('library.books.toast.successTitle'), description: t('library.books.toast.successDesc', { count: data.books.length }) });
      } else {
        setGoogleBooksResults([]);
        toast({ title: t('library.books.toast.noResultsTitle'), description: t('library.books.toast.noResultsDesc') });
      }
    },
    onError: (error) => {
      console.error("Google Books search error:", error);
      toast({ title: t('library.books.toast.errorTitle'), description: error.message || t('library.books.toast.errorDesc'), variant: "destructive" });
      setGoogleBooksResults([]);
    }
  });

  const handleYoutubeSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (youtubeSearchTerm.trim()) {
      playActionSound();
      speak(t('library.youtube.speak.searching', { term: youtubeSearchTerm.trim() }), { priority: 'optional' });
      setYoutubeResults([]); 
      youtubeSearchMutation.mutate({ query: youtubeSearchTerm.trim(), maxResults: 8 });
      if (isListening && voiceSearchTarget === 'youtube') stopListening();
      setVoiceSearchTarget(null);
    }
  };

  const handleGoogleBooksSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (googleBooksSearchTerm.trim()) {
      playActionSound();
      speak(t('library.books.speak.searching', { term: googleBooksSearchTerm.trim() }), { priority: 'optional' });
      setGoogleBooksResults([]); 
      googleBooksSearchMutation.mutate({ query: googleBooksSearchTerm.trim(), maxResults: 9 });
      if (isListening && voiceSearchTarget === 'books') stopListening();
      setVoiceSearchTarget(null);
    }
  };
  
  const openBookInViewer = (book: GoogleBookItem) => {
    playClickSound();
    const bookPreviewUrl = book.previewLink || book.webReaderLink || book.infoLink || `https://books.google.com/books?id=${book.bookId}`;
    if (book.embeddable) {
      setSelectedBook(book);
    }
    else {
      window.open(bookPreviewUrl, '_blank', 'noopener,noreferrer');
      toast({ title: t('library.books.toast.openingExternalTitle'), description: t('library.books.toast.openingExternalDesc') });
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-10">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><BookMarked className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{t('library.title')}</CardTitle>
          <CardDescription>{t('library.description')}</CardDescription>
        </CardHeader>
      </Card>

      <Card className="bg-secondary/30 border-orange-500/30 hover:shadow-xl transition-shadow duration-300 group">
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-7 w-7 text-orange-500/80 group-hover:text-orange-600 transition-colors" />
            <CardTitle className="text-xl font-semibold text-orange-600 dark:text-orange-500">{t('library.mathFact.title')}</CardTitle>
          </div>
          {isLoadingMathFact ? (
            <div className="flex items-center justify-center space-x-2 text-muted-foreground p-4 min-h-32"><Loader2 className="h-5 w-5 animate-spin" /><span>{t('library.mathFact.loading')}</span></div>
          ) : isErrorMathFact ? (
             <div className="flex items-center justify-center space-x-2 text-destructive p-4 min-h-32"><AlertTriangle className="h-5 w-5" /><span>{t('library.mathFact.error')}</span></div>
          ) : mathFact ? (
            <CardDescription className="text-lg text-orange-700 dark:text-orange-400 font-medium pt-1 italic p-4 min-h-32 flex items-center justify-center">
              "{mathFact.fact}"
            </CardDescription>
          ) : (
            <CardDescription className="text-lg text-muted-foreground p-4 min-h-32 flex items-center justify-center">{t('library.mathFact.error')}</CardDescription>
          )}
        </CardHeader>
        <CardFooter className="pt-2 pb-4">
          <Button onClick={handleRefreshMathFact} variant="outline" size="sm" disabled={isLoadingMathFact} className="bg-background/70 group-hover:border-orange-500/50 group-hover:text-orange-600 transition-colors">
            {isLoadingMathFact ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="w-4 w-4 mr-2"/>} {t('library.mathFact.newButton')}
          </Button>
        </CardFooter>
      </Card>

      <section>
        <Card>
          <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Youtube className="w-7 h-7 text-red-500" />{t('library.youtube.title')}</CardTitle></CardHeader>
          <form onSubmit={handleYoutubeSearchSubmit}>
            <CardContent className="flex gap-2 items-center">
              <Input type="search" placeholder={t('library.youtube.placeholder')} value={youtubeSearchTerm} onChange={(e) => setYoutubeSearchTerm(e.target.value)} disabled={youtubeSearchMutation.isPending}/>
              {browserSupportsSpeechRecognition && (
                <Button type="button" variant="ghost" size="icon" onClick={() => handleMicClick('youtube')} disabled={youtubeSearchMutation.isPending}>
                  <Mic className={`w-5 h-5 ${isListening && voiceSearchTarget === 'youtube' ? 'text-destructive animate-pulse' : ''}`} />
                </Button>
              )}
              <Button type="submit" disabled={youtubeSearchMutation.isPending || !youtubeSearchTerm.trim()}>
                {youtubeSearchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('library.searchButton')}
              </Button>
            </CardContent>
          </form>
          {youtubeSearchMutation.isPending && youtubeResults.length === 0 && (
            <div className="px-6 pb-6 flex items-center justify-center space-x-2 text-muted-foreground h-40">
                <Loader2 className="h-6 w-6 animate-spin" /><span>{t('library.youtube.searching')}</span>
            </div>
          )}
          {youtubeResults.length > 0 && (
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold mb-3 mt-4">{t('library.resultsTitle')}:</h3>
              <ScrollArea className="h-[400px] w-full pr-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {youtubeResults.map(video => (
                    <YoutubeVideoResultItem
                      key={video.videoId}
                      video={video}
                      onPlay={() => { playClickSound(); setSelectedYoutubeVideo(video);}}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          {!youtubeSearchMutation.isPending && youtubeSearchMutation.isSuccess && youtubeResults.length === 0 && (
            <div className="px-6 pb-6 text-center text-muted-foreground h-40 flex flex-col justify-center items-center">
                <Video className="w-10 h-10 mb-2 opacity-50" />
                <p>{t('library.youtube.noResults', { term: youtubeSearchTerm })}</p>
            </div>
          )}
        </Card>
      </section>

      {selectedYoutubeVideo && (
        <Dialog open={!!selectedYoutubeVideo} onOpenChange={(isOpen) => { if (!isOpen) setSelectedYoutubeVideo(null); }}>
          <DialogContent className="max-w-3xl p-0 border-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
            <DialogHeader className="sr-only"><DialogTitle>{selectedYoutubeVideo.title}</DialogTitle></DialogHeader>
            <div className="aspect-video relative">
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${selectedYoutubeVideo.videoId}?autoplay=1`} title={selectedYoutubeVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="rounded-lg"></iframe>
              <DialogClose asChild><Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 z-10" aria-label="Close video player"><X className="h-5 w-5" /></Button></DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedBook && (
        <Dialog open={!!selectedBook} onOpenChange={(isOpen) => { if (!isOpen) setSelectedBook(null); }}>
          <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 border-0">
            <DialogHeader className="p-3 flex-row items-center justify-between border-b">
              <DialogTitle className="truncate">{selectedBook.title}</DialogTitle>
              <DialogClose asChild><Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button></DialogClose>
            </DialogHeader>
            <div className="flex-1 w-full h-full">
              <iframe src={`https://books.google.com/books?id=${selectedBook.bookId}&pg=PP1&output=embed`} title={`Read ${selectedBook.title}`} className="w-full h-full border-0" allow="fullscreen"></iframe>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <section>
        <Card>
          <CardHeader><CardTitle className="text-xl flex items-center gap-2"><BookOpen className="w-7 h-7 text-blue-500" />{t('library.books.title')}</CardTitle></CardHeader>
          <form onSubmit={handleGoogleBooksSearchSubmit}>
            <CardContent className="flex gap-2 items-center">
              <Input type="search" placeholder={t('library.books.placeholder')} value={googleBooksSearchTerm} onChange={(e) => setGoogleBooksSearchTerm(e.target.value)} disabled={googleBooksSearchMutation.isPending}/>
               {browserSupportsSpeechRecognition && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleMicClick('books')} disabled={googleBooksSearchMutation.isPending}>
                    <Mic className={`w-5 h-5 ${isListening && voiceSearchTarget === 'books' ? 'text-destructive animate-pulse' : ''}`} />
                  </Button>
               )}
              <Button type="submit" disabled={googleBooksSearchMutation.isPending || !googleBooksSearchTerm.trim()}>
                {googleBooksSearchMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('library.searchButton')}
              </Button>
            </CardContent>
          </form>
          {googleBooksSearchMutation.isPending && googleBooksResults.length === 0 && (
            <div className="px-6 pb-6 flex items-center justify-center space-x-2 text-muted-foreground h-40">
                <Loader2 className="h-6 w-6 animate-spin" /><span>{t('library.books.searching')}</span>
            </div>
          )}
          {googleBooksResults.length > 0 && (
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold mb-3 mt-4">{t('library.resultsTitle')}:</h3>
              <ScrollArea className="h-[400px] w-full pr-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {googleBooksResults.map(book => (
                    <BookResultItem key={book.bookId} book={book} onPreviewRequest={openBookInViewer} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          {!googleBooksSearchMutation.isPending && googleBooksSearchMutation.isSuccess && googleBooksResults.length === 0 && (
            <div className="px-6 pb-6 text-center text-muted-foreground h-40 flex flex-col justify-center items-center">
                <BookOpen className="w-10 h-10 mb-2 opacity-50" />
                <p>{t('library.books.noResults', { term: googleBooksSearchTerm })}</p>
            </div>
          )}
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">{t('library.resources.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {OTHER_RESOURCES.map(resource => <ResourceCard key={resource.title} title={resource.title} description={resource.description} link={resource.link} icon={resource.icon} linkText={t('library.resources.visitSite')}/>)}
        </div>
      </section>
    </div>
  );
}
