
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { processAssistantCommand, type AssistantCommandOutput } from '@/ai/flows/jarvis-command';
import { useToast } from '@/hooks/use-toast';
import { useQuests } from './QuestContext';
import { useAuth } from './AuthContext';
import { useAssistantVoice, type AssistantStatus } from '@/hooks/useAssistantVoice';
import { useSettings } from './SettingsContext';
import { useTheme } from 'next-themes';
import { APP_LANGUAGES } from '@/lib/constants';

type AssistantMode = 'jarvis' | 'alya';

interface TerminalMessage {
  id: number;
  content: string;
  type: 'user' | 'ai' | 'system' | 'error';
}

interface AssistantContextType {
  isTerminalOpen: boolean;
  status: AssistantStatus;
  isAssistantActive: boolean;
  terminalContent: TerminalMessage[];
  toggleAssistant: () => void;
  toggleTerminal: () => void;
  processCommand: (command: string) => Promise<void>;
  addToTerminal: (message: string, type: TerminalMessage['type']) => void;
  activeStudyTab: string;
  setActiveStudyTab: (tab: string) => void;
  lastAssistantAction: AssistantCommandOutput | null;
  setLastAssistantAction: (action: AssistantCommandOutput | null) => void;
  activeArcadeTab: string;
  setActiveArcadeTab: (tab: string) => void;
  dialogToOpen: 'calculator' | 'arcade' | null;
  setDialogToOpen: (dialog: 'calculator' | 'arcade' | null) => void;
  textToType: { targetId: string, text: string } | null;
  setTextToType: (typingRequest: { targetId: string, text: string } | null) => void;
  browserSupportsSpeechRecognition: boolean;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalContent, setTerminalContent] = useState<TerminalMessage[]>([]);
  const [activeStudyTab, setActiveStudyTab] = useState('notes');
  const [activeArcadeTab, setActiveArcadeTab] = useState('definition-challenge');
  const [lastAssistantAction, setLastAssistantAction] = useState<AssistantCommandOutput | null>(null);
  const [dialogToOpen, setDialogToOpen] = useState<'calculator' | 'arcade' | null>(null);
  const [textToType, setTextToType] = useState<{ targetId: string, text: string } | null>(null);

  const { signOutUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { completeQuest1, completeQuest2 } = useQuests();
  const { toast } = useToast();
  const { appLanguage, setAppLanguage, mode, userGoal } = useSettings();
  const { setTheme } = useTheme();

  const addToTerminal = useCallback((content: string, type: TerminalMessage['type']) => {
    setTerminalContent(prev => [...prev, { id: Date.now(), content, type }]);
  }, []);

  const toggleTerminal = useCallback(() => {
    setIsTerminalOpen(prev => !prev);
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use the 'quote' key for the apostrophe/single quote
      if (e.ctrlKey && e.key === "'") {
        e.preventDefault();
        toggleTerminal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTerminal]);

  const executeAction = useCallback((action: AssistantCommandOutput) => {
    setLastAssistantAction(action);
    
    if(action.params?.isWakeWord === true) {
        return;
    }

    switch (action.action) {
      case 'navigate':
        if (action.params?.target) router.push(action.params.target as string);
        break;
      case 'generate_notes':
         if (action.params?.topic) {
            toast({ title: "AI Assistant Request", description: `Generating notes for "${action.params.topic}". Redirecting...` });
            completeQuest1();
            router.push(`/notes?topic=${encodeURIComponent(action.params.topic as string)}`);
        } else {
            router.push('/notes');
        }
        break;
      case 'generate_test':
        if (action.params?.topic) {
            toast({ title: "AI Assistant Request", description: `Creating test for "${action.params.topic}". Redirecting...` });
            const query = new URLSearchParams({
              sourceType: 'topic',
              topics: action.params.topic as string,
              numQuestions: (action.params.numQuestions || 10).toString(),
              difficulty: (action.params.difficulty as string) || 'medium',
              timer: (action.params.timer || 0).toString()
            }).toString();
            completeQuest2();
            router.push(`/custom-test?${query}`);
        } else {
             router.push('/custom-test');
        }
        break;
      case 'generate_college_notes':
        if(action.params?.unit && action.params?.subject) {
            toast({ title: "College Feature Request", description: `Generating notes for ${action.params.subject} - ${action.params.unit}`});

            let subjectId = '';

            if(action.params.subject.toLowerCase().includes('operating system')) subjectId = 'rgpv-cse-4-os';

            if(subjectId) {
                router.push(`/college/${subjectId}?unit=${encodeURIComponent(action.params.unit as string)}`);
            } else {
                 router.push(`/college?subject=${encodeURIComponent(action.params.subject as string)}&unit=${encodeURIComponent(action.params.unit as string)}`);
            }
            completeQuest1();

        } else {
            router.push('/college');
        }
        break;
      case 'read_news':
        toast({ title: "AI Assistant Request", description: `Fetching news...` });
        const newsQuery = new URLSearchParams({ ...action.params as Record<string, string> }).toString();
        router.push(`/news?${newsQuery}`);
        break;
      case 'search_youtube':
      case 'search_books':
        toast({ title: "Library Search", description: `Searching for "${action.params.query}"...`});
        const libraryQuery = new URLSearchParams({
            feature: action.action === 'search_youtube' ? 'youtube' : 'books',
            query: action.params.query as string
        }).toString();
        router.push(`/library?${libraryQuery}`);
        break;
      case 'change_theme':
        if (action.params?.theme && ['light', 'dark', 'system'].includes(action.params.theme as string)) {
          setTheme(action.params.theme as string);
        }
        break;
      case 'change_language':
         if (action.params?.language) {
            const langInfo = APP_LANGUAGES.find(l => l.label.toLowerCase().includes((action.params.language as string).toLowerCase()) || l.englishName.toLowerCase().includes((action.params.language as string).toLowerCase()));
            if (langInfo) setAppLanguage(langInfo.value);
            else toast({ title: "Language not found", description: `Could not find a language matching "${action.params.language}".`, variant: "destructive" });
        }
        break;
      case 'open_recent_topic':
        if(action.params?.topic) {
          router.push(`/study?topic=${encodeURIComponent(action.params.topic as string)}`);
        }
        break;
      case 'switch_tab':
        if (pathname === '/study' && action.params?.tab && ['notes', 'quiz', 'flashcards'].includes(action.params.tab as string)) {
          setActiveStudyTab(action.params.tab as string);
        } else if (pathname === '/chatbot' && action.params?.tab && ['definition-challenge', 'dino-runner', 'chess'].includes(action.params.tab as string)) {
          setActiveArcadeTab(action.params.tab as string);
        }
        break;
      case 'open_terminal':
        setIsTerminalOpen(true);
        break;
      case 'close_terminal':
        setIsTerminalOpen(false);
        break;
      case 'clear_terminal':
        setTerminalContent([]);
        break;
      case 'open_dialog':
        if (action.params?.dialog && ['calculator', 'arcade'].includes(action.params.dialog as string)) {
            setDialogToOpen(action.params.dialog as 'calculator' | 'arcade');
        }
        break;
      case 'type_text':
        if (action.params?.text && action.params?.targetId) {
            setTextToType({ targetId: action.params.targetId as string, text: action.params.text as string });
        }
        break;
      case 'speak_text':
      case 'read_quests':
      case 'select_quiz_answer':
      case 'arcade_guess':
      case 'arcade_hint':
      case 'arcade_restart':
        break;
      case 'logout':
        signOutUser();
        break;
      case 'chat':
        break;
      default:
        addToTerminal(`Action "${action.action}" is recognized but not yet implemented.`, 'system');
        break;
    }
  }, [router, pathname, toast, completeQuest1, completeQuest2, signOutUser, setTheme, setAppLanguage, addToTerminal, setActiveStudyTab, setActiveArcadeTab]);

  const processCommandFromSource = useCallback(async (command: string): Promise<{ verbalResponse: string, action: () => void } | undefined> => {
    if (!command.trim()) return;

    addToTerminal(`> ${command}`, 'user');

    try {
      const languageInfo = APP_LANGUAGES.find(l => l.value === appLanguage);
      const languageName = languageInfo?.englishName || 'English';

      const response = await processAssistantCommand({ command, context: pathname, mode, language: languageName, userGoal: userGoal || undefined });
      const verbalResponse = response.verbal_response || (mode === 'jarvis' ? 'Done.' : 'Okay!');
      addToTerminal(`${mode === 'jarvis' ? 'J.A.R.V.I.S.' : 'Alya'}: ${verbalResponse}`, 'ai');

      return { verbalResponse, action: () => executeAction(response) };

    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred.";
      addToTerminal(errorMessage, 'error');
      return { verbalResponse: (mode === 'jarvis' ? "I've encountered an anomaly." : "Umm, something went wrong..."), action: () => {} };
    }
  }, [pathname, mode, appLanguage, userGoal, addToTerminal, executeAction]);

  const { status, toggleAssistant, browserSupportsSpeechRecognition, isAssistantActive } = useAssistantVoice({
    onCommand: processCommandFromSource,
  });

  // This function is for UI elements like the text input in the terminal.
  const processCommandForUi = useCallback(async (cmd: string) => {
      const result = await processCommandFromSource(cmd);
      if (result?.action) result.action();
  }, [processCommandFromSource]);


  return (
    <AssistantContext.Provider value={{
      isTerminalOpen, status, isAssistantActive,
      terminalContent,
      toggleAssistant, toggleTerminal,
      processCommand: processCommandForUi,
      addToTerminal,
      activeStudyTab, setActiveStudyTab,
      lastAssistantAction, setLastAssistantAction,
      activeArcadeTab, setActiveArcadeTab,
      dialogToOpen, setDialogToOpen,
      textToType, setTextToType,
      browserSupportsSpeechRecognition
    }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}
