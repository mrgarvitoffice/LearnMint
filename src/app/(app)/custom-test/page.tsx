
"use client";

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { generateQuizAction } from '@/lib/actions';
import type { TestSettings, QuizQuestion as TestQuestionType, GenerateQuizQuestionsOutput } from '@/lib/types';
import { Loader2, TestTubeDiagonal, CheckCircle, XCircle, RotateCcw, Clock, Lightbulb, AlertTriangle, Mic, Sparkles, Award, HelpCircle, TimerIcon, PlayCircle, PauseCircle, StopCircle, ImageIcon, FileText, AudioLines, Video } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { GuestLock } from '@/components/features/auth/GuestLock';
import { extractTextFromPdf } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

const MAX_RECENT_TOPICS_DISPLAY = 10;
const MAX_RECENT_TOPICS_SELECT = 3;
const RECENT_TOPICS_LS_KEY = 'learnmint-recent-topics';
const NOTES_TRUNCATION_LIMIT = 4000; // Character limit for notes sent to AI

const formSchema = z.object({
  sourceType: z.enum(['topic', 'notes', 'recent']).default('topic'),
  topics: z.string().optional(),
  notes: z.string().optional(),
  notesImage: z.string().optional(),
  notesAudio: z.string().optional(),
  notesVideo: z.string().optional(),
  selectedRecentTopics: z.array(z.string()).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  numQuestions: z.coerce.number().min(1, 'Min 1 question').max(50, 'Max 50 questions').default(5),
  timer: z.coerce.number().min(0, 'Timer cannot be negative').default(0),
  perQuestionTimer: z.coerce.number().min(0, 'Per-question timer cannot be negative').optional().default(0),
});

type FormData = z.infer<typeof formSchema>;

interface CustomTestState {
  settings: TestSettings;
  questions: TestQuestionType[];
  userAnswers: (string | undefined)[];
  currentQuestionIndex: number;
  showResults: boolean;
  score: number;
  timeLeft?: number;
  currentQuestionTimeLeft?: number;
  isAutoSubmitting?: boolean;
  performanceTag?: string;
}

