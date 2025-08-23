
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PptxGenJS from 'pptxgenjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, MonitorPlay, PlayCircle, PauseCircle, StopCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/use-toast';
import AiGeneratedImage from './AiGeneratedImage';
import { useTranslation } from '@/hooks/useTranslation';
import { Logo } from '../icons/Logo';
import { cn } from '@/lib/utils';

interface NotesViewProps {
  notesContent: string | null;
  topic: string;
}

const NotesView: React.FC<NotesViewProps> = ({ notesContent, topic }) => {
  const {
    speak,
    pauseTTS,
    resumeTTS,
    cancelTTS,
    isSpeaking,
    isPaused,
    isLoading: isTTSLoading,
    setVoicePreference,
  } = useTTS();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { toast } = useToast();
  const { t } = useTranslation();

  const [cleanedNotesForTTS, setCleanedNotesForTTS] = useState<string>("");

  useEffect(() => {
    setVoicePreference('holo');
  }, [setVoicePreference]);

  useEffect(() => {
    if (notesContent) {
      const textForSpeech = notesContent
        .replace(/\[VISUAL_PROMPT:[^\]]+\]/gi, `(${t('notesView.visualAid.title')})`)
        .replace(/#+\s*/g, '')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/---|===/g, '');
      setCleanedNotesForTTS(textForSpeech);
    } else {
      setCleanedNotesForTTS("");
    }
  }, [notesContent, t]);
  
  useEffect(() => {
    return () => {
      cancelTTS();
    }
  }, [cancelTTS]);

  const handlePlaybackControl = useCallback(() => {
    playClickSound();
    if (!cleanedNotesForTTS) {
        toast({title: t('notesView.speak.toast.noContent'), description: t('notesView.speak.toast.noContentDesc'), variant: "destructive"});
        return;
    }
    if (isSpeaking && !isPaused) pauseTTS();
    else if (isPaused) resumeTTS();
    else speak(cleanedNotesForTTS, { priority: 'manual' });
  }, [playClickSound, cleanedNotesForTTS, isSpeaking, isPaused, pauseTTS, resumeTTS, speak, toast, t]);

  const handleStopTTS = useCallback(() => {
    playClickSound();
    cancelTTS();
  }, [playClickSound, cancelTTS]);

  const handleDownloadTxt = () => {
    playClickSound();
    if (!notesContent) {
      toast({ title: t('notesView.download.toast.noNotes'), description: t('notesView.download.toast.noNotesDesc'), variant: "destructive" });
      return;
    }
    const plainText = notesContent
      .replace(/\[VISUAL_PROMPT:[^\]]+\]/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/(\r\n|\n|\r)/gm, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/---|===/g, '\n\n');

    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${topic.replace(/\s+/g, '_')}_notes.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: t('notesView.download.toast.success'), description: t('notesView.download.toast.successDesc') });
  };
  
  const handleDownloadPdf = async () => {
    playClickSound();
    if (!notesContent) {
        toast({ title: t('notesView.download.toast.noNotes'), description: t('notesView.download.toast.noNotesDesc'), variant: "destructive" });
        return;
    }
    toast({ title: "Generating PDF...", description: "Your document is being prepared. This may take a moment." });

    const { default: html2pdf } = await import('html2pdf.js');
    const element = document.getElementById('printable-notes-area');
    if (element) {
        // Temporarily add a class to the body to activate print styles
        document.body.classList.add('printing');
        const opt = {
            margin: 0.5,
            filename: `${topic.replace(/\s+/g, '_')}_notes.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save().then(() => {
            // Remove the class after the PDF is generated
            document.body.classList.remove('printing');
        }).catch(() => {
             document.body.classList.remove('printing');
        });
    }
};

 const handleDownloadPpt = async () => {
    playClickSound();
    if (!notesContent) {
      toast({ title: t('notesView.download.toast.noNotes'), description: t('notesView.download.toast.noNotesDesc'), variant: "destructive" });
      return;
    }
    toast({ title: "Generating PPTX...", description: "Your presentation is being created. Please wait." });
    
    const { default: PptxGenJS } = await import('pptxgenjs');

    const pptx = new PptxGenJS();
    
    pptx.defineSlideMaster({
      title: 'HACKER_MASTER',
      background: { color: '0A192F' }, // Midnight Blue
      objects: [
        { 'line': { x: 0.5, y: 5.3, w: 9.0, h: 0, line: { color: '00E6D5', width: 1 } } },
        { 'text': { text: 'Generated by Nexithra AI', options: { x: 0.5, y: 5.3, w: '90%', h: 0.2, align: 'left', fontFace: 'Arial', fontSize: 10, color: '94A3B8' } } },
        { 'image': { path: '/icons/icon-192x192.png', x: 9.2, y: 0.3, w: 0.5, h: 0.5 } }
      ]
    });

    const titleSlide = pptx.addSlide({ masterName: 'HACKER_MASTER' });
    titleSlide.addText(topic, {
      x: 0.5, y: 2, w: '90%', h: 1.5,
      align: 'center', fontSize: 40, bold: true, color: 'FFFFFF',
      fontFace: 'Arial', shadow: { type: 'outer', color: '00E6D5', blur: 3, offset: 2, angle: 45, opacity: 0.6 },
      anim: { type: 'fadeIn', duration: 1, delay: 0.5 }
    });
    titleSlide.addText("AI-Generated Study Materials", {
      x: 0, y: 3.2, w: '100%', h: 1,
      align: 'center', fontSize: 18, color: '94A3B8',
      anim: { type: 'fadeIn', duration: 1, delay: 1 }
    });

    const addSlideWithContent = (title: string, content: PptxGenJS.TextProps[], options: { isTable?: boolean, tableData?: string[][] } = {}) => {
        const slide = pptx.addSlide({ masterName: 'HACKER_MASTER' });
        slide.addText(title, { 
            x: 0.5, y: 0.4, w: '85%', h: 0.6, 
            fontSize: 22, bold: true, color: '00E6D5',
            anim: { type: 'slideUp', duration: 0.5 }
        });

        if (options.isTable && options.tableData) {
            slide.addTable(options.tableData, {
                x: 0.5, y: 1.2, w: 9.0,
                head: 1,
                border: { type: 'solid', pt: 1, color: '00BFFF' },
                color: 'FFFFFF',
                fill: { color: '0A192F' },
                autoPage: true,
                colW: Array(options.tableData[0].length).fill(9.0 / options.tableData[0].length),
            });
        } else {
            slide.addText(content, { 
                x: 0.5, y: 1.2, w: '90%', h: 3.8, 
                fontSize: 15, color: 'E2E8F0',
                lineSpacing: 28,
                anim: { type: 'fadeIn', duration: 0.5, delay: 0.3 }
            });
        }
    };
    
    const sections = notesContent.split(/---\s*/).map(s => s.trim()).filter(s => s);

    sections.forEach(section => {
        const headingMatch = section.match(/^(#+)\s*(.*)/);
        let headingText = 'Content';
        let contentAfterHeading = section;

        if (headingMatch) {
            headingText = headingMatch[2].trim();
            contentAfterHeading = section.substring(headingMatch[0].length).trim();
        }
        
        const bodyContent = contentAfterHeading.replace(/\[VISUAL_PROMPT:[^\]]+\]/g, '').trim();
        if (bodyContent.split(/\s+/).length <= 2) return; // Skip slide if body is too short
        
        const MAX_CHARS_PER_SLIDE = 800; // Adjust as needed
        let remainingText = bodyContent;
        let partCounter = 1;

        while(remainingText.length > 0) {
            let chunk = remainingText;
            if (remainingText.length > MAX_CHARS_PER_SLIDE) {
                let breakPoint = remainingText.lastIndexOf('\n', MAX_CHARS_PER_SLIDE);
                if (breakPoint === -1) breakPoint = remainingText.lastIndexOf(' ', MAX_CHARS_PER_SLIDE);
                if (breakPoint === -1) breakPoint = MAX_CHARS_PER_SLIDE;
                chunk = remainingText.substring(0, breakPoint);
            }
            
            remainingText = remainingText.substring(chunk.length).trim();

            const slideContent: PptxGenJS.TextProps[] = chunk.split('\n').map(line => {
                const isListItem = /^(-|\*|\d+\.)\s+/.test(line);
                return {
                  text: line.replace(/^(-|\*|\d+\.)\s+/, '').replace(/(\*\*|__)(.*?)\1/g, '$2').trim(),
                  options: { bullet: isListItem, indentLevel: isListItem ? 1 : 0 }
                };
            });
            
            const slideTitle = `${headingText}${partCounter > 1 || remainingText.length > 0 ? ` (Part ${partCounter})` : ''}`;
            addSlideWithContent(slideTitle, slideContent);
            partCounter++;
        }
    });

    pptx.writeFile({ fileName: `${topic.replace(/\s+/g, '_')}_presentation.pptx` });
  };

  const customRenderers = {
    p: ({ node, ...props }: any) => {
      const firstChild = node.children[0];
      if (
        node.children.length === 1 &&
        firstChild.type === 'text' &&
        (firstChild.value as string).startsWith('[VISUAL_PROMPT:')
      ) {
        const promptText = (firstChild.value as string)
          .substring('[VISUAL_PROMPT:'.length, firstChild.value.length - 1)
          .trim();
        return <AiGeneratedImage promptText={promptText} />;
      }
      return <p className="my-2 leading-relaxed text-sm sm:text-base break-words" {...props} />;
    },
    h1: ({node, ...props}: any) => <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mt-4 sm:mt-6 mb-2 sm:mb-3 pb-2 border-b border-primary/30 text-primary break-words" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mt-3 sm:mt-5 mb-2 sm:mb-2.5 pb-1 border-b border-primary/20 text-primary/90 break-words" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-base sm:text-lg md:text-xl font-semibold mt-3 sm:mt-4 mb-1.5 sm:mb-2 text-primary/80 break-words" {...props} />,
    h4: ({node, ...props}: any) => <h4 className="text-sm sm:text-base md:text-lg font-semibold mt-2 sm:mt-3 mb-1 sm:mb-1.5 text-primary/70 break-words" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-4 sm:pl-5 my-2 space-y-1 text-sm sm:text-base" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-4 sm:pl-5 my-2 space-y-1 text-sm sm:text-base" {...props} />,
    li: ({node, ...props}: any) => <li className="break-words leading-relaxed" {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-accent pl-3 sm:pl-4 py-2 my-3 italic bg-accent/10 text-accent-foreground/90 rounded-r-md text-sm sm:text-base break-words" {...props} />,
    code: ({ node, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '');
        return match ? (
          <div className="w-full overflow-x-auto my-2">
            <pre className="bg-muted/50 p-2 sm:p-3 rounded-md text-xs sm:text-sm whitespace-pre-wrap break-words">
              <code className={className} {...props}>{children}</code>
            </pre>
          </div>
        ) : (
          <code className="bg-muted/50 px-1 py-0.5 rounded-sm text-xs sm:text-sm text-primary break-words" {...props}>{children}</code>
        );
    },
    table: ({node, ...props}: any) => (
      <div className="w-full overflow-x-auto my-3 -mx-2 sm:mx-0">
        <div className="min-w-full px-2 sm:px-0">
          <table className="table-auto w-full border-collapse border border-border text-xs sm:text-sm" {...props} />
        </div>
      </div>
    ),
    th: ({node, ...props}: any) => <th className="border border-border px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/40 font-medium text-left text-xs sm:text-sm break-words" {...props} />,
    td: ({node, ...props}: any) => <td className="border border-border px-2 sm:px-3 py-1 sm:py-1.5 text-left text-xs sm:text-sm break-words" {...props} />,
    img: ({ node, ...props }: any) => {
      return (
        <div className="w-full my-4 flex justify-center">
          <img 
            {...props} 
            className="max-w-full h-auto rounded-lg shadow-md" 
            alt={props.alt || 'AI generated image'}
            style={{ maxHeight: '300px' }} 
          />
        </div>
      );
    },
    strong: ({node, ...props}: any) => <strong className="font-semibold break-words" {...props} />,
    em: ({node, ...props}: any) => <em className="italic break-words" {...props} />,
  };
  
  const getPlaybackButtonTitle = () => {
      if (isTTSLoading) return t('notesView.speak.loading');
      if (isSpeaking && !isPaused) return t('notesView.speak.pause');
      if (isPaused) return t('notesView.speak.resume');
      return t('notesView.speak.start');
  };

  return (
    <Card className="mt-0 shadow-lg flex-1 flex flex-col min-h-0 w-full">
      <CardHeader className="sticky top-0 bg-background/90 backdrop-blur-sm z-10 border-b no-print px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col gap-3">
          <CardTitle className="text-sm sm:text-base md:text-lg text-primary font-semibold flex items-center gap-2 break-words leading-tight">
            {t('notesView.title', { topic })}
          </CardTitle>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-start">
            <Button 
              onClick={handlePlaybackControl} 
              variant="outline" 
              size="icon" 
              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0" 
              title={getPlaybackButtonTitle()} 
              disabled={isTTSLoading}
            >
              {isTTSLoading ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin"/>
              ) : isSpeaking && !isPaused ? (
                <PauseCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
            <Button 
              onClick={handleStopTTS} 
              variant="outline" 
              size="icon" 
              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0" 
              title={t('notesView.speak.stop')} 
              disabled={!isSpeaking && !isPaused}
            >
              <StopCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleDownloadTxt} 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Download as .txt</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleDownloadPpt} 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                  >
                    <MonitorPlay className="h-3 w-3 sm:h-4 sm:w-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Download as PPT</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                      onClick={handleDownloadPdf} 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="sm:w-4 sm:h-4">
                        <path d="M4.603 2.146a.5.5 0 0 1 .707.708L2.707 5.5h10.586l-2.604-2.646a.5.5 0 1 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 6.5H2.707l2.604 2.646a.5.5 0 1 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708z"/>
                        <path fillRule="evenodd" d="M1 2.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5zM1 12.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5z"/>
                      </svg>
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Download as PDF</p></TooltipContent>
            </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col min-h-0 w-full">
        <ScrollArea className="h-full w-full">
          <div id="printable-notes-area" className="min-w-0 w-full p-3 sm:p-4 md:p-6 bg-background text-foreground">
            <div className="hidden print:block text-center p-4 border-b border-border">
              <Logo size={40} className="mx-auto"/>
              <h1 className="text-2xl font-bold mt-2" style={{ color: 'hsl(var(--primary))' }}>{topic}</h1>
              <p className="text-xs text-muted-foreground">Generated by Nexithra AI on {new Date().toLocaleDateString()}</p>
            </div>
            <div className="w-full overflow-hidden">
              <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={customRenderers}
                  className="prose prose-sm sm:prose-base dark:prose-invert max-w-none w-full break-words hyphens-auto"
              >
                  {notesContent || t('notesView.speak.toast.noContent')}
              </ReactMarkdown>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotesView;
