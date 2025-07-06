"use client";

import { useState, useRef, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, ImageIcon, Loader2, X, FileText, AudioLines, Video } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useSound } from '@/hooks/useSound';
import { extractTextFromPdf } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface ChatInputProps {
  onSendMessage: (
    message: string, 
    image?: string, 
    pdfContent?: { name: string, text: string },
    audio?: string,
    video?: string,
    audioFileName?: string,
    videoFileName?: string
  ) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [pdfContent, setPdfContent] = useState<{ name: string, text: string } | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { t } = useTranslation();

  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, error: voiceError } = useVoiceRecognition();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  useEffect(() => { 
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    playClickSound();
    const file = e.target.files?.[0];
    if (file) {
      handleRemoveFile(false); // Clear previous file state without sound
      setIsProcessingFile(true);
      if (file.type.startsWith('image/')) {
        if (file.size > 4 * 1024 * 1024) { // 4MB limit
          toast({ title: t('chatbot.file.image.tooLargeTitle'), description: t('chatbot.file.image.tooLargeDesc'), variant: "destructive" });
          setIsProcessingFile(false);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          setImageData(reader.result as string);
          setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast({ title: t('chatbot.file.pdf.tooLargeTitle'), description: t('chatbot.file.pdf.tooLargeDesc'), variant: "destructive" });
            setIsProcessingFile(false);
            return;
        }
        try {
          const text = await extractTextFromPdf(file);
          setPdfContent({ name: file.name, text });
          toast({ title: t('chatbot.file.pdf.successTitle'), description: t('chatbot.file.pdf.successDesc', { name: file.name }) });
        } catch(err) {
          toast({ title: t('chatbot.file.pdf.errorTitle'), description: t('chatbot.file.pdf.errorDesc'), variant: "destructive" });
        } finally {
          setIsProcessingFile(false);
        }
      } else if (file.type.startsWith('audio/')) {
        if (file.size > 25 * 1024 * 1024) { // 25MB limit
          toast({ title: t('chatbot.file.audio.tooLargeTitle'), description: t('chatbot.file.audio.tooLargeDesc'), variant: "destructive" });
          setIsProcessingFile(false); return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioData(reader.result as string);
          setAudioFileName(file.name);
          setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        if (file.size > 25 * 1024 * 1024) { // 25MB limit
          toast({ title: t('chatbot.file.video.tooLargeTitle'), description: t('chatbot.file.video.tooLargeDesc'), variant: "destructive" });
          setIsProcessingFile(false); return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setVideoData(reader.result as string);
          setVideoFileName(file.name);
          setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
      } else {
        toast({ title: t('chatbot.file.unsupportedTitle'), description: t('chatbot.file.unsupportedDesc'), variant: "default" });
        setIsProcessingFile(false);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (isLoading || (!inputValue.trim() && !imageData && !pdfContent && !audioData && !videoData)) return;

    onSendMessage(
      inputValue.trim(), 
      imageData || undefined, 
      pdfContent || undefined, 
      audioData || undefined, 
      videoData || undefined, 
      audioFileName || undefined, 
      videoFileName || undefined
    );

    setInputValue('');
    handleRemoveFile(false); // Reset all file states without sound
  };

  const toggleListening = () => {
    playClickSound();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  useEffect(() => {
    if (voiceError) {
      toast({ title: t('chatbot.voiceError.title'), description: voiceError, variant: "destructive" });
    }
  }, [voiceError, toast, t]);

  const handleRemoveFile = (withSound = true) => {
    if (withSound) playClickSound();
    setImagePreview(null); 
    setImageData(null); 
    setPdfContent(null);
    setAudioData(null);
    setVideoData(null);
    setAudioFileName(null);
    setVideoFileName(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="bg-background/80 backdrop-blur-md p-4 border-t">
      <form onSubmit={handleSubmit} >
        <div className="flex flex-wrap gap-2 mb-2">
          {imagePreview && (
            <div className="relative w-24 h-24">
              <Image src={imagePreview} alt={t('chatbot.file.image.previewAlt')} layout="fill" objectFit="cover" className="rounded-md" data-ai-hint="image preview" />
              <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 bg-destructive/80 text-destructive-foreground rounded-full" onClick={() => handleRemoveFile()}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {pdfContent && (
              <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate flex-1" title={pdfContent.name}>{pdfContent.name}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full">
                      <X className="w-4 h-4 text-destructive/70" />
                  </Button>
              </div>
          )}
          {audioFileName && (
            <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                <AudioLines className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate flex-1" title={audioFileName}>{audioFileName}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full">
                    <X className="w-4 h-4 text-destructive/70" />
                </Button>
            </div>
          )}
          {videoFileName && (
            <div className="p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                <Video className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate flex-1" title={videoFileName}>{videoFileName}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full">
                    <X className="w-4 h-4 text-destructive/70" />
                </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isProcessingFile} title={t('chatbot.controls.attach')}>
             {isProcessingFile ? <Loader2 className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5" />}
          </Button>
          <input type="file" accept="image/*,application/pdf,audio/*,video/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

          {browserSupportsSpeechRecognition && (
            <Button type="button" variant="ghost" size="icon" onClick={toggleListening} disabled={isLoading} title={t('chatbot.controls.voice')}>
              <Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              <span className="sr-only">{t(isListening ? 'chatbot.controls.stopListening' : 'chatbot.controls.startListening')}</span>
            </Button>
          )}

          <Input
            type="text"
            placeholder={t('chatbot.placeholder')}
            value={inputValue}
            onChange={handleInputChange}
            disabled={isLoading || isProcessingFile}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || isProcessingFile || (!inputValue.trim() && !imageData && !pdfContent && !audioData && !videoData)}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span className="sr-only">{t('chatbot.controls.send')}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
