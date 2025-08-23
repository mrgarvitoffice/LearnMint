
"use client";

import { Suspense, useState, useCallback, useEffect, type ChangeEvent, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Wand2, ArrowLeft, RefreshCw, AlertTriangle, Mic, FileSignature, ImageIcon, XCircle, FileText, AudioLines, Video } from 'lucide-react';
import { generateNotesAction } from '@/lib/actions';
import { COLLEGE_DATA } from '@/lib/constants';
import type { CombinedStudyMaterialsOutput } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings } from '@/contexts/SettingsContext';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useSound } from '@/hooks/useSound';
import { extractTextFromPdf } from '@/lib/utils';
import { useQuests } from '@/contexts/QuestContext';

const findSubjectDetails = (subjectId: string) => {
  if (!subjectId) return null;
  for (const uni of Object.values(COLLEGE_DATA)) {
    for (const prog of Object.values(uni.programs)) {
        for (const branch of Object.values(prog.branches)) {
            if (branch.semesters) {
                for (const sem of Object.values(branch.semesters)) {
                    if (sem.subjects) {
                        const subject = sem.subjects.find((s: any) => s.id === subjectId);
                        if (subject) return { ...subject, university: uni.name, program: prog.name, branch: branch.name, semester: sem.name };
                    }
                }
            }
        }
    }
  }
  return null;
};

const LOCALSTORAGE_KEY_PREFIX = "nexithra-study-";
const RECENT_TOPICS_LS_KEY = "nexithra-recent-topics";
const getCacheKey = (type: string, topicKey: string) => `${LOCALSTORAGE_KEY_PREFIX}${type}-${topicKey.toLowerCase().replace(/\s+/g, '-')}`;

