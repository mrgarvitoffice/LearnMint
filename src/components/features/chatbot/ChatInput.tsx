
"use client";

import { useState, useRef, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, ImageIcon, Loader2, X, FileText } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useSound } from '@/hooks/useSound';
import { extractTextFromPdf } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string, image?: string, pdfContent?: { name: string, text: string }) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [pdfContent, setPdfContent] = useState<{ name: string, text: string } | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });

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
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
          toast({ title: "Image too large", description: "Please upload an image smaller than 2MB.", variant: "destructive" });
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
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({ title: "PDF too large", description: "Please upload a PDF smaller than 5MB.", variant: "destructive" });
            setIsProcessingFile(false);
            return;
        }
        try {
          const text = await extractTextFromPdf(file);
          setPdfContent({ name: file.name, text });
          toast({ title: "PDF Attached", description: `${file.name} is ready to be sent with your message.` });
        } catch(err) {
          toast({ title: "PDF Error", description: "Could not extract text from the PDF.", variant: "destructive" });
        } finally {
          setIsProcessingFile(false);
        }
      } else {
        toast({ title: "Unsupported File", description: "Chat supports image and PDF uploads.", variant: "default" });
        setIsProcessingFile(false);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (isLoading || (!inputValue.trim() && !imageData && !pdfContent)) return;

    onSendMessage(inputValue.trim(), imageData || undefined, pdfContent || undefined);

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
      toast({ title: "Voice Input Error", description: voiceError, variant: "destructive" });
    }
  }, [voiceError, toast]);

  const handleRemoveFile = (withSound = true) => {
    if (withSound) playClickSound();
    setImagePreview(null); 
    setImageData(null); 
    setPdfContent(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="bg-background/80 backdrop-blur-md p-4 border-t">
      <form onSubmit={handleSubmit} >
        {imagePreview && (
          <div className="mb-2 relative w-24 h-24">
            <Image src={imagePreview} alt="Preview" layout="fill" objectFit="cover" className="rounded-md" data-ai-hint="image preview" />
            <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 bg-destructive/80 text-destructive-foreground rounded-full" onClick={() => handleRemoveFile()}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {pdfContent && (
            <div className="mb-2 relative p-2 border rounded-md bg-muted/50 flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate flex-1" title={pdfContent.name}>{pdfContent.name}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveFile()} className="h-6 w-6 rounded-full">
                    <X className="w-4 h-4 text-destructive/70" />
                </Button>
            </div>
        )}
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isProcessingFile}>
             {isProcessingFile ? <Loader2 className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5" />}
          </Button>
          <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

          {browserSupportsSpeechRecognition && (
            <Button type="button" variant="ghost" size="icon" onClick={toggleListening} disabled={isLoading}>
              <Mic className={`w-5 h-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              <span className="sr-only">{isListening ? 'Stop Listening' : 'Start Listening'}</span>
            </Button>
          )}

          <Input
            type="text"
            placeholder="Type your message or ask a question..."
            value={inputValue}
            onChange={handleInputChange}
            disabled={isLoading || isProcessingFile}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || isProcessingFile || (!inputValue.trim() && !imageData && !pdfContent)}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span className="sr-only">Send Message</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