export default function CustomTestPage() {
  const { user } = useAuth();
  const [testState, setTestState] = useState<CustomTestState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);
  const [recentTopicsSelectionDone, setRecentTopicsSelectionDone] = useState(false);
  
  const [notesImagePreview, setNotesImagePreview] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);

  const notesFileRef = useRef<HTMLInputElement>(null);

  const { t, isReady } = useTranslation();
  const { toast } = useToast();
  const { playSound: playCorrectSound } = useSound('/sounds/correct-answer.mp3', { priority: 'essential' });
  const { playSound: playIncorrectSound } = useSound('/sounds/incorrect-answer.mp3', { priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { priority: 'essential' });

  const { speak, setVoicePreference } = useTTS();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  
  const pageTitleSpokenRef = useRef(false);
  const resultAnnouncementSpokenRef = useRef(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceType: 'topic', difficulty: 'medium', numQuestions: 5, timer: 0, perQuestionTimer: 0, selectedRecentTopics: [], 
      notesImage: undefined, notesAudio: undefined, notesVideo: undefined
    }
  });

  const sourceType = watch('sourceType');
  const selectedRecentTopicsWatch = watch('selectedRecentTopics');
  
  const getPerformanceTag = useCallback((percentage: number): string => {
    if (percentage === 100) return t('customTest.results.performance.conqueror');
    if (percentage >= 90) return t('customTest.results.performance.ace');
    if (percentage >= 80) return t('customTest.results.performance.diamond');
    if (percentage >= 70) return t('customTest.results.performance.gold');
    if (percentage >= 50) return t('customTest.results.performance.bronze');
    return t('customTest.results.performance.practice');
  }, [t]);

  const handleSubmitTest = useCallback((autoSubmitted = false) => {
    if (!autoSubmitted) playClickSound();
    setTestState(prevTestState => {
      if (!prevTestState || prevTestState.showResults) return prevTestState;

      let currentScore = 0;
      const updatedQuestions = prevTestState.questions.map((q, index) => {
        const userAnswer = prevTestState.userAnswers[index];
        const isCorrect = userAnswer !== undefined && q.answer !== undefined && userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
        if (isCorrect) currentScore += 4;
        else if (userAnswer !== undefined && userAnswer.trim() !== "") currentScore -= 1;

        if (!autoSubmitted && index === prevTestState.currentQuestionIndex) {
          if (isCorrect) playCorrectSound(); else if (userAnswer !== undefined && userAnswer.trim() !== "") playIncorrectSound();
        }
        return { ...q, userAnswer, isCorrect };
      });

      const totalPossibleScore = prevTestState.questions.length * 4;
      const percentage = totalPossibleScore > 0 ? Math.max(0, (currentScore / totalPossibleScore) * 100) : 0;
      const calculatedPerformanceTag = getPerformanceTag(percentage);

      if (!resultAnnouncementSpokenRef.current) {
        const ttsMessage = `${t(autoSubmitted ? 'customTest.toast.autoSubmittedTitle' : 'customTest.toast.submittedTitle')}! ${t('customTest.toast.scoreMessage', { score: currentScore, totalPossibleScore })}. ${t('customTest.toast.performanceMessage', { performanceTag: calculatedPerformanceTag })}!`;
        speak(ttsMessage, { priority: 'essential' });
        resultAnnouncementSpokenRef.current = true;
      }
      if (!autoSubmitted || (autoSubmitted && !prevTestState.isAutoSubmitting)) {
        toast({ title: autoSubmitted ? t('customTest.toast.autoSubmittedTitle') : t('customTest.toast.submittedTitle'), description: `${t('customTest.toast.scoreMessage', { score: currentScore, totalPossibleScore })} (${percentage.toFixed(1)}%). ${t('customTest.toast.performanceMessage', { performanceTag: calculatedPerformanceTag })}` });
      }

      return {
        ...prevTestState, questions: updatedQuestions, score: currentScore, showResults: true, isAutoSubmitting: autoSubmitted,
        timeLeft: autoSubmitted && prevTestState.timeLeft !== undefined ? 0 : prevTestState.timeLeft,
        performanceTag: calculatedPerformanceTag, currentQuestionTimeLeft: undefined,
      };
    });
  }, [playClickSound, getPerformanceTag, playCorrectSound, playIncorrectSound, speak, toast, t]);

  useEffect(() => { setVoicePreference('holo'); }, [setVoicePreference]);

  useEffect(() => {
    if (sourceType !== 'recent' || (selectedRecentTopicsWatch && selectedRecentTopicsWatch.length === 0)) {
      setRecentTopicsSelectionDone(false);
    }
  }, [sourceType, selectedRecentTopicsWatch]);

  const handleConfirmRecentTopics = () => {
    playClickSound();
    if (selectedRecentTopicsWatch && selectedRecentTopicsWatch.length > 0) {
      setRecentTopicsSelectionDone(true);
      toast({ title: t('customTest.toast.topicsConfirmedTitle'), description: t('customTest.toast.topicsConfirmedDesc') });
    } else {
      toast({ title: t('customTest.toast.noTopicsSelectedTitle'), description: t('customTest.toast.noTopicsSelectedDesc'), variant: "destructive" });
    }
  };
  
  useEffect(() => {
    if (!isReady || pageTitleSpokenRef.current) return;
    const timer = setTimeout(() => {
      if (!testState && !isLoading) {
        speak(t('customTest.pageTitle'), { priority: 'optional' });
        pageTitleSpokenRef.current = true;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [speak, testState, isLoading, t, isReady]);

  useEffect(() => { if (isLoading) speak(t('customTest.generate.speak.creating'), { priority: 'optional' }); }, [isLoading, speak, t]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTopics = localStorage.getItem(RECENT_TOPICS_LS_KEY);
      if (storedTopics) {
        try { setRecentTopics(JSON.parse(storedTopics).slice(0, MAX_RECENT_TOPICS_DISPLAY)); }
        catch (e) { console.error("Failed to parse recent topics", e); localStorage.removeItem(RECENT_TOPICS_LS_KEY); }
      }
    }
  }, []);

  useEffect(() => {
    if (testState && typeof testState.timeLeft === 'number' && testState.timeLeft > 0 && !testState.showResults) {
      const timerId = setInterval(() => {
        setTestState(currentTestState => {
          if (!currentTestState || typeof currentTestState.timeLeft !== 'number' || currentTestState.timeLeft <= 0 || currentTestState.showResults) {
            clearInterval(timerId);
            return currentTestState;
          }
          const newTimeLeftVal = currentTestState.timeLeft - 1;
          if (newTimeLeftVal <= 0) {
            clearInterval(timerId);
            toast({ title: t('customTest.test.toast.timesUp'), description: t('customTest.test.toast.timesUpDesc'), variant: "default" });
            handleSubmitTest(true);
            return { ...currentTestState, timeLeft: 0, isAutoSubmitting: true };
          }
          return { ...currentTestState, timeLeft: newTimeLeftVal };
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [testState?.timeLeft, testState?.showResults, handleSubmitTest, toast, t]);
  
  const handleNextQuestion = useCallback(() => {
      playClickSound();
      setTestState(prev => {
          if (!prev || prev.currentQuestionIndex >= prev.questions.length - 1 || prev.isAutoSubmitting) {
              if (!prev?.isAutoSubmitting) handleSubmitTest(false);
              return prev;
          }
          const nextIndex = prev.currentQuestionIndex + 1;
          const nextQuestionTime = prev.settings.perQuestionTimer && prev.settings.perQuestionTimer > 0 ? prev.settings.perQuestionTimer : undefined;
          return { ...prev, currentQuestionIndex: nextIndex, currentQuestionTimeLeft: nextQuestionTime };
      });
  }, [playClickSound, handleSubmitTest]);

  useEffect(() => {
    if (testState && !testState.showResults && testState.settings.perQuestionTimer && testState.settings.perQuestionTimer > 0) {
      const timerId = setInterval(() => {
        setTestState(prev => {
          if (!prev || prev.showResults || !prev.currentQuestionTimeLeft || prev.currentQuestionTimeLeft <= 0) {
            clearInterval(timerId);
            return prev;
          }
          const newTimeLeft = prev.currentQuestionTimeLeft - 1;
          if (newTimeLeft <= 0) {
            clearInterval(timerId);
            toast({ title: t('customTest.test.toast.questionTimesUp'), variant: "default" });
            handleNextQuestion();
            return { ...prev, currentQuestionTimeLeft: 0 };
          }
          return { ...prev, currentQuestionTimeLeft: newTimeLeft };
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [testState?.currentQuestionIndex, testState?.settings.perQuestionTimer, testState?.showResults, handleNextQuestion, toast, t]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    playActionSound();
    setIsLoading(true); setTestState(null);
    resultAnnouncementSpokenRef.current = false;
    pageTitleSpokenRef.current = true; 
    speak(t('customTest.generate.speak.creating'), { priority: 'optional' });

    let topicForAI = ""; let topicsForSettings: string[] = []; let notesForAI = "";
    if (data.sourceType === 'topic' && data.topics) {
        topicForAI = data.topics; topicsForSettings = [data.topics];
    } else if (data.sourceType === 'notes' && data.notes) {
        notesForAI = data.notes;
        if (notesForAI.length > NOTES_TRUNCATION_LIMIT) {
          const truncatedNotes = `${notesForAI.substring(0, NOTES_TRUNCATION_LIMIT / 2)}... (content truncated) ...${notesForAI.substring(notesForAI.length - NOTES_TRUNCATION_LIMIT / 2)}`;
          topicForAI = `questions based on the following notes: ${truncatedNotes}`;
          toast({ title: t('customTest.generate.toast.notesTruncatedTitle'), description: t('customTest.generate.toast.notesTruncatedDesc'), variant: "default"});
        } else {
          topicForAI = `questions based on the following notes: ${notesForAI}`;
        }
        topicsForSettings = [t('customTest.generate.notesBasedTest')];
    } else if (data.sourceType === 'recent' && data.selectedRecentTopics && data.selectedRecentTopics.length > 0) {
        topicForAI = data.selectedRecentTopics.join(', '); topicsForSettings = data.selectedRecentTopics;
    } else {
        toast({ title: t('customTest.generate.toast.errorTitle'), description: t('customTest.generate.error.noSource'), variant: "destructive" });
        setIsLoading(false); return;
    }

    const settings: TestSettings = {
      topics: topicsForSettings, sourceType: data.sourceType, selectedRecentTopics: data.selectedRecentTopics,
      notes: data.notes, difficulty: data.difficulty, numQuestions: data.numQuestions,
      timer: data.timer, perQuestionTimer: data.perQuestionTimer
    };

    try {
      const result: GenerateQuizQuestionsOutput = await generateQuizAction({
        topic: topicForAI,
        numQuestions: settings.numQuestions,
        difficulty: settings.difficulty,
        image: data.sourceType === 'notes' ? data.notesImage : undefined,
        audio: data.sourceType === 'notes' ? data.notesAudio : undefined,
        video: data.sourceType === 'notes' ? data.notesVideo : undefined,
      });

      if (result.questions && result.questions.length > 0) {
        setTestState({
          settings, questions: result.questions, userAnswers: Array(result.questions.length).fill(undefined),
          currentQuestionIndex: 0, showResults: false, score: 0,
          timeLeft: settings.timer && settings.timer > 0 ? settings.timer * 60 : undefined,
          currentQuestionTimeLeft: settings.perQuestionTimer && settings.perQuestionTimer > 0 ? settings.perQuestionTimer : undefined,
        });
        toast({ title: t('customTest.generate.toast.successTitle'), description: t('customTest.generate.toast.successDesc') });
        speak(t('customTest.generate.speak.success'), { priority: 'essential' });
      } else {
        toast({ title: t('customTest.generate.toast.noQuestionsTitle'), description: t('customTest.generate.toast.noQuestionsDesc'), variant: 'destructive' });
        speak(t('customTest.generate.speak.noQuestions'), { priority: 'essential' });
      }
    } catch (error) {
      console.error('Error generating custom test:', error);
      const errorMessage = error instanceof Error ? error.message : t('customTest.generate.toast.errorTitle');
      toast({ title: t('customTest.generate.toast.errorTitle'), description: errorMessage, variant: 'destructive' });
      speak(t('customTest.generate.speak.error'), { priority: 'essential' });
    } finally { setIsLoading(false); }
  };

  const handleAnswerSelect = (answer: string) => { 
    playClickSound();
    if (!testState || testState.showResults || testState.isAutoSubmitting) return;
    const newUserAnswers = [...testState.userAnswers];
    newUserAnswers[testState.currentQuestionIndex] = answer;
    setTestState({ ...testState, userAnswers: newUserAnswers });
  };

  const handleShortAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!testState || testState.showResults || testState.isAutoSubmitting) return;
    const newUserAnswers = [...testState.userAnswers];
    newUserAnswers[testState.currentQuestionIndex] = e.target.value;
    setTestState(prev => prev ? { ...prev, userAnswers: newUserAnswers } : null);
  };

  const handlePrevQuestion = () => {
    playClickSound();
    if (!testState || testState.currentQuestionIndex <= 0 || testState.isAutoSubmitting) return;
    setTestState(prev => {
      if (!prev) return null;
      const prevQuestionTime = prev.settings.perQuestionTimer && prev.settings.perQuestionTimer > 0 ? prev.settings.perQuestionTimer : undefined;
      return { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1, currentQuestionTimeLeft: prevQuestionTime };
    });
  };

  const handleRetakeTest = () => {
    playActionSound(); 
    if (!testState) return;
    const originalSettings = testState.settings;
    setIsLoading(true); setTestState(null);
    resultAnnouncementSpokenRef.current = false;
    pageTitleSpokenRef.current = true;

    speak(t('customTest.generate.speak.creating'), { priority: 'optional' });
    let topicForAI = "";
    if (originalSettings.sourceType === 'topic' && originalSettings.topics.length > 0) topicForAI = originalSettings.topics.join(', ');
    else if (originalSettings.sourceType === 'notes' && originalSettings.notes) topicForAI = `questions based on the following notes: ${originalSettings.notes}`;
    else if (originalSettings.sourceType === 'recent' && originalSettings.selectedRecentTopics && originalSettings.selectedRecentTopics.length > 0) topicForAI = originalSettings.selectedRecentTopics.join(', ');

    generateQuizAction({ topic: `${topicForAI}`, numQuestions: originalSettings.numQuestions, difficulty: originalSettings.difficulty })
      .then(result => {
        if (result.questions && result.questions.length > 0) {
          setTestState({
            settings: originalSettings, questions: result.questions, userAnswers: Array(result.questions.length).fill(undefined),
            currentQuestionIndex: 0, showResults: false, score: 0,
            timeLeft: originalSettings.timer && originalSettings.timer > 0 ? originalSettings.timer * 60 : undefined,
            currentQuestionTimeLeft: originalSettings.perQuestionTimer && originalSettings.perQuestionTimer > 0 ? originalSettings.perQuestionTimer : undefined,
          });
          speak(t('customTest.generate.speak.success'), { priority: 'essential' });
        } else {
          toast({ title: t('customTest.toast.retakeErrorTitle'), description: t('customTest.toast.retakeErrorDesc'), variant: 'destructive' });
          speak(t('customTest.generate.speak.error'), { priority: 'essential' });
        }
      })
      .catch(error => { console.error('Error retaking test:', error); const errorMessage = error instanceof Error ? error.message : 'Failed to retake test.'; toast({ title: 'Error', description: errorMessage, variant: 'destructive' }); })
      .finally(() => { setIsLoading(false); });
  };

  const handleNewTest = () => {
    playActionSound(); 
    setTestState(null);
    pageTitleSpokenRef.current = false; resultAnnouncementSpokenRef.current = false;
    setValue('topics', ''); setValue('notes', ''); setValue('selectedRecentTopics', []);
    setValue('difficulty', 'medium'); setValue('numQuestions', 5); setValue('timer', 0); setValue('perQuestionTimer', 0);
    setValue('notesImage', undefined);
    setValue('notesAudio', undefined);
    setValue('notesVideo', undefined);
    setRecentTopicsSelectionDone(false);
    handleRemoveFile(false);
  };

  const overallTimeLeft = testState?.timeLeft;
  const perQuestionTimeLeft = testState?.currentQuestionTimeLeft;

  const formatTime = (seconds?: number) => {
    if (seconds === undefined || seconds < 0) return null;
    const mins = Math.floor(seconds / 60); const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleMicClick = () => { playClickSound(); if (isListening) stopListening(); else startListening(); };

  useEffect(() => {
    if (transcript && sourceType === 'topic') setValue('topics', transcript);
    if (transcript && sourceType === 'notes') setValue('notes', transcript);
  }, [transcript, sourceType, setValue]);

  const handleRecentTopicChange = (topic: string) => {
    playClickSound(); const currentSelected = selectedRecentTopicsWatch || []; let newSelected: string[];
    if (currentSelected.includes(topic)) newSelected = currentSelected.filter(t => t !== topic);
    else {
      if (currentSelected.length < MAX_RECENT_TOPICS_SELECT) newSelected = [...currentSelected, topic];
      else { toast({ title: t('customTest.recent.error.tooManySelected', { count: MAX_RECENT_TOPICS_SELECT }), variant: "default" }); return; }
    }
    setValue('selectedRecentTopics', newSelected, { shouldValidate: true });
  };
  
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playClickSound();
    handleRemoveFile(false);

    if (file.type.startsWith('image/')) {
        if (file.size > 2 * 1024 * 1024) { toast({ title: t('customTest.file.image.tooLarge'), description: t('customTest.file.image.tooLargeDesc'), variant: "destructive" }); return; }
        const reader = new FileReader();
        reader.onloadend = () => { setNotesImagePreview(reader.result as string); setValue('notesImage', reader.result as string); };
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
        if (file.size > 5 * 1024 * 1024) { toast({ title: t('customTest.file.pdf.tooLarge'), description: t('customTest.file.pdf.tooLargeDesc'), variant: "destructive" }); return; }
        setPdfFileName(file.name);
        try {
            const text = await extractTextFromPdf(file);
            setValue('notes', text);
            toast({ title: t('customTest.file.pdf.processed'), description: t('customTest.file.pdf.processedDesc') });
        } catch(err) {
            toast({ title: t('customTest.file.pdf.error'), description: t('customTest.file.pdf.errorDesc'), variant: "destructive" });
            setPdfFileName(null);
        }
    } else if (file.type.startsWith('audio/')) {
        if (file.size > 25 * 1024 * 1024) { toast({ title: t('customTest.file.audio.tooLarge'), description: t('customTest.file.audio.tooLargeDesc'), variant: "destructive" }); return; }
        const reader = new FileReader();
        reader.onloadend = () => { setAudioFileName(file.name); setValue('notesAudio', reader.result as string); };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
        if (file.size > 25 * 1024 * 1024) { toast({ title: t('customTest.file.video.tooLarge'), description: t('customTest.file.video.tooLargeDesc'), variant: "destructive" }); return; }
        const reader = new FileReader();
        reader.onloadend = () => { setVideoFileName(file.name); setValue('notesVideo', reader.result as string); };
        reader.readAsDataURL(file);
    } else {
        toast({ title: t('customTest.file.unsupported'), description: t('customTest.file.unsupportedDesc'), variant: "default" });
    }
  };

  const handleRemoveFile = (withSound = true) => {
    if (withSound) playClickSound();
    setNotesImagePreview(null);
    setValue('notesImage', undefined);
    setPdfFileName(null);
    setAudioFileName(null);
    setValue('notesAudio', undefined);
    setVideoFileName(null);
    setValue('notesVideo', undefined);
    if (notesFileRef.current) {
      notesFileRef.current.value = "";
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.isAnonymous) {
    return (
      <GuestLock
        featureName="guestLock.features.customTest"
        featureDescription="guestLock.features.customTestDesc"
        Icon={TestTubeDiagonal}
      />
    );
  }
  
  if (!testState) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4"><TestTubeDiagonal className="h-12 w-12 text-primary" /></div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex-1 text-center">{t('customTest.pageTitle')}</CardTitle>
            </div>
            <CardDescription className="text-sm sm:text-base text-muted-foreground px-2">{t('customTest.pageDescription')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 p-6">
              <div>
                <Label className="text-base font-semibold mb-2 block">{t('customTest.sourceTitle')}</Label>
                <Controller name="sourceType" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={(value) => { playClickSound(); field.onChange(value); setRecentTopicsSelectionDone(false); }} value={field.value} className="flex flex-col sm:flex-row gap-4">
                    <Label htmlFor="source-topic" className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-primary/20 has-[:checked]:border-primary cursor-pointer flex-1 transition-all"><RadioGroupItem value="topic" id="source-topic" /> <span>{t('customTest.source.topic')}</span></Label>
                    <Label htmlFor="source-notes" className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-primary/20 has-[:checked]:border-primary cursor-pointer flex-1 transition-all"><RadioGroupItem value="notes" id="source-notes" /> <span>{t('customTest.source.notes')}</span></Label>
                    <Label htmlFor="source-recent" className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-primary/20 has-[:checked]:border-primary cursor-pointer flex-1 transition-all"><RadioGroupItem value="recent" id="source-recent" /> <span>{t('customTest.source.recent')}</span></Label>
                  </RadioGroup>
                )} />
              </div>
              {sourceType === 'topic' && (
                <div className="space-y-2 animate-in fade-in-50">
                  <Label htmlFor="topics" className="text-base">{t('customTest.source.topic')}</Label>
                  <div className="flex gap-2">
                    <Input id="topics" placeholder={t('customTest.topic.placeholder')} {...register('topics')} className="transition-colors duration-200 ease-in-out text-base" />
                    {browserSupportsSpeechRecognition && (<Button type="button" variant="outline" size="icon" onClick={handleMicClick} disabled={isLoading || isListening} title={t('customTest.voice.useInput')}><Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} /></Button>)}
                  </div>
                  {errors.topics && <p className="text-sm text-destructive">{errors.topics.message || t('customTest.topic.error.minLength')}</p>}
                  {voiceError && <p className="text-sm text-destructive">{t('customTest.voice.error')}</p>}
                </div>
              )}
              {sourceType === 'notes' && (
                <div className="space-y-2 animate-in fade-in-50">
                  <Label htmlFor="notes" className="text-base">{t('customTest.source.notes')}</Label>
                   <div className="flex gap-2">
                    <Textarea id="notes" placeholder={t('customTest.notes.placeholder')} {...register('notes')} rows={6} className="transition-colors duration-200 ease-in-out text-base flex-1" />
                    <div className="flex flex-col gap-2">
                      <Button type="button" variant="outline" size="icon" onClick={() => notesFileRef.current?.click()} title={t('customTest.notes.attachFile')}>
                        <ImageIcon className="w-5 h-5" />
                      </Button>
                      {browserSupportsSpeechRecognition && (
                        <Button type="button" variant="outline" size="icon" onClick={handleMicClick} disabled={isLoading || isListening} title={t('customTest.voice.useInput')}>
                          <Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                  {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes.message || t('customTest.notes.error.minLength')}</p>}
                  
                  <div className="flex flex-wrap gap-2">
                    {notesImagePreview && (
                      <div className="relative w-20 h-20 mt-2">
                        <Image src={notesImagePreview} alt={t('customTest.file.image.previewAlt')} layout="fill" objectFit="cover" className="rounded-md" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground" title={t('customTest.file.image.remove')}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {pdfFileName && (
                      <div className="mt-2 relative p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground truncate flex-1">{pdfFileName}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full" title={t('customTest.file.pdf.remove')}><XCircle className="w-4 h-4 text-destructive/70" /></Button>
                      </div>
                    )}
                    {audioFileName && (
                      <div className="mt-2 relative p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                          <AudioLines className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground truncate flex-1">{audioFileName}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full" title={t('customTest.file.audio.remove')}><XCircle className="w-4 h-4 text-destructive/70" /></Button>
                      </div>
                    )}
                    {videoFileName && (
                      <div className="mt-2 relative p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                          <Video className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground truncate flex-1">{videoFileName}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full" title={t('customTest.file.video.remove')}><XCircle className="w-4 h-4 text-destructive/70" /></Button>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={notesFileRef} onChange={handleFileUpload} accept="image/*,application/pdf,audio/*,video/*" className="hidden" />
                  {voiceError && <p className="text-sm text-destructive">{t('customTest.voice.error')}</p>}
                </div>
              )}
              {sourceType === 'recent' && (
                <div className="space-y-3 animate-in fade-in-50">
                  <Label className="text-base font-semibold">{t('customTest.recent.title', { count: MAX_RECENT_TOPICS_SELECT })}</Label>
                  {recentTopics.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-muted/30">
                      {recentTopics.map(topic => (
                        <Label key={topic} htmlFor={`recent-${topic}`} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer has-[:checked]:bg-primary/10 transition-colors">
                          <Checkbox id={`recent-${topic}`} checked={(selectedRecentTopicsWatch || []).includes(topic)} onCheckedChange={() => handleRecentTopicChange(topic)} disabled={(selectedRecentTopicsWatch || []).length >= MAX_RECENT_TOPICS_SELECT && !(selectedRecentTopicsWatch || []).includes(topic)} />
                          <span className="text-sm">{topic}</span>
                        </Label>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground p-2 border rounded-md">{t('customTest.recent.empty')}</p>}
                  {errors.selectedRecentTopics && <p className="text-sm text-destructive">{errors.selectedRecentTopics.message || t('customTest.recent.error.noneSelected')}</p>}
                  
                  {recentTopics.length > 0 && selectedRecentTopicsWatch && selectedRecentTopicsWatch.length > 0 && !recentTopicsSelectionDone && (
                    <Button type="button" onClick={handleConfirmRecentTopics} variant="secondary" className="mt-2">{t('customTest.recent.confirmButton')}</Button>
                  )}
                  {recentTopicsSelectionDone && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 p-2 border border-green-500 bg-green-500/10 rounded-md text-sm">
                      <CheckCircle className="h-5 w-5" />
                      <span>{t('customTest.recent.confirmedMessage')}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-base">{t('customTest.settings.difficulty.label')}</Label>
                  <Controller name="difficulty" control={control} render={({ field }) => (
                    <Select onValueChange={(value) => { playClickSound(); field.onChange(value); }} value={field.value}>
                      <SelectTrigger id="difficulty" className="text-base"><SelectValue placeholder={t('customTest.settings.difficulty.placeholder')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">{t('customTest.settings.difficulty.easy')}</SelectItem>
                        <SelectItem value="medium">{t('customTest.settings.difficulty.medium')}</SelectItem>
                        <SelectItem value="hard">{t('customTest.settings.difficulty.hard')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numQuestions" className="text-base">{t('customTest.settings.numQuestions.label')}</Label>
                  <Input id="numQuestions" type="number" {...register('numQuestions')} className="transition-colors duration-200 ease-in-out text-base" />
                  {errors.numQuestions && <p className="text-sm text-destructive">{errors.numQuestions.message || t('customTest.settings.numQuestions.error.min')}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timer" className="text-base">{t('customTest.settings.timer.label')}</Label>
                  <Input id="timer" type="number" {...register('timer')} className="transition-colors duration-200 ease-in-out text-base" />
                  {errors.timer && <p className="text-sm text-destructive">{errors.timer.message || t('customTest.settings.timer.error.negative')}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perQuestionTimer" className="text-base">{t('customTest.settings.perQuestionTimer.label')}</Label>
                  <Input id="perQuestionTimer" type="number" {...register('perQuestionTimer')} className="transition-colors duration-200 ease-in-out text-base" />
                  {errors.perQuestionTimer && <p className="text-sm text-destructive">{errors.perQuestionTimer.message || t('customTest.settings.perQuestionTimer.error.negative')}</p>}
                  <p className="text-xs text-muted-foreground/80">{t('customTest.settings.perQuestionTimer.description')}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/80 text-center">{t('customTest.settings.markingScheme')}</p>
            </CardContent>
            <CardFooter className="justify-center p-6">
              <Button type="submit" size="lg" disabled={isLoading} className="min-w-[200px] group">
                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-[360deg] group-hover:scale-125" />}
                {isLoading ? t('customTest.generateButton.loading') : t('customTest.generateButton.default')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  const currentQuestionData = testState.questions[testState.currentQuestionIndex];
  const currentAnswerForQuestion = testState?.userAnswers[testState.currentQuestionIndex];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card>
        {!testState.showResults && currentQuestionData ? (
          <>
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl text-primary font-bold truncate max-w-md">{t('customTest.test.title', { topics: testState.settings.topics.join(', ').substring(0, 50) + (testState.settings.topics.join(', ').length > 50 ? "..." : ""), difficulty: testState.settings.difficulty })}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {overallTimeLeft !== undefined && formatTime(overallTimeLeft) !== null && (<span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {t('customTest.test.totalTime', { time: formatTime(overallTimeLeft)! })}</span>)}
                  {perQuestionTimeLeft !== undefined && testState.settings.perQuestionTimer && testState.settings.perQuestionTimer > 0 && formatTime(perQuestionTimeLeft) !== null && (<span className="flex items-center gap-1"><TimerIcon className="w-4 h-4 text-destructive animate-pulse" /> {t('customTest.test.questionTime', { time: formatTime(perQuestionTimeLeft)! })}</span>)}
                </div>
              </div>
              <Progress value={((testState.currentQuestionIndex + 1) / testState.questions.length) * 100} className="w-full mt-3 h-2.5" />
              <CardDescription className="mt-2 text-center sm:text-left">{t('customTest.test.questionProgress', { current: testState.currentQuestionIndex + 1, total: testState.questions.length })}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <ReactMarkdown className="text-lg font-semibold prose dark:prose-invert max-w-none">{currentQuestionData.question}</ReactMarkdown>
              
              {currentQuestionData.type === 'short-answer' ? (
                <Input value={currentAnswerForQuestion || ''} onChange={handleShortAnswerChange} disabled={testState.showResults || testState.isAutoSubmitting} placeholder={t('customTest.test.shortAnswerPlaceholder')} className="text-base" aria-label="Short answer input"/>
              ) : currentQuestionData.options ? (
                <RadioGroup onValueChange={handleAnswerSelect} value={currentAnswerForQuestion} className="space-y-3">
                  {currentQuestionData.options.map((option, i) => (
                    <Label key={i} htmlFor={`option-${i}-${testState.currentQuestionIndex}`} className={cn("flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer transition-all", currentAnswerForQuestion === option && "bg-primary/20 border-primary", (testState.showResults || testState.isAutoSubmitting) && "cursor-not-allowed opacity-70")}>
                      <RadioGroupItem value={option} id={`option-${i}-${testState.currentQuestionIndex}`} disabled={testState.showResults || testState.isAutoSubmitting}/>
                      <span className="text-base">{option}</span>
                    </Label>
                  ))}
                </RadioGroup>
              ) : (<p className="text-muted-foreground">{t('quizView.unavailable')}</p>)}
            </CardContent>
            <CardFooter className="flex justify-between p-6 border-t">
              <Button variant="outline" onClick={handlePrevQuestion} disabled={testState.currentQuestionIndex === 0 || testState.isAutoSubmitting}>{t('customTest.test.previousButton')}</Button>
              {testState.currentQuestionIndex < testState.questions.length - 1 ? (<Button onClick={handleNextQuestion} disabled={testState.isAutoSubmitting}>{t('customTest.test.nextButton')}</Button>) : (<Button onClick={() => handleSubmitTest(false)} variant="default" disabled={testState.isAutoSubmitting}>{t('customTest.test.submitButton')}</Button>)}
            </CardFooter>
          </>
        ) : testState.showResults ? (
          <Card>
            <CardHeader className="text-center border-b pb-4">
              <CardTitle className="text-3xl font-bold text-primary">{t('customTest.results.title')}</CardTitle>
              <CardDescription className="text-lg">{t('customTest.results.scoreMessage', { score: testState.score, totalPossibleScore: testState.questions.length * 4, percentage: ((testState.score / (testState.questions.length * 4 || 1)) * 100).toFixed(1) })}</CardDescription>
              {testState.performanceTag && (<Badge variant={testState.performanceTag === t('customTest.results.performance.conqueror') || testState.performanceTag === t('customTest.results.performance.ace') ? "default" : testState.performanceTag === t('customTest.results.performance.diamond') || testState.performanceTag === t('customTest.results.performance.gold') ? "secondary" : testState.performanceTag === t('customTest.results.performance.bronze') ? "outline" : "destructive"} className="mx-auto mt-2 text-base px-4 py-1.5 shadow-md"><Award className="w-5 h-5 mr-2" /> {testState.performanceTag}</Badge>)}
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-center mb-4 text-muted-foreground">{t('customTest.results.reviewTitle')}</h3>
              {testState.questions.map((q, index) => (
                <Card key={index} className={cn("overflow-hidden shadow-sm", q.isCorrect ? 'border-green-500/70 bg-green-500/10' : (q.userAnswer !== undefined && q.userAnswer.trim() !== "") ? 'border-destructive/70 bg-destructive/10' : 'border-border bg-muted/30')}>
                  <CardHeader className="pb-3 pt-4 px-4"><CardTitle className="text-base flex items-start gap-2">{q.isCorrect ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : (q.userAnswer !== undefined && q.userAnswer.trim() !== "") ? <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" /> : <HelpCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />}<span className="font-normal text-sm text-muted-foreground mr-1">{t('customTest.results.questionPrefix', { index: index + 1 })}:</span><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none inline leading-tight">{q.question}</ReactMarkdown></CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1 px-4 pb-4">
                    <p>{t('customTest.results.yourAnswer', { answer: '' })} <span className="font-medium">{q.userAnswer || t('customTest.results.notAnswered')}</span></p>
                    {!q.isCorrect && <p>{t('customTest.results.correctAnswer', { answer: '' })} <span className="font-medium text-green-600 dark:text-green-500">{q.answer}</span></p>}
                    {q.explanation && (<Alert variant="default" className="mt-2 bg-accent/10 border-accent/30 p-3"><Lightbulb className="h-4 w-4 text-accent-foreground/80" /><AlertTitle className="text-xs font-semibold">{t('customTest.results.explanation')}</AlertTitle><AlertDescription className="prose prose-xs dark:prose-invert max-w-none text-muted-foreground"><ReactMarkdown>{q.explanation}</ReactMarkdown></AlertDescription></Alert>)}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 p-6 border-t">
              <Button onClick={handleRetakeTest} disabled={isLoading} size="lg"><RotateCcw className="w-4 h-4 mr-2" />{t('customTest.results.retakeButton')}</Button>
              <Button variant="outline" onClick={handleNewTest} size="lg">{t('customTest.results.newTestButton')}</Button>
            </CardFooter>
          </Card>
        ) : (
          <Card><CardHeader className="text-center"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" /><AlertTitle className="text-xl font-semibold">{t('customTest.results.error.title')}</AlertTitle></CardHeader><CardContent className="text-center"><AlertDescription className="text-muted-foreground">{t('customTest.results.error.description')}</AlertDescription><Button variant="outline" onClick={handleNewTest} className="mt-6">{t('customTest.results.newTestButton')}</Button></CardContent></Card>
        )}
      </Card>
    </div>
  );
}
