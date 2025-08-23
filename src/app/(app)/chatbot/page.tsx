
"use client";

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/features/chatbot/ChatMessage';
import { ChatInput } from '@/components/features/chatbot/ChatInput';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { gojoChatbot, type GojoChatbotInput } from '@/ai/flows/ai-chatbot';
import { helperAiChatbot, type HelperAiChatbotInput } from '@/ai/flows/helper-ai-chatbot';
import { coderAiChatbot, type CoderAiChatbotInput } from '@/ai/flows/coder-ai-chatbot';
import { generateAudioSummaryAction } from '@/lib/actions';
import { Bot, PlayCircle, PauseCircle, StopCircle, Wand2, Loader2, Atom, LifeBuoy, Code2, Code, Gamepad2, Puzzle, Crown, ExternalLink, Download, FileText, MonitorPlay } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DefinitionChallenge } from '@/components/features/arcade/DefinitionChallenge';
import { useAssistant } from '@/contexts/AssistantContext';
import type PptxGenJS from 'pptxgenjs';
import { Logo } from '@/components/icons/Logo';
import Image from 'next/image';


const TYPING_INDICATOR_ID = 'typing-indicator';

type ChatbotCharacter = 'gojo' | 'helper' | 'coder';

export default function ChatbotPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<ChatbotCharacter>('gojo');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { t, isReady } = useTranslation();
  const { appLanguage, userGoal } = useSettings();
  const { activeArcadeTab, setActiveArcadeTab, dialogToOpen, setDialogToOpen } = useAssistant();
  const [isArcadeDialogOpen, setIsArcadeDialogOpen] = useState(false);
  const [lastSpokenMessageId, setLastSpokenMessageId] = useState<string | null>(null);


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
        case 'helper': return 'chatbot.helper.greeting';
        case 'coder': return 'chatbot.coder.greeting';
    }
  }
  
  useEffect(() => {
    if (dialogToOpen === 'arcade') {
      setIsArcadeDialogOpen(true);
      setDialogToOpen(null); // Reset the trigger
    }
  }, [dialogToOpen, setDialogToOpen]);

  useEffect(() => {
    // This effect runs when the selected character or user status changes.
    if (!isReady || user?.isAnonymous) {
      if (user?.isAnonymous) setMessages([]);
      cancelTTS();
      return; // Do not proceed for guests or if translations are not ready
    }

    cancelTTS();
    setVoicePreference(selectedCharacter as any); // Allow 'helper'

    const greetingText = t(getGreetingKey(selectedCharacter));
    const greetingId = `${selectedCharacter}-initial-greeting`;

    const initialGreetingMessage: ChatMessageType = {
      id: greetingId, role: 'assistant',
      content: greetingText, timestamp: new Date()
    };
    
    setMessages([initialGreetingMessage]);
    
    if (lastSpokenMessageId !== greetingId) {
        currentSpokenMessageRef.current = greetingText;
        speak(greetingText, { priority: 'essential' });
        setLastSpokenMessageId(greetingId);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacter, user, isReady]);


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
        case 'helper': return 'chatbot.helper.typing';
        case 'coder': return 'chatbot.coder.typing';
    }
  }
  
  const getErrorToastKey = (char: ChatbotCharacter) => {
    switch(char) {
        case 'gojo': return 'chatbot.gojo.errorToast';
        case 'helper': return 'chatbot.helper.errorToast';
        case 'coder': return 'chatbot.coder.errorToast';
    }
  }

  const getErrorMessageKey = (char: ChatbotCharacter) => {
      switch(char) {
        case 'gojo': return 'chatbot.gojo.errorMessage';
        case 'helper': return 'chatbot.helper.errorMessage';
        case 'coder': return 'chatbot.coder.errorMessage';
    }
  }

  const handleSendMessage = async (
    messageText: string,
    image?: string,
    pdfText?: string,
    pdfFileName?: string,
    audio?: string,
    video?: string,
    audioFileName?: string,
    videoFileName?: string
  ) => {
    if (!messageText.trim() && !image && !pdfText && !audio && !video) return;
    
    cancelTTS(); // Stop any currently playing speech before sending a new message.

    const userMessage: ChatMessageType = { 
      id: Date.now().toString() + '-user', 
      role: 'user', 
      content: messageText, 
      image: image,
      pdfFileName: pdfFileName,
      audioFileName,
      videoFileName,
      timestamp: new Date() 
    };
    
    const currentHistory = messages.filter(m => m.type !== 'typing_indicator' && !m.isError);

    const typingIndicatorMessage = t(getTypingIndicatorKey(selectedCharacter));
    const typingIndicator: ChatMessageType = { id: TYPING_INDICATOR_ID, role: 'assistant', content: typingIndicatorMessage, timestamp: new Date(), type: 'typing_indicator' };

    setMessages(prev => [...prev, userMessage, typingIndicator]);
    setIsAiResponding(true);

    let documentSummary: string | undefined = undefined;

    try {
      // Step 1: If PDF text exists, get a summary first using the reliable audio factory flow
      if (pdfText) {
        toast({ title: t('customTest.file.pdf.processing'), description: t('customTest.file.pdf.processingDesc') });
        const summaryResult = await generateAudioSummaryAction({ text: pdfText });
        if (summaryResult?.summary) {
          documentSummary = summaryResult.summary;
          toast({ title: t('customTest.file.pdf.processed'), description: t('customTest.file.pdf.summaryReady') });
        } else {
          toast({ title: t('customTest.file.pdf.summaryFailed'), description: t('customTest.file.pdf.summaryFailedDesc'), variant: "destructive" });
        }
      }

      const languageLabel = APP_LANGUAGES.find(l => l.value === appLanguage)?.label || 'English';

      const input: GojoChatbotInput | HelperAiChatbotInput | CoderAiChatbotInput = {
        message: messageText,
        language: languageLabel,
        userGoal: userGoal || undefined,
        image,
        audio,
        video,
        document: documentSummary,
        history: currentHistory.map(m => ({ role: m.role, content: m.content })),
      };

      let response;
      switch (selectedCharacter) {
        case 'gojo':
            response = await gojoChatbot(input as GojoChatbotInput);
            break;
        case 'helper':
            response = await helperAiChatbot(input as HelperAiChatbotInput);
            break;
        case 'coder':
            response = await coderAiChatbot(input as CoderAiChatbotInput);
            break;
      }
      
      const assistantMessageId = Date.now().toString() + '-assistant';
      const assistantMessage: ChatMessageType = { id: assistantMessageId, role: 'assistant', content: response.response, timestamp: new Date() };

      setMessages(prev => prev.filter(msg => msg.id !== TYPING_INDICATOR_ID));
      setMessages(prev => [...prev, assistantMessage]);

      if (lastSpokenMessageId !== assistantMessageId) {
        currentSpokenMessageRef.current = assistantMessage.content;
        speak(assistantMessage.content, { priority: 'essential' });
        setLastSpokenMessageId(assistantMessageId);
      }
      
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      const errorToastDesc = t(getErrorToastKey(selectedCharacter));
      toast({ title: t('chatbot.toast.errorTitle'), description: errorToastDesc, variant: "destructive" });
      const errorMessageContent = t(getErrorMessageKey(selectedCharacter));
      const errorMessage: ChatMessageType = { id: Date.now().toString() + '-error', role: 'assistant', content: errorMessageContent, timestamp: new Date(), isError: true };
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
  
  const handleOpenPlayground = () => {
    playClickSound();
    router.push('/coding');
  };

  const handleDownloadPpt = async () => {
    playClickSound();
    toast({ title: "Generating PPTX...", description: "Your chat transcript is being created." });

    const { default: PptxGenJS } = await import('pptxgenjs');

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
    titleSlide.addText(`Chat with ${t(`chatbot.${selectedCharacter}.name`)}`, {
        x: 0.5, y: 2.5, w: '90%', h: 1, align: 'center', fontSize: 36, bold: true, color: 'FFFFFF',
        fontFace: 'Arial', shadow: { type: 'outer', color: '00E6D5', blur: 3, offset: 2, angle: 45, opacity: 0.6 }
    });
    titleSlide.addText(`Generated on: ${new Date().toLocaleDateString()}`, {
        x: 0, y: 3.5, w: '100%', h: 1, align: 'center', fontSize: 16, color: '94A3B8'
    });

    messages.filter(msg => msg.type !== 'typing_indicator').forEach(msg => {
      const slide = pptx.addSlide({ masterName: 'HACKER_MASTER' });
      const speaker = msg.role === 'user' ? (user?.displayName || 'User') : t(`chatbot.${selectedCharacter}.name`);
      const speakerColor = msg.role === 'user' ? '38BDF8' : '4ADE80'; // Light Blue for user, Green for AI

      slide.addText(speaker, { 
        x: 0.5, y: 0.5, w: '90%', h: 0.5, 
        fontSize: 18, bold: true, color: speakerColor,
        anim: { type: 'fadeIn', duration: 0.5, delay: 0.3 }
      });

      slide.addText(msg.content, { 
        x: 0.7, y: 1.1, w: '88%', h: 3.8, 
        fontSize: 15, color: 'E2E8F0', lineSpacing: 28,
        anim: { type: 'fadeIn', duration: 0.5, delay: 0.6 }
      });
      
      slide.addText(new Date(msg.timestamp).toLocaleString(), {
        x: 0.5, y: 5.0, w:'90%', h: 0.2, align: 'right', fontSize: 9, color: '64748B'
      });
    });

    pptx.writeFile({ fileName: `Nexithra_Chat_${selectedCharacter}_${new Date().toISOString().split('T')[0]}.pptx` });
  };


  const getCurrentCharacterData = () => {
    switch (selectedCharacter) {
        case 'gojo':
            return {
                avatar: "/images/Gojo.jpg",
                nameKey: 'chatbot.gojo.name',
                descKey: 'chatbot.gojo.description',
                fallback: <Bot />,
                background: '/icons/v5.mp4',
                backgroundType: 'video',
            };
        case 'helper':
            return {
                avatar: "/images/Helper.jpg",
                nameKey: 'chatbot.helper.name',
                descKey: 'chatbot.helper.description',
                fallback: <LifeBuoy />,
                background: '/images/Helper.jpg',
                backgroundType: 'image',
            };
        case 'coder':
            return {
                avatar: "/images/Coder.jpg",
                nameKey: 'chatbot.coder.name',
                descKey: 'chatbot.coder.description',
                fallback: <Code2 />,
                background: '/images/Coder.jpg',
                backgroundType: 'image',
            };
    }
  }
  
  const charData = getCurrentCharacterData();
  
  const ArcadeDialog = () => (
    <DialogContent className="max-w-4xl w-[95vw] h-auto max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2"><Gamepad2 className="h-6 w-6 text-primary"/> Gojo's Arcade</DialogTitle>
          <DialogDescription>A place to test your skills, curated by The Honored One.</DialogDescription>
        </DialogHeader>
        <div className="p-4 flex-1 overflow-y-auto">
             <Tabs value={activeArcadeTab} onValueChange={setActiveArcadeTab} className="w-full">
                <TabsList className="flex flex-wrap items-center justify-center rounded-md bg-muted p-1.5 text-muted-foreground gap-1.5 mb-6 h-auto sm:grid sm:grid-cols-3 sm:gap-2 sm:h-10 sm:p-1">
                  <TabsTrigger value="definition-challenge" className="text-xs px-2.5 py-1.5 sm:text-sm sm:px-3 sm:py-1.5 flex items-center justify-center">
                    <Puzzle className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" /> {t('arcade.tabs.challenge')}
                  </TabsTrigger>
                  <TabsTrigger value="dino-runner" className="text-xs px-2.5 py-1.5 sm:text-sm sm:px-3 sm:py-1.5 flex items-center justify-center">
                    <ExternalLink className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" /> {t('arcade.tabs.dino')}
                  </TabsTrigger>
                  <TabsTrigger value="chess" className="text-xs px-2.5 py-1.5 sm:text-sm sm:px-3 sm:py-1.5 flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-1.5" /> {t('arcade.tabs.chess')}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="definition-challenge">
                  <DefinitionChallenge />
                </TabsContent>
                <TabsContent value="dino-runner">
                  <Card className="text-center card-bg-2">
                    <CardHeader><CardTitle>{t('arcade.dino.title')}</CardTitle><CardDescription>{t('arcade.dino.description')}</CardDescription></CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-lg">
                        <p className="text-muted-foreground">{t('arcade.dino.getReady')}</p>
                        <Button asChild size="lg"><a href="https://chromedino.com/" target="_blank" rel="noopener noreferrer">{t('arcade.dino.playButton')} <ExternalLink className="w-4 h-4 ml-2"/></a></Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="chess">
                  <Card className="text-center card-bg-1">
                    <CardHeader><CardTitle>{t('arcade.chess.title')}</CardTitle><CardDescription>{t('arcade.chess.description')}</CardDescription></CardHeader>
                    <CardContent>
                       <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-lg">
                        <p className="text-muted-foreground">{t('arcade.chess.getReady')}</p>
                         <Button asChild size="lg"><a href="https://www.chess.com/play/computer" target="_blank" rel="noopener noreferrer">{t('arcade.chess.playButton')} <ExternalLink className="w-4 h-4 ml-2"/></a></Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
            </Tabs>
        </div>
        <DialogClose className="absolute right-4 top-4" />
    </DialogContent>
  );

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
    <div className="h-full flex flex-col py-4">
    <Card className="h-full flex flex-col flex-1 relative overflow-hidden">
      {charData.backgroundType === 'video' ? (
        <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10 opacity-10">
          <source src={charData.background} type="video/mp4" />
        </video>
      ) : (
        <Image 
          src={charData.background}
          alt={`${charData.nameKey} background`}
          layout="fill"
          objectFit="cover"
          className="absolute top-0 left-0 w-full h-full -z-10 opacity-20"
          quality={80}
        />
      )}
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/30">
                  <AvatarImage src={charData.avatar} alt={t(charData.nameKey)} />
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
                <Button onClick={() => handleCharacterChange('helper')} variant={selectedCharacter === 'helper' ? 'default' : 'ghost'} size="sm" className="text-xs h-7 px-3 flex-1 xs:flex-none">
                  {t('chatbot.helper.name')}
                </Button>
                 <Button onClick={() => handleCharacterChange('coder')} variant={selectedCharacter === 'coder' ? 'default' : 'ghost'} size="sm" className="text-xs h-7 px-3 flex-1 xs:flex-none">
                  {t('chatbot.coder.name')}
                </Button>
              </div>

              <div className="flex items-center gap-2 justify-center">
                 {selectedCharacter === 'gojo' && (
                    <Dialog open={isArcadeDialogOpen} onOpenChange={setIsArcadeDialogOpen}>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="icon" className="h-8 w-8" title="Gojo's Arcade">
                                <Gamepad2 className="h-4 w-4" />
                           </Button>
                        </DialogTrigger>
                        <ArcadeDialog />
                    </Dialog>
                )}
                {selectedCharacter === 'coder' && (
                  <Button onClick={handleOpenPlayground} variant="outline" size="icon" className="h-8 w-8" title={t('chatbot.coder.openPlayground')}>
                    <Code className="h-4 w-4" />
                  </Button>
                )}
                <Button onClick={handlePlaybackControl} variant="outline" size="icon" className="h-8 w-8" title={t(isSpeaking && !isPaused ? 'chatbot.controls.pause' : isPaused ? 'chatbot.controls.resume' : 'chatbot.controls.play')}>
                  {isSpeaking && !isPaused ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                </Button>
                <Button onClick={handleStopTTS} variant="outline" size="icon" className="h-8 w-8" title={t('chatbot.controls.stop')} disabled={!isSpeaking && !isPaused}>
                  <StopCircle className="h-4 w-4" />
                </Button>
                 <Dialog>
                  <DialogTrigger asChild>
                     <Button variant="outline" size="icon" className="h-8 w-8" title="Download Chat">
                        <Download className="h-4 w-4" />
                     </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Download Chat Transcript</DialogTitle>
                      <DialogDescription>
                        Choose your preferred format to download the conversation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center gap-4 py-4">
                        <Button onClick={handleDownloadPpt}><MonitorPlay className="mr-2 h-4 w-4"/>Download PPT</Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
      <ChatInput onSendMessage={handleSendMessage} isLoading={isAiResponding} character={selectedCharacter} />
    </Card>
    </div>
  );
}
