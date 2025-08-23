

"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mic, FileSignature, Loader2, AlertTriangle, ImageIcon, XCircle, FileText, AudioLines, Video } from "lucide-react"; 
import Image from 'next/image';

import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useSettings } from '@/contexts/SettingsContext';
import { useQuests } from '@/contexts/QuestContext';

import { generateNotesAction } from "@/lib/actions";
import type { CombinedStudyMaterialsOutput } from '@/lib/types'; 
import { useTranslation } from '@/hooks/useTranslation';
import { extractTextFromPdf } from '@/lib/utils';
import { cn } from '@/lib/utils';

const RECENT_TOPICS_LS_KEY = "learnmint-recent-topics";
const LOCALSTORAGE_KEY_PREFIX = "learnmint-study-";

export default function GenerateNotesPage() {
  const router = useRouter(); 
  const searchParams = useSearchParams();
  const { toast } = useToast(); 
  const { t } = useTranslation();
  const { completeQuest1 } = useQuests();

  const [topic, setTopic] = useState<string>("");
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(false);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);

  const [audioData, setAudioData] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [notesError, setNotesError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null);

  const { speak, setVoicePreference } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceRecognition();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { priority: 'essential' });
  const { soundMode } = useSettings();

  const pageTitleSpokenRef = useRef(false);
  const generationTriggeredRef = useRef(false);
  
  useEffect(() => {
    setVoicePreference('holo'); 
  }, [setVoicePreference]);

  const handleGenerateAllMaterials = useCallback(async (topicOverride?: string) => {
    playActionSound(); 

    const topicToUse = topicOverride || topic;
    if (topicToUse.trim().length < 3 && !pdfText && !imageData) {
      toast({ title: t('generate.toast.invalidTopic'), description: "Please provide a topic, or upload a file.", variant: "destructive" });
      return;
    }

    setNotesError(null); setQuizError(null); setFlashcardsError(null);
    setIsLoadingAll(true);
    pageTitleSpokenRef.current = true; 

    speak("Generating all study materials. This may take a moment.", { priority: 'optional' });

    const trimmedTopic = topicToUse.trim() || `Notes for ${pdfFileName || 'uploaded file'}`;
    try {
      const storedTopics = localStorage.getItem(RECENT_TOPICS_LS_KEY);
      let recentTopicsArray = storedTopics ? JSON.parse(storedTopics) : [];
      if (!recentTopicsArray.includes(trimmedTopic)) {
        recentTopicsArray.unshift(trimmedTopic);
        recentTopicsArray = recentTopicsArray.slice(0, 10);
        localStorage.setItem(RECENT_TOPICS_LS_KEY, JSON.stringify(recentTopicsArray));
      }
    } catch (e) { console.error("Failed to save recent topic to localStorage", e); }
    
    try {
      const combinedResult: CombinedStudyMaterialsOutput = await generateNotesAction({ 
        topic: trimmedTopic, 
        image: imageData || undefined,
        notes: pdfText || undefined,
        audio: audioData || undefined,
        video: videoData || undefined,
      });
      let navigationSuccess = false;

      // Handle notes
      if (combinedResult.notesOutput?.notes) {
        localStorage.setItem(getCacheKey("notes", trimmedTopic), JSON.stringify(combinedResult.notesOutput));
        navigationSuccess = true;
        completeQuest1(); // Mark quest 1 as complete
      } else {
        setNotesError(combinedResult.notesError || t('generate.toast.notesErrorDesc'));
      }

      // Handle quiz
      const quizSuccess = combinedResult.quizOutput?.questions && combinedResult.quizOutput.questions.length > 0;
      if (quizSuccess) {
        localStorage.setItem(getCacheKey("quiz", trimmedTopic), JSON.stringify(combinedResult.quizOutput));
      } else if(combinedResult.quizError) {
        setQuizError(combinedResult.quizError);
      }

      // Handle flashcards
      const flashcardsSuccess = combinedResult.flashcardsOutput?.flashcards && combinedResult.flashcardsOutput.flashcards.length > 0;
      if (flashcardsSuccess) {
        localStorage.setItem(getCacheKey("flashcards", trimmedTopic), JSON.stringify(combinedResult.flashcardsOutput));
      } else if(combinedResult.flashcardsError) {
        setFlashcardsError(combinedResult.flashcardsError);
      }

      // Final aggregated notification
      if (navigationSuccess) {
          const successfulParts = ['Notes'];
          if (quizSuccess) successfulParts.push('Quiz');
          if (flashcardsSuccess) successfulParts.push('Flashcards');
          const successMessage = `${successfulParts.join(', ')} for "${trimmedTopic}" generated and cached.`;
          
          toast({
            title: "Materials Generated!",
            description: successMessage,
          });

          speak("Study materials are ready!", { priority: 'essential' });
          router.push(`/study?topic=${encodeURIComponent(trimmedTopic)}`);

      } else {
          // This block runs if notes (the primary content) failed.
          toast({ title: t('generate.toast.notesError'), description: notesError || t('generate.toast.notesErrorDesc'), variant: 'destructive' });
      }

    } catch (err: any) { 
      setNotesError(err.message);
      setQuizError("Could not attempt quiz generation due to initial notes failure.");
      setFlashcardsError("Could not attempt flashcard generation due to initial notes failure.");
      toast({ title: t('generate.toast.generationFailed'), description: err.message, variant: 'destructive' });
      speak("Sorry, failed to generate study materials.", { priority: 'essential' });
    } finally {
      setIsLoadingAll(false);
      setTopic('');
      handleRemoveFile(false);
    }
  }, [topic, imageData, pdfText, audioData, videoData, playActionSound, toast, t, speak, router, completeQuest1]);


  useEffect(() => {
    const topicFromUrl = searchParams.get('topic');
    if (topicFromUrl) {
      const decodedTopic = decodeURIComponent(topicFromUrl);
      setTopic(decodedTopic);
      // Automatically trigger generation only once
      if (!generationTriggeredRef.current) {
        handleGenerateAllMaterials(decodedTopic);
        generationTriggeredRef.current = true;
      }
    }
  }, [searchParams, handleGenerateAllMaterials]);


  useEffect(() => {
    const PAGE_TITLE = t('generate.title');
    const timer = setTimeout(() => {
      if (!pageTitleSpokenRef.current && !isLoadingAll) {
        speak(PAGE_TITLE, { priority: 'optional' });
        pageTitleSpokenRef.current = true;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [speak, isLoadingAll, t]);

  useEffect(() => {
    if (transcript) setTopic(transcript);
  }, [transcript]);

  const handleVoiceCommand = useCallback(() => {
    playClickSound();
    if (isListening) stopListening();
    else { setTopic(""); startListening(); }
  }, [isListening, startListening, stopListening, playClickSound]);

  const getCacheKey = (type: string, topicKey: string) => `${LOCALSTORAGE_KEY_PREFIX}${type}-${topicKey.toLowerCase().replace(/\s+/g, '-')}`;

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    playClickSound();
    const file = e.target.files?.[0];
    if (file) {
      handleRemoveFile(false); // Clear previous file state
      setIsProcessingFile(true);
      if (file.type.startsWith('image/')) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
          toast({ title: t('customTest.file.image.tooLarge'), description: t('customTest.file.image.tooLargeDesc'), variant: "destructive" });
          setIsProcessingFile(false); return;
        }
        const reader = new FileReader();
        reader.onloadend = () => { setImagePreview(reader.result as string); setImageData(reader.result as string); };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: t('customTest.file.pdf.tooLarge'), description: t('customTest.file.pdf.tooLargeDesc'), variant: "destructive" });
          setIsProcessingFile(false); return;
        }
        setPdfFileName(file.name);
        try {
          const text = await extractTextFromPdf(file);
          setPdfText(text);
          toast({ title: t('customTest.file.pdf.processed'), description: t('customTest.file.pdf.processedDesc') });
        } catch (err: any) {
          toast({ title: t('customTest.file.pdf.error'), description: err.message || t('customTest.file.pdf.errorDesc'), variant: "destructive" });
          setPdfFileName(null);
        }
      } else if (file.type.startsWith('audio/')) {
        if (file.size > 25 * 1024 * 1024) { // 25MB limit
          toast({ title: t('customTest.file.audio.tooLarge'), description: t('customTest.file.audio.tooLargeDesc'), variant: "destructive" });
          setIsProcessingFile(false); return;
        }
        setAudioFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => { setAudioData(reader.result as string); };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
        if (file.size > 25 * 1024 * 1024) { // 25MB limit
          toast({ title: t('customTest.file.video.tooLarge'), description: t('customTest.file.video.tooLargeDesc'), variant: "destructive" });
          setIsProcessingFile(false); return;
        }
        setVideoFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => { setVideoData(reader.result as string); };
        reader.readAsDataURL(file);
      } else {
        toast({ title: t('customTest.file.unsupported'), description: t('customTest.file.unsupportedDesc'), variant: "default" });
      }
      setIsProcessingFile(false);
    }
  };

  const handleRemoveFile = (withSound = true) => {
    if (withSound) playClickSound();
    setImagePreview(null);
    setImageData(null);
    setPdfFileName(null);
    setPdfText(null);
    setAudioData(null);
    setVideoData(null);
    setAudioFileName(null);
    setVideoFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  return (
    <div className="py-8 space-y-8">
      <Card className="w-full shadow-xl relative overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-10 group-hover:opacity-20 transition-opacity">
            <source src="/icons/v1.mp4" type="video/mp4" />
        </video>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><GraduationCap className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-center text-2xl sm:text-3xl font-bold text-primary">{t('generate.title')}</CardTitle>
          <CardDescription className="text-center text-sm sm:text-base text-muted-foreground px-2">
            {t('generate.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t('generate.placeholder')}
              className="flex-1 text-base sm:text-lg py-3 px-4 transition-colors duration-200 ease-in-out focus-visible:ring-primary focus-visible:ring-2"
              aria-label="Study Topic"
              onKeyDown={(e) => e.key === 'Enter' && !isLoadingAll && topic.trim().length >=3 && handleGenerateAllMaterials()}
              disabled={isProcessingFile || isLoadingAll}
            />
            <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} title={t('generate.attachFile')} disabled={isLoadingAll || isProcessingFile}>
              {isProcessingFile ? <Loader2 className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />}
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf,audio/*,video/*" className="hidden" />
             {browserSupportsSpeechRecognition && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleVoiceCommand}
                disabled={isLoadingAll || isListening || isProcessingFile}
                aria-label={t('generate.useVoiceInput')}
                title={t('generate.useVoiceInput')}
              >
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-primary'}`} />
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {imagePreview && (
              <div className="relative w-28 h-28">
                <Image src={imagePreview} alt="Selected preview" layout="fill" objectFit="cover" className="rounded-md border-2 border-primary/50" />
                <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80" onClick={() => handleRemoveFile()}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            )}
            {pdfFileName && (
              <div className="mt-2 relative p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate flex-1" title={pdfFileName}>{pdfFileName}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full"><XCircle className="w-4 h-4 text-destructive/70" /></Button>
              </div>
            )}
            {audioFileName && (
              <div className="mt-2 relative p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                  <AudioLines className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate flex-1" title={audioFileName}>{audioFileName}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full"><XCircle className="w-4 h-4 text-destructive/70" /></Button>
              </div>
            )}
            {videoFileName && (
              <div className="mt-2 relative p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                  <Video className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate flex-1" title={videoFileName}>{videoFileName}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full"><XCircle className="w-4 h-4 text-destructive/70" /></Button>
              </div>
            )}
          </div>
          
          <Button
            onClick={() => handleGenerateAllMaterials()}
            disabled={isLoadingAll || isProcessingFile || (topic.trim().length < 3 && !pdfText && !imageData && !audioData && !videoData)}
            className="w-full text-base sm:text-lg py-3 transition-all duration-300 ease-in-out group active:scale-95"
            size="lg"
            variant="default"
          >
            {isLoadingAll ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <FileSignature className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-[5deg] group-hover:scale-110" />
            )}
            {isLoadingAll ? t('generate.button.loading') : t('generate.button.default')}
          </Button>
        </CardContent>
      </Card>

      {isLoadingAll && (
        <div className="text-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-2">AI is working its magic...</p>
        </div>
      )}
      {!isLoadingAll && (notesError || quizError || flashcardsError) && (
        <div className="space-y-4">
            {notesError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Notes Error</AlertTitle><AlertDescription>{notesError}</AlertDescription></Alert>}
            {quizError && <Alert variant="default" className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400 [&>svg]:text-yellow-500"><AlertTriangle className="h-4 w-4" /><AlertTitle>Quiz Info</AlertTitle><AlertDescription>{quizError}</AlertDescription></Alert>}
            {flashcardsError && <Alert variant="default" className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400 [&>svg]:text-yellow-500"><AlertTriangle className="h-4 w-4" /><AlertTitle>Flashcards Info</AlertTitle><AlertDescription>{flashcardsError}</AlertDescription></Alert>}
        </div>
      )}
    </div>
  );
}
