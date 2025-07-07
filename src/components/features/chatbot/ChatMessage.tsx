
"use client";

import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Loader2, Wand2, FileText, AudioLines, Video, Atom } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';

interface ChatMessageProps {
  message: ChatMessageType;
  character?: 'gojo' | 'holo' | 'megumin';
}

export function ChatMessage({ message, character = 'gojo' }: ChatMessageProps) {
  const { t, isReady } = useTranslation();
  
  const isUser = message.role === 'user';
  const alignment = isUser ? 'items-end' : 'items-start';
  const bubbleColor = isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground';

  const getAvatarSrc = () => {
    if (isUser) return undefined;
    switch(character) {
        case 'gojo': return "/images/gojo-dp.jpg";
        case 'holo': return "/images/holo-dp.jpg";
        case 'megumin': return "/images/megumin-dp.jpg";
        default: return undefined;
    }
  };
  
  const getAvatarFallback = () => {
    if (isUser) return <User />;
     switch(character) {
        case 'gojo': return <Bot />;
        case 'holo': return <Wand2 />;
        case 'megumin': return <Atom />;
        default: return <Bot />;
    }
  };

  const getAvatarAlt = () => {
    if (isUser) return t('chatbot.avatar.userAlt');
    switch(character) {
        case 'gojo': return t('chatbot.avatar.gojoAlt');
        case 'holo': return t('chatbot.avatar.holoAlt');
        case 'megumin': return t('chatbot.avatar.meguminAlt');
    }
  };

  const getAvatarDataAiHint = () => {
    if (isUser) return "user";
    switch(character) {
        case 'gojo': return "Gojo Satoru";
        case 'holo': return "Holo wise wolf";
        case 'megumin': return "Megumin konosuba";
    }
  }

  if (!isReady) {
    return (
       <div className={cn('flex flex-col gap-2 py-3', alignment)}>
        <div className={cn('flex gap-3 items-start', isUser ? 'flex-row-reverse' : 'flex-row')}>
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
            <div className="max-w-[75%] rounded-lg px-4 py-3 shadow-md flex items-center gap-2 bg-muted animate-pulse h-10 w-40">
            </div>
        </div>
      </div>
    )
  }

  if (message.type === 'typing_indicator') {
    return (
      <div className={cn('flex flex-col gap-2 py-3', alignment)}>
        <div className={cn('flex gap-3 items-start', isUser ? 'flex-row-reverse' : 'flex-row')}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={getAvatarSrc()} alt={getAvatarAlt()} data-ai-hint={getAvatarDataAiHint()} />
            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
          </Avatar>
          <div className={cn('max-w-[75%] rounded-lg px-4 py-3 shadow-md flex items-center gap-2', bubbleColor)}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm italic">{message.content}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2 py-3', alignment)}>
      <div className={cn('flex gap-3 items-start', isUser ? 'flex-row-reverse' : 'flex-row')}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={getAvatarSrc()} alt={getAvatarAlt()} data-ai-hint={getAvatarDataAiHint()} />
          <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
        </Avatar>
        <div className={cn('max-w-[75%] rounded-lg px-4 py-3 shadow-md space-y-2', bubbleColor)}>
          {message.image && message.role === 'user' && (
            <div className="mb-2">
              <Image
                src={message.image}
                alt={t('chatbot.file.image.userAlt')}
                width={200}
                height={200}
                className="rounded-md object-cover"
                data-ai-hint="user image"
              />
            </div>
          )}
          {message.pdfFileName && message.role === 'user' && (
            <div className="mb-2 p-2 border border-muted-foreground/30 rounded-md bg-black/10">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground/80"/>
                <span className="text-sm font-medium text-muted-foreground/90 truncate">{message.pdfFileName}</span>
              </div>
            </div>
          )}
          {message.audioFileName && message.role === 'user' && (
            <div className="mb-2 p-2 border border-muted-foreground/30 rounded-md bg-black/10">
              <div className="flex items-center gap-2">
                <AudioLines className="h-5 w-5 text-muted-foreground/80"/>
                <span className="text-sm font-medium text-muted-foreground/90 truncate">{message.audioFileName}</span>
              </div>
            </div>
          )}
          {message.videoFileName && message.role === 'user' && (
            <div className="mb-2 p-2 border border-muted-foreground/30 rounded-md bg-black/10">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-muted-foreground/80"/>
                <span className="text-sm font-medium text-muted-foreground/90 truncate">{message.videoFileName}</span>
              </div>
            </div>
          )}
          {message.content && (
            <ReactMarkdown
              className="prose prose-sm dark:prose-invert max-w-none [&_p]:m-0"
              components={{
                p: ({node, ...props}) => <p className="mb-0 last:mb-0" {...props} />
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
      <p className={cn('text-xs text-muted-foreground/70', isUser ? 'text-right' : 'text-left', 'px-12')}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