function CollegeStudyPageContent() {
  const params = useParams();
  const router = useRouter();
  const { t, isReady } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { completeQuest1 } = useQuests();

  const subjectId = Array.isArray(params.subject) ? params.subject[0] : params.subject;
  const subjectDetails = findSubjectDetails(subjectId);
  
  const [selectedUnit, setSelectedUnit] = useState('');
  const [notesContent, setNotesContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition } = useVoiceRecognition();
  const { playSound: playActionSound } = useSound('/sounds/custom-sound-2.mp3', { priority: 'essential' });
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });

  const handleGenerate = async () => {
    const topicFromUnit = selectedUnit ? `${subjectDetails?.name || 'Unit'} - ${selectedUnit}` : '';
    const topicFromInput = notesContent.trim();
    const topicForGeneration = selectedUnit ? topicFromUnit : topicFromInput;

    if (!topicForGeneration) {
      toast({ title: "No Topic Provided", description: "Please select a unit or enter a topic to generate materials.", variant: "destructive" });
      return;
    }
    playActionSound();
    setIsLoading(true);
    setError(null);
    toast({ title: "Generating Materials...", description: `AI is creating notes and a quiz for ${topicForGeneration.substring(0, 50)}... This may take a moment.` });

    try {
      const combinedResult: CombinedStudyMaterialsOutput = await generateNotesAction({
        topic: topicForGeneration,
        notes: notesContent || undefined,
        image: imageData || undefined,
        audio: audioData || undefined,
        video: videoData || undefined,
      });

      let navigationSuccess = false;

      if (combinedResult.notesOutput?.notes) {
        localStorage.setItem(getCacheKey("notes", topicForGeneration), JSON.stringify(combinedResult.notesOutput));
        navigationSuccess = true;
        completeQuest1();
      } else {
        setError(combinedResult.notesError || "Failed to generate notes.");
      }

      if (combinedResult.quizOutput?.questions?.length) {
        localStorage.setItem(getCacheKey("quiz", topicForGeneration), JSON.stringify(combinedResult.quizOutput));
      }
      
      if (navigationSuccess) {
        const storedTopics = localStorage.getItem(RECENT_TOPICS_LS_KEY);
        let recentTopicsArray = storedTopics ? JSON.parse(storedTopics) : [];
        if (!recentTopicsArray.includes(topicForGeneration)) {
          recentTopicsArray.unshift(topicForGeneration);
          localStorage.setItem(RECENT_TOPICS_LS_KEY, JSON.stringify(recentTopicsArray.slice(0, 10)));
        }
        
        toast({ title: "Materials Generated!", description: `Redirecting to the new study hub for ${topicForGeneration}.` });
        router.push(`/college/study?topic=${encodeURIComponent(topicForGeneration)}`);
      } else {
         toast({ title: "Generation Failed", description: error || "Could not generate primary notes content.", variant: "destructive" });
      }

    } catch (err: any) {
      setError(err.message);
      toast({ title: "Generation Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  const handleRemoveFile = (withSound = true) => {
    if (withSound) playClickSound();
    setImagePreview(null); setImageData(null);
    setPdfFileName(null); setNotesContent('');
    setAudioData(null); setVideoData(null);
    setAudioFileName(null); setVideoFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    playClickSound();
    const file = e.target.files?.[0];
    if (file) {
      handleRemoveFile(false);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => { setImagePreview(reader.result as string); setImageData(reader.result as string); };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        setPdfFileName(file.name);
        try {
            const text = await extractTextFromPdf(file);
            setNotesContent(text);
            toast({ title: "PDF Processed", description: "Text from PDF has been extracted." });
        } catch(err) {
            toast({ title: "PDF Error", description: "Could not extract text from PDF.", variant: "destructive" });
            setPdfFileName(null);
        }
      } else if (file.type.startsWith('audio/')) {
        setAudioFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => { setAudioData(reader.result as string); };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        setVideoFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => { setVideoData(reader.result as string); };
        reader.readAsDataURL(file);
      } else {
        toast({ title: "Unsupported File", description: "Please upload an image, PDF, audio, or video file.", variant: "default" });
      }
    }
  };
  
  useEffect(() => {
    if (transcript) setNotesContent(transcript);
  }, [transcript]);

  if (!isReady) {
    return <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center bg-background/95"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  
  if (!subjectDetails) {
    return (
      <div className="py-8 text-center">
        <Alert variant="destructive"><AlertTitle>Subject Not Found</AlertTitle><AlertDescription>The requested subject could not be found.</AlertDescription></Alert>
        <Button onClick={() => router.push('/college')} className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto py-4 md:py-8 space-y-6 flex flex-col">
      <Card className="card-bg-2 shadow-lg flex-shrink-0">
        <CardHeader>
          <Button variant="ghost" size="sm" className="absolute top-4 left-4" onClick={() => router.push('/college')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <div className="pt-8 text-center">
             <CardTitle className="text-2xl font-bold text-primary">{subjectDetails.name}</CardTitle>
             <CardDescription className="mt-1">{subjectDetails.description}</CardDescription>
             <CardDescription className="text-xs mt-1">{subjectDetails.university} | {subjectDetails.program} | {subjectDetails.branch} | {subjectDetails.semester}</CardDescription>
          </div>
        </CardHeader>
      </Card>
      
      <Card className="flex-shrink-0">
        <CardHeader>
          <CardTitle>Generate Unit-wise Study Hub</CardTitle>
          <CardDescription>Select a unit, or enter your own topic/notes, and generate materials with AI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Select onValueChange={setSelectedUnit} value={selectedUnit}>
                <SelectTrigger><SelectValue placeholder="Select Unit/Topic..." /></SelectTrigger>
                <SelectContent>
                  {subjectDetails.units?.map((unit: string) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                </SelectContent>
            </Select>

            <div className="space-y-2">
              <Label htmlFor="notes-content">Or Add Your Own Topic / Notes (Optional)</Label>
               <div className="flex flex-col sm:flex-row gap-2">
                <Textarea id="notes-content" placeholder="Paste notes, an article, or use the microphone to dictate..." value={notesContent} onChange={(e) => setNotesContent(e.target.value)} rows={4} className="flex-1" />
                <div className="flex flex-row sm:flex-col gap-2">
                    <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} title="Attach File"><FileSignature className="w-5 h-5" /></Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf,audio/*,video/*" className="hidden" />
                    {browserSupportsSpeechRecognition && (<Button type="button" variant="outline" size="icon" onClick={() => isListening ? stopListening() : startListening()} title="Use Voice Input"><Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} /></Button>)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {imagePreview && (
                  <div className="relative w-24 h-24">
                    <Image src={imagePreview} alt="Preview" layout="fill" objectFit="cover" className="rounded-md" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground"><XCircle className="w-4 h-4" /></Button>
                  </div>
                )}
                {pdfFileName && (
                  <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate flex-1" title={pdfFileName}>{pdfFileName}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full"><XCircle className="w-4 h-4 text-destructive/70" /></Button>
                  </div>
                )}
                {audioFileName && (
                    <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                        <AudioLines className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate flex-1" title={audioFileName}>{audioFileName}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full"><XCircle className="w-4 h-4 text-destructive/70" /></Button>
                    </div>
                )}
                 {videoFileName && (
                    <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                        <Video className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate flex-1" title={videoFileName}>{videoFileName}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full"><XCircle className="w-4 h-4 text-destructive/70" /></Button>
                    </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button onClick={handleGenerate} disabled={isLoading || (!selectedUnit && !notesContent.trim())} size="lg">
                  {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Wand2 className="w-5 h-5 mr-2" />}
                  {isLoading ? "Generating..." : "Generate & Go to Study Hub"}
              </Button>
            </div>
        </CardContent>
      </Card>
      
        {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Material Generation Failed</AlertTitle>
              <AlertDescription>
                  {error || "An unexpected error occurred."} Please try again or select a different unit.
              </AlertDescription>
            </Alert>
          )}
    </div>
  );
}

export default function CollegePage() {
    return (
        <Suspense fallback={<div className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-center justify-center bg-background/95"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <CollegeStudyPageContent />
        </Suspense>
    )
}
