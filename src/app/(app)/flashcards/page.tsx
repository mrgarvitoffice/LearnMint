
"use client";

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, Sparkles, AudioLines, Mic, Layers, FileText, Image as ImageIcon, XCircle, PlayCircle, PauseCircle, StopCircle, Users, Download, MonitorPlay } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { generateAudioFlashcardsAction, generateAudioSummaryAction, generateDiscussionAudioAction } from '@/lib/actions';
import type { GenerateAudioFlashcardsOutput, GenerateAudioSummaryOutput, GenerateDiscussionAudioOutput } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import FlashcardItem from '@/components/study/FlashcardItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from '@/hooks/useTranslation';
import NextImage from 'next/image';
import { extractTextFromPdf } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useTTS } from '@/hooks/useTTS';
import { useAuth } from '@/contexts/AuthContext';
import { GuestLock } from '@/components/features/auth/GuestLock';
import { useSettings } from '@/contexts/SettingsContext';
import { APP_LANGUAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import PptxGenJS from 'pptxgenjs';
import { Logo } from '@/components/icons/Logo';


// Sub-component for Audio Flashcards
function AudioFlashcardsGenerator() {
  const { t } = useTranslation();
  const { appLanguage } = useSettings();
  const [topic, setTopic] = useState('');
  const [numFlashcards, setNumFlashcards] = useState(10);
  const [generatedContent, setGeneratedContent] = useState<GenerateAudioFlashcardsOutput | null>(null);
  const [discussionAudio, setDiscussionAudio] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceRecognition();
  const { speak, cancelTTS, isSpeaking, isPaused, pauseTTS, resumeTTS, isLoading: isTTSLoading } = useTTS();

  const { mutate: generate, isPending: isLoading } = useMutation({
    mutationFn: generateAudioFlashcardsAction,
    onSuccess: (data) => {
      if (!data.flashcards || data.flashcards.length === 0) {
        toast({ title: t('generate.toast.flashcardsError'), description: t('generate.toast.noQuestionsDesc'), variant: 'default' });
        setGeneratedContent(null);
        return;
      }
      setGeneratedContent(data);
      setDiscussionAudio(null);
      toast({ title: t('generate.toast.flashcardsSuccess'), description: t('generate.toast.flashcardsSuccessDesc', { topic: topic, count: data.flashcards.length }) });
    },
    onError: (error) => {
      toast({ title: t('generate.toast.flashcardsError'), description: error.message, variant: "destructive" });
      setGeneratedContent(null);
    }
  });

  const { mutate: generateDiscussion, isPending: isGeneratingDiscussion } = useMutation({
    mutationFn: generateDiscussionAudioAction,
    onSuccess: (data) => {
      setDiscussionAudio(data.audioDataUri);
      toast({ title: t('audioFactory.discussion.successTitle'), description: t('audioFactory.discussion.successDesc') });
    },
    onError: (error) => {
      toast({ title: t('audioFactory.discussion.errorTitle'), description: error.message, variant: "destructive" });
    }
  });

  const handleGenerate = () => {
    playActionSound();
    if (topic.trim().length < 3) {
      toast({ title: t('generate.toast.invalidTopic'), description: t('generate.toast.invalidTopicDesc'), variant: "destructive" });
      return;
    }
    cancelTTS();
    setGeneratedContent(null);
    setDiscussionAudio(null);
    generate({ topic, numFlashcards });
  };
  
  const handleMicClick = () => {
    playClickSound();
    if (isListening) stopListening();
    else startListening();
  };
  
  useEffect(() => { if (transcript) setTopic(transcript); }, [transcript]);

  const handleReadAllFlashcards = () => {
    if (!generatedContent || generatedContent.flashcards.length === 0) return;
    const textToRead = generatedContent.flashcards.map(fc => `${t('audioFactory.flashcards.speakTerm')}: ${fc.term}. ${t('audioFactory.flashcards.speakDefinition')}: ${fc.definition}`).join('\n\n');
    speak(textToRead, { priority: 'manual' });
  }
  
  const handleGenerateDiscussion = () => {
    playActionSound();
    if (!generatedContent || generatedContent.flashcards.length === 0) return;
    const textToConvert = generatedContent.flashcards.map(fc => `${t('audioFactory.flashcards.speakTerm')}: ${fc.term}. ${t('audioFactory.flashcards.speakDefinition')}: ${fc.definition}`).join('\n\n');
    generateDiscussion({ content: textToConvert });
  }

  const handlePlaybackControl = () => {
    playClickSound();
    if (isSpeaking && !isPaused) pauseTTS();
    else if (isPaused) resumeTTS();
    else handleReadAllFlashcards();
  }

  const handleDownloadPdf = async () => {
    playClickSound();
    if (!generatedContent) return;
    const { default: html2pdf } = await import('html2pdf.js');
    const element = document.getElementById('flashcards-for-pdf');
    if (!element) return;
    
    const opt = {
      margin: 0.5,
      filename: `Nexithra_Flashcards_${topic}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  const handleDownloadPpt = () => {
      playClickSound();
      if (!generatedContent) return;
      toast({ title: "Generating PPTX...", description: "Your presentation is being created." });

      const pptx = new PptxGenJS();
      pptx.defineSlideMaster({
        title: 'HACKER_MASTER',
        background: { color: '0A192F' },
        objects: [
          { 'line': { x: 0.5, y: 5.3, w: 9.0, h: 0, line: { color: '00E6D5', width: 1 } } },
          { 'text': { text: 'Generated by Nexithra AI', options: { x: 0.5, y: 5.3, w: '90%', h: 0.2, align: 'left', fontFace: 'Arial', fontSize: 10, color: '94A3B8' } } },
          { 'image': { path: '/icons/icon-192x192.png', x: 9.2, y: 0.3, w: 0.5, h: 0.5 } }
        ]
      });
      
      const titleSlide = pptx.addSlide({ masterName: 'HACKER_MASTER' });
      titleSlide.addText(`Flashcards: ${topic}`, {
        x: 0.5, y: 2.5, w: '90%', h: 1, align: 'center', fontSize: 36, bold: true, color: 'FFFFFF',
        fontFace: 'Arial', shadow: { type: 'outer', color: '00E6D5', blur: 3, offset: 2, angle: 45, opacity: 0.6 }
      });

      generatedContent.flashcards.forEach(card => {
          // Term Slide
          const termSlide = pptx.addSlide({ masterName: 'HACKER_MASTER' });
          termSlide.addText(card.term, { x: 0.5, y: 2.5, w: '90%', h: 1, align: 'center', fontSize: 32, bold: true, color: 'FFFFFF' });

          // Definition Slide
          const defSlide = pptx.addSlide({ masterName: 'HACKER_MASTER' });
          defSlide.addText(card.definition, { x: 0.5, y: 1.5, w: '90%', h: 3, align: 'center', fontSize: 20, color: 'E2E8F0', lineSpacing: 32 });
      });

      pptx.writeFile({ fileName: `Nexithra_Flashcards_${topic}.pptx` });
  };


  return (
    <Card className="shadow-lg border-none card-bg-2">
      <CardHeader>
        <CardTitle>{t('audioFactory.flashcards.title')}</CardTitle>
        <CardDescription>{t('audioFactory.flashcards.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topic-input">{t('audioFactory.topic')}</Label>
          <div className="flex gap-2">
            <Input id="topic-input" placeholder={t('generate.placeholder')} value={topic} onChange={(e) => setTopic(e.target.value)} disabled={isLoading} />
            {browserSupportsSpeechRecognition && (
              <Button variant="outline" size="icon" onClick={handleMicClick} disabled={isLoading} title={t('generate.useVoiceInput')}>
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="num-flashcards">{t('audioFactory.numFlashcards')}: {numFlashcards}</Label>
          <Slider id="num-flashcards" min={5} max={15} step={1} value={[numFlashcards]} onValueChange={(value) => setNumFlashcards(value[0])} disabled={isLoading} />
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button size="lg" onClick={handleGenerate} disabled={isLoading || isGeneratingDiscussion}>
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
          {t('audioFactory.generate')} {t('audioFactory.tabs.flashcards')}
        </Button>
      </CardFooter>
      {(isLoading || isGeneratingDiscussion) && (
        <CardContent className="text-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-muted-foreground">{isLoading ? t('audioFactory.generating') : t('audioFactory.discussion.generating')}</p>
        </CardContent>
      )}
      {generatedContent && (
        <CardContent>
          <CardTitle className="mb-4 text-lg">{t('audioFactory.generatedContent')}</CardTitle>
          {generatedContent.flashcards.length > 0 && (
            <div className="mb-6 flex items-center gap-2 flex-wrap">
              <Button onClick={handlePlaybackControl} disabled={isTTSLoading || isGeneratingDiscussion}>
                {isTTSLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4 mr-2"/> : <PlayCircle className="h-4 w-4 mr-2"/>}
                {isSpeaking && !isPaused ? t('notesView.speak.pause') : isPaused ? t('notesView.speak.resume') : t('notesView.speak.start')}
              </Button>
              {(isSpeaking || isPaused) && (
                <Button onClick={() => { playClickSound(); cancelTTS() }} variant="ghost" size="icon"><StopCircle className="h-5 w-5" /></Button>
              )}
               <Button onClick={handleGenerateDiscussion} disabled={isGeneratingDiscussion || isLoading}>
                {isGeneratingDiscussion ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Users className="h-4 w-4 mr-2"/>}
                {t('audioFactory.discussion.button')}
              </Button>
              <Button variant="outline" onClick={handleDownloadPdf}><FileText className="mr-2 h-4 w-4"/> PDF</Button>
              <Button variant="outline" onClick={handleDownloadPpt}><MonitorPlay className="mr-2 h-4 w-4"/> PPT</Button>
            </div>
          )}
          {discussionAudio && (
            <div className="my-4">
              <h4 className="font-semibold mb-2">{t('audioFactory.discussion.title')}:</h4>
              <audio controls src={discussionAudio} className="w-full">{t('audioFactory.audioNotSupported')}</audio>
            </div>
          )}
          <ScrollArea className="h-[500px] w-full pr-4">
            <div id="flashcards-for-pdf" className="dark printable-notes-area">
                <div className="hidden print:block text-center p-4 border-b border-border">
                    <Logo size={40} className="mx-auto"/>
                    <h1 className="text-2xl font-bold mt-2" style={{ color: 'hsl(var(--primary))' }}>Flashcards: {topic}</h1>
                    <p className="text-xs text-muted-foreground">Generated by Nexithra on {new Date().toLocaleDateString()}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedContent.flashcards.map((card, index) => (
                        <div key={index} className="print:break-inside-avoid" style={{'--card-background': 'hsl(var(--card))', '--card-foreground': 'hsl(var(--card-foreground))', '--secondary-background': 'hsl(var(--secondary))', '--secondary-foreground': 'hsl(var(--secondary-foreground))'}}>
                           <FlashcardItem flashcard={card} className="h-56" />
                        </div>
                    ))}
                </div>
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}

// Abstracted component for Summarizers to reduce repetition
function AudioSummarizer({
  titleKey, descriptionKey, inputType,
  generateAction, validateInput,
  children
}: {
  titleKey: string, descriptionKey: string, inputType: 'text' | 'image' | 'pdf',
  generateAction: (generateFn: (input: any) => void) => void, validateInput: () => boolean,
  children: React.ReactNode
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const [generatedContent, setGeneratedContent] = useState<GenerateAudioSummaryOutput | null>(null);
  const [discussionAudio, setDiscussionAudio] = useState<string | null>(null);

  const { speak, cancelTTS, isSpeaking, isPaused, pauseTTS, resumeTTS, isLoading: isTTSLoading } = useTTS();
  
  const { mutate: generate, isPending: isLoading } = useMutation({
    mutationFn: generateAudioSummaryAction,
    onSuccess: (data) => {
      setGeneratedContent(data);
      setDiscussionAudio(null);
      toast({ title: t('audioFactory.summary.successTitle'), description: t('audioFactory.summary.successDesc', {inputType})});
    },
    onError: (error) => {
      toast({ title: t('audioFactory.summary.errorTitle'), description: error.message, variant: "destructive" });
    }
  });

  const { mutate: generateDiscussion, isPending: isGeneratingDiscussion } = useMutation({
    mutationFn: generateDiscussionAudioAction,
    onSuccess: (data) => {
      setDiscussionAudio(data.audioDataUri);
      toast({ title: t('audioFactory.discussion.successTitle'), description: t('audioFactory.discussion.successDesc') });
    },
    onError: (error) => {
      toast({ title: t('audioFactory.discussion.errorTitle'), description: error.message, variant: "destructive" });
    }
  });

  const handleGenerate = () => {
    playActionSound();
    if (!validateInput()) return;
    cancelTTS();
    generateAction(generate);
  };
  
  const handleReadAloud = () => {
    if (!generatedContent?.summary) return;
    speak(generatedContent.summary, {priority: 'manual'});
  }
  
  const handlePlaybackControl = () => {
    playClickSound();
    if (isSpeaking && !isPaused) pauseTTS();
    else if (isPaused) resumeTTS();
    else handleReadAloud();
  }

  const handleGenerateDiscussion = () => {
    if (!generatedContent?.summary) return;
    playActionSound();
    generateDiscussion({ content: generatedContent.summary });
  };
  
  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle>{t(titleKey)}</CardTitle>
        <CardDescription>{t(descriptionKey)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
      <CardFooter className="flex-col items-center gap-4">
        <Button onClick={handleGenerate} disabled={isLoading || isGeneratingDiscussion}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {t('audioFactory.generate')} {t('audioFactory.summary.button')}
        </Button>
        {(isLoading || isGeneratingDiscussion) && <p className="text-sm text-muted-foreground">{isLoading ? t('audioFactory.generating') : t('audioFactory.discussion.generating')}</p>}
        {generatedContent && (
          <div className="w-full space-y-4 pt-4 border-t">
            <h3 className="font-semibold">{t('audioFactory.summary')}</h3>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{generatedContent.summary}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={handlePlaybackControl} disabled={isTTSLoading || isGeneratingDiscussion}>
                {isTTSLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4 mr-2"/> : <PlayCircle className="h-4 w-4 mr-2"/>}
                {isSpeaking && !isPaused ? t('notesView.speak.pause') : isPaused ? t('notesView.speak.resume') : t('notesView.speak.start')}
              </Button>
               {(isSpeaking || isPaused) && (
                <Button onClick={() => { playClickSound(); cancelTTS() }} variant="ghost" size="icon"><StopCircle className="h-5 w-5" /></Button>
              )}
               <Button onClick={handleGenerateDiscussion} disabled={isGeneratingDiscussion || isLoading}>
                {isGeneratingDiscussion ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Users className="h-4 w-4 mr-2"/>}
                {t('audioFactory.discussion.button')}
              </Button>
            </div>
             {discussionAudio && (
              <div className="my-4">
                <h4 className="font-semibold mb-2">{t('audioFactory.discussion.title')}:</h4>
                <audio controls src={discussionAudio} className="w-full">{t('audioFactory.audioNotSupported')}</audio>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function TextAudioSummarizer() {
  const { t } = useTranslation();
  const [textInput, setTextInput] = useState('');
  const { toast } = useToast();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceRecognition();
  useEffect(() => { if (transcript) setTextInput(transcript); }, [transcript]);
  const handleMicClick = () => isListening ? stopListening() : startListening();

  return (
    <AudioSummarizer
      titleKey="audioFactory.text.title"
      descriptionKey="audioFactory.text.description"
      inputType="text"
      validateInput={() => {
        if (textInput.trim().length < 50) {
          toast({ title: t('audioFactory.text.errorTitle'), description: t('audioFactory.text.errorDesc'), variant: "destructive" });
          return false;
        }
        return true;
      }}
      generateAction={(generate) => {
        generate({ text: textInput });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="text-input">{t('audioFactory.text.yourText')}</Label>
        <div className="relative">
          <Textarea id="text-input" placeholder={t('audioFactory.text.placeholder')} value={textInput} onChange={(e) => setTextInput(e.target.value)} rows={8} className="pr-12" />
          {browserSupportsSpeechRecognition && (
            <Button type="button" variant="ghost" size="icon" onClick={handleMicClick} className="absolute bottom-2 right-2" title={t('generate.useVoiceInput')}>
              <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
            </Button>
          )}
        </div>
      </div>
    </AudioSummarizer>
  );
}

function ImageAudioSummarizer() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast({ title: t('audioFactory.invalidFileType'), variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: t('audioFactory.imageTooLarge'), variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setImagePreview(reader.result as string); setImageData(reader.result as string); };
    reader.readAsDataURL(file);
  };
  const handleRemoveImage = () => { setImagePreview(null); setImageData(null); if(fileInputRef.current) fileInputRef.current.value = ""; }

  return (
     <AudioSummarizer
      titleKey="audioFactory.image.title"
      descriptionKey="audioFactory.image.description"
      inputType="image"
      validateInput={() => {
         if (!imageData) {
            toast({ title: t('audioFactory.image.errorTitle'), description: t('audioFactory.image.errorDesc'), variant: "destructive"});
            return false;
         }
         return true;
      }}
      generateAction={(generate) => generate({
        imageDataUri: imageData,
      })}
    >
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline"><ImageIcon className="mr-2 h-4 w-4" /> {t('audioFactory.uploadImage')}</Button>
      {imagePreview && (
        <div className="relative w-40 h-40 mx-auto">
          <NextImage src={imagePreview} alt={t('customTest.file.image.previewAlt')} layout="fill" objectFit="cover" className="rounded-md border-2 border-primary/50" />
          <Button type="button" variant="ghost" size="icon" onClick={handleRemoveImage} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground"><XCircle className="w-4 h-4" /></Button>
        </div>
      )}
    </AudioSummarizer>
  );
}

function PdfAudioSummarizer() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast({ title: t('audioFactory.invalidFileType'), variant: "destructive" }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: t('audioFactory.pdfTooLarge'), variant: "destructive" }); return; }
    setPdfFile(file);
    setIsExtracting(true);
    try {
      const text = await extractTextFromPdf(file);
      setExtractedText(text);
      toast({title: t('customTest.file.pdf.processed'), description: t('customTest.file.pdf.processedDesc')});
    } catch (err) {
      toast({ title: t('audioFactory.pdfExtractError'), variant: "destructive" });
      setExtractedText(null); setPdfFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <AudioSummarizer
      titleKey="audioFactory.pdf.title"
      descriptionKey="audioFactory.pdf.description"
      inputType="pdf"
      validateInput={() => {
        if (!extractedText) {
            toast({ title: t('audioFactory.pdf.errorTitle'), description: t('audioFactory.pdf.errorDesc'), variant: "destructive"});
            return false;
        }
        return true;
      }}
      generateAction={(generate) => {
        generate({ text: extractedText });
      }}
    >
      <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isExtracting}>
        {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4" />} {t('audioFactory.uploadPdf')}
      </Button>
      {pdfFile && <p className="text-sm text-muted-foreground">Selected: {pdfFile.name}</p>}
      {isExtracting && <p className="text-sm text-muted-foreground">{t('audioFactory.pdf.extracting')}</p>}
    </AudioSummarizer>
  );
}


export default function AudioFactoryPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (user?.isAnonymous) {
    return (
      <GuestLock
        featureName="guestLock.features.audioFactory"
        featureDescription="guestLock.features.audioFactoryDesc"
        Icon={AudioLines}
      />
    );
  }

  return (
    <div className="py-8 space-y-8">
      <Card className="shadow-xl bg-card/90 backdrop-blur-sm relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('/icons/v1.mp4')" }}>
        <div className="absolute inset-0 bg-background/80 group-hover:bg-background/70 transition-colors z-0"></div>
        <div className="relative z-10">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4"><AudioLines className="h-12 w-12 text-primary" /></div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{t('audioFactory.title')}</CardTitle>
              <CardDescription>
                {t('audioFactory.description')}
              </CardDescription>
            </CardHeader>
        </div>
      </Card>
      
      <Tabs defaultValue="flashcards" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 h-auto">
          <TabsTrigger value="flashcards" className="text-xs sm:text-sm">{t('audioFactory.tabs.flashcards')}</TabsTrigger>
          <TabsTrigger value="text-summary" className="text-xs sm:text-sm">{t('audioFactory.tabs.text')}</TabsTrigger>
          <TabsTrigger value="image-summary" className="text-xs sm:text-sm">{t('audioFactory.tabs.image')}</TabsTrigger>
          <TabsTrigger value="pdf-summary" className="text-xs sm:text-sm">{t('audioFactory.tabs.pdf')}</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
            <TabsContent value="flashcards" className="mt-0">
              <AudioFlashcardsGenerator />
            </TabsContent>
            <TabsContent value="text-summary" className="mt-0">
              <TextAudioSummarizer />
            </TabsContent>
            <TabsContent value="image-summary" className="mt-0">
              <ImageAudioSummarizer />
            </TabsContent>
            <TabsContent value="pdf-summary" className="mt-0">
              <PdfAudioSummarizer />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
