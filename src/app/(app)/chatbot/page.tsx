
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/features/chatbot/ChatMessage';
import { ChatInput } from '@/components/features/chatbot/ChatInput';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { gojoChatbot, type GojoChatbotInput } from '@/ai/flows/ai-chatbot';
import { holoChatbot, type HoloChatbotInput } from '@/ai/flows/holo-chatbot';
import { meguminChatbot, type MeguminChatbotInput } from '@/ai/flows/megumin-chatbot';
import { Bot, PlayCircle, PauseCircle, StopCircle, Wand2, Loader2, Atom } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { GuestLock } from '@/components/features/auth/GuestLock';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings } from '@/contexts/SettingsContext';
import { APP_LANGUAGES } from '@/lib/constants';


const TYPING_INDICATOR_ID = 'typing-indicator';
const PDF_TRUNCATION_LIMIT = 8000; // Character limit for PDF content sent to AI

type ChatbotCharacter = 'gojo' | 'holo' | 'megumin';

export default function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<ChatbotCharacter>('gojo');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { t, isReady } = useTranslation();
  const { appLanguage } = useSettings();

  const {
    speak,
    pauseTTS,
    resumeTTS,
    cancelTTS,
    isSpeaking,
    isPaused,
    setVoicePreference,
  } = useTTS();

  const currentSpokenMessageRef = useRef<string | null>(null);
  
  const getGreetingKey = (char: ChatbotCharacter) => {
    switch(char) {
        case 'gojo': return 'chatbot.gojo.greeting';
        case 'holo': return 'chatbot.holo.greeting';
        case 'megumin': return 'chatbot.megumin.greeting';
    }
  }

  useEffect(() => {
    // This effect runs when the selected character or user status changes.
    if (!isReady || user?.isAnonymous) {
      if (user?.isAnonymous) setMessages([]);
      cancelTTS();
      return; // Do not proceed for guests or if translations are not ready
    }

    cancelTTS();
    setVoicePreference(selectedCharacter);

    const greetingText = t(getGreetingKey(selectedCharacter));

    const initialGreetingMessage: ChatMessageType = {
      id: `${selectedCharacter}-initial-greeting-${Date.now()}`, role: 'assistant',
      content: greetingText, timestamp: new Date()
    };
    
    setMessages([initialGreetingMessage]);
    
    // Speak the greeting automatically with 'essential' priority
    currentSpokenMessageRef.current = greetingText;
    speak(greetingText, { priority: 'essential' });

  }, [selectedCharacter, user, cancelTTS, setVoicePreference, speak, t, isReady]);


  useEffect(() => {
    // Cleanup function to cancel TTS when the component unmounts.
    return () => {
      cancelTTS();
    };
  }, [cancelTTS]);


  useEffect(() => {
    // Automatically scroll to the bottom of the chat messages when a new message is added.
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);
  
  const getTypingIndicatorKey = (char: ChatbotCharacter) => {
    switch(char) {
        case 'gojo': return 'chatbot.gojo.typing';
        case 'holo': return 'chatbot.holo.typing';
        case 'megumin': return 'chatbot.megumin.typing';
    }
  }
  
  const getErrorToastKey = (char: ChatbotCharacter) => {
    switch(char) {
        case 'gojo': return 'chatbot.gojo.errorToast';
        case 'holo': return 'chatbot.holo.errorToast';
        case 'megumin': return 'chatbot.megumin.errorToast';
    }
  }

  const getErrorMessageKey = (char: ChatbotCharacter) => {
      switch(char) {
        case 'gojo': return 'chatbot.gojo.errorMessage';
        case 'holo': return 'chatbot.holo.errorMessage';
        case 'megumin': return 'chatbot.megumin.errorMessage';
    }
  }

  const handleSendMessage = async (
    messageText: string,
    image?: string,
    pdfContent?: { name: string; text: string },
    audio?: string,
    video?: string,
    audioFileName?: string,
    videoFileName?: string
  ) => {
    if (!messageText.trim() && !image && !pdfContent && !audio && !video) return;
    
    cancelTTS(); // Stop any currently playing speech before sending a new message.

    const userMessage: ChatMessageType = { 
      id: Date.now().toString() + '-user', 
      role: 'user', 
      content: messageText, 
      image: image,
      pdfFileName: pdfContent?.name,
      audioFileName,
      videoFileName,
      timestamp: new Date() 
    };

    const typingIndicatorMessage = t(getTypingIndicatorKey(selectedCharacter));
    const typingIndicator: ChatMessageType = { id: TYPING_INDICATOR_ID, role: 'assistant', content: typingIndicatorMessage, timestamp: new Date(), type: 'typing_indicator' };

    setMessages(prev => [...prev, userMessage, typingIndicator]);
    setIsAiResponding(true);

    try {
      let messageForAI = messageText;
      if (pdfContent) {
        let truncatedPdfText = pdfContent.text;
        if (pdfContent.text.length > PDF_TRUNCATION_LIMIT) {
          const start = pdfContent.text.substring(0, PDF_TRUNCATION_LIMIT / 2);
          const end = pdfContent.text.substring(pdfContent.text.length - PDF_TRUNCATION_LIMIT / 2);
          truncatedPdfText = `${start}... (content truncated) ...${end}`;
          toast({ title: t('chatbot.toast.pdfTruncatedTitle'), description: t('chatbot.toast.pdfTruncatedDesc'), variant: 'default' });
        }
        messageForAI = `${messageText}\n\n[The user has provided the following document for context: ${pdfContent.name}]\n---DOCUMENT CONTENT---\n${truncatedPdfText}`;
      }
      
      const languageLabel = APP_LANGUAGES.find(l => l.value === appLanguage)?.label || 'English';

      const input: GojoChatbotInput | HoloChatbotInput | MeguminChatbotInput = {
        message: messageForAI,
        language: languageLabel,
        image,
        audio,
        video,
      };

      let response;
      switch (selectedCharacter) {
        case 'gojo':
            response = await gojoChatbot(input as GojoChatbotInput);
            break;
        case 'holo':
            response = await holoChatbot(input as HoloChatbotInput);
            break;
        case 'megumin':
            response = await meguminChatbot(input as MeguminChatbotInput);
            break;
      }
      
      const assistantMessage: ChatMessageType = { id: Date.now().toString() + '-assistant', role: 'assistant', content: response.response, timestamp: new Date() };

      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
      setMessages(prev => [...prev, assistantMessage]);

      currentSpokenMessageRef.current = assistantMessage.content;
      speak(assistantMessage.content, { priority: 'essential' });
      
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      const errorToastDesc = t(getErrorToastKey(selectedCharacter));
      toast({ title: t('chatbot.toast.errorTitle'), description: errorToastDesc, variant: "destructive" });
      const errorMessageContent = t(getErrorMessageKey(selectedCharacter));
      const errorMessage: ChatMessageType = { id: Date.now().toString() + '-error', role: 'system', content: errorMessageContent, timestamp: new Date() };
      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiResponding(false);
    }
  };

  const handlePlaybackControl = () => {
    playClickSound();
    if (isSpeaking && !isPaused) {
        pauseTTS();
        return;
    }
    if (isPaused) {
        resumeTTS();
        return;
    }
    
    // If not speaking, play the last assistant message
    let textToPlay = currentSpokenMessageRef.current;
    if (!textToPlay) {
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' && m.type !== 'typing_indicator');
      if (lastAssistantMessage) textToPlay = lastAssistantMessage.content;
    }
    
    if (textToPlay) {
        speak(textToPlay, { priority: 'manual' });
    }
  };

  const handleStopTTS = () => { playClickSound(); cancelTTS(); };

  const handleCharacterChange = (newCharacter: ChatbotCharacter) => {
    if (newCharacter === selectedCharacter) return;
    playClickSound();
    setSelectedCharacter(newCharacter);
  };

  const getCurrentCharacterData = () => {
    switch (selectedCharacter) {
        case 'gojo':
            return {
                avatar: "/images/gojo-dp.jpg",
                nameKey: 'chatbot.gojo.name',
                descKey: 'chatbot.gojo.description',
                hint: 'Gojo Satoru',
                fallback: <Bot />
            };
        case 'holo':
            return {
                avatar: "/images/holo-dp.jpg",
                nameKey: 'chatbot.holo.name',
                descKey: 'chatbot.holo.description',
                hint: 'Holo wise wolf',
                fallback: <Wand2 />
            };
        case 'megumin':
            return {
                avatar: "/images/megumin-dp.jpg",
                nameKey: 'chatbot.megumin.name',
                descKey: 'chatbot.megumin.description',
                hint: 'Megumin konosuba',
                fallback: <Atom />
            };
    }
  }
  
  const charData = getCurrentCharacterData();

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
        featureName="guestLock.features.chatbot"
        featureDescription="guestLock.features.chatbotDesc"
        Icon={Bot}
      />
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6 lg:p-8 h-full flex flex-col">
    <Card className="h-full flex flex-col flex-1">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/30">
                  <AvatarImage src={charData.avatar} alt={t(charData.nameKey)} data-ai-hint={charData.hint} />
                  <AvatarFallback>{charData.fallback}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-primary">{t(charData.nameKey)}</CardTitle>
                    <CardDescription>{t(charData.descKey)}</CardDescription>
                </div>
            </div>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
              <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg w-full justify-around xs:w-auto">
                <Button onClick={() => handleCharacterChange('gojo')} variant={selectedCharacter === 'gojo' ? 'default' : 'ghost'} size="sm" className="text-xs h-7 px-3 flex-1 xs:flex-none">
                  {t('chatbot.gojo.name')}
                </Button>
                <Button onClick={() => handleCharacterChange('holo')} variant={selectedCharacter === 'holo' ? 'default' : 'ghost'} size="sm" className="text-xs h-7 px-3 flex-1 xs:flex-none">
                  {t('chatbot.holo.name')}
                </Button>
                 <Button onClick={() => handleCharacterChange('megumin')} variant={selectedCharacter === 'megumin' ? 'default' : 'ghost'} size="sm" className="text-xs h-7 px-3 flex-1 xs:flex-none">
                  {t('chatbot.megumin.name')}
                </Button>
              </div>

              <div className="flex items-center gap-2 justify-center">
                <Button onClick={handlePlaybackControl} variant="outline" size="icon" className="h-8 w-8" title={t(isSpeaking && !isPaused ? 'chatbot.controls.pause' : isPaused ? 'chatbot.controls.resume' : 'chatbot.controls.play')}>
                  {isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                </Button>
                <Button onClick={handleStopTTS} variant="outline" size="icon" className="h-8 w-8" title={t('chatbot.controls.stop')} disabled={!isSpeaking && !isPaused}>
                  <StopCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((msg) => <ChatMessage key={msg.id} message={msg} character={selectedCharacter}/>)}
          </div>
        </ScrollArea>
      </CardContent>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isAiResponding} />
    </Card>
    </div>
  );
}
