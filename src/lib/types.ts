

// For AI Generated Content
export interface QuizQuestion {
  question: string;
  options?: string[]; 
  answer: string;
  type: 'multiple-choice' | 'short-answer'; 
  explanation?: string; 
  userAnswer?: string; 
  isCorrect?: boolean; 
}

export interface Flashcard {
  term: string;
  definition: string; 
}

// Input/Output types for AI flows (matching Zod schemas in flows)
export type GenerateStudyNotesInput = { 
  topic: string;
  image?: string;
  notes?: string; 
  audio?: string;
  video?: string;
};
export type GenerateStudyNotesOutput = { notes: string };

export type GenerateQuizQuestionsInput = { 
  topic: string, 
  numQuestions: number, 
  difficulty?: 'easy' | 'medium' | 'hard',
  image?: string;
  audio?: string;
  video?: string;
  notes?: string; // Add notes to input for quiz from notes
};
export type GenerateQuizQuestionsOutput = { questions: QuizQuestion[] };

export type GenerateFlashcardsInput = { 
  topic: string; 
  numFlashcards: number;
  image?: string; 
};
export type GenerateFlashcardsOutput = { flashcards: Flashcard[] };

// For Quiz Generation from Notes
export type GenerateQuizFromNotesInput = {
  notesContent: string;
  numQuestions: number;
  language?: string;
};
// Output type uses GenerateQuizQuestionsOutput as the structure is the same.

// For Flashcard Generation from Notes
export type GenerateFlashcardsFromNotesInput = {
  notesContent: string;
  numFlashcards: number;
};
// Output type uses GenerateFlashcardsOutput as the structure is the same.


// For Audio Flashcard Generation
export type GenerateAudioFlashcardsInput = { 
  topic: string; 
  numFlashcards: number;
};
export type GenerateAudioFlashcardsOutput = {
  flashcards: Flashcard[];
  audioDataUri?: string;
};

// For Audio Summary Generation (New for Audio Factory)
export interface GenerateAudioSummaryInput {
  text?: string;
  imageDataUri?: string;
  language?: string; // e.g., 'English', 'Japanese'
}
export interface GenerateAudioSummaryOutput {
  summary: string;
  audioDataUri?: string; // Changed to optional as it's no longer generated on the server
}

// For Audio Discussion Generation
export interface GenerateDiscussionAudioInput {
  content: string;
}
export interface GenerateDiscussionAudioOutput {
  audioDataUri: string;
}


// For News API
export interface NewsArticle {
  article_id: string;
  title: string;
  link: string;
  keywords: string[] | null;
  creator: string[] | null;
  video_url: string | null;
  description: string | null;
  content?: string; 
  pubDate: string;
  image_url: string | null;
  source_id: string;
  source_priority: number;
  country: string[];
  category: string[];
  language: string;
  ai_tag?: string;
  sentiment?: string;
  sentiment_stats?: object;
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  results: NewsArticle[];
  nextPage?: string;
}

// For Math Fact API
export interface MathFact {
  fact: string;
}

// For Motivational Quote
export interface TranslatedQuote {
  quote: string;
  author: string;
}

// For Calculator
export type CalculatorButtonType = 
  | 'digit' 
  | 'operator' 
  | 'action' 
  | 'equals'
  | 'decimal'
  | 'memory' 
  | 'scientific';

export interface CalculatorButtonConfig {
  value: string;
  label: string; 
  type: CalculatorButtonType;
  className?: string; 
  action?: string; 
}

export type UnitCategory = 'Length' | 'Temperature' | 'Weight/Mass' | 'Volume' | 'Area' | 'Speed';

export interface Unit {
  name: string;
  symbol: string;
  factor: number; 
  offset?: number; 
}

export interface UnitConverterState {
  fromUnit: string;
  toUnit: string;
  inputValue: string;
  outputValue: string;
  category: UnitCategory;
}

// For Chatbot
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; 
  pdfFileName?: string;
  audioFileName?: string;
  videoFileName?: string;
  timestamp: Date;
  type?: 'typing_indicator';
  fileOperations?: FileOperation[];
  isError?: boolean;
}

// For Custom Test
export interface TestSettings {
  topics: string[];
  notes?: string;
  sourceType: 'topic' | 'notes' | 'recent';
  selectedRecentTopics?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  timer?: number; 
  perQuestionTimer?: number;
}


// For Definition Challenge Game in /arcade
export interface DefinitionChallengeWord {
  term: string;
  definition: string;
  hint: string; 
}

// For YouTube Search Flow
export interface YoutubeVideoItem {
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  channelTitle?: string;
  publishedAt?: string; // Added publish date
}
export interface YoutubeSearchInput {
  query: string;
  maxResults?: number;
}
export interface YoutubeSearchOutput {
  videos: YoutubeVideoItem[];
}

// For Google Books Search Flow
export interface GoogleBookItem {
  bookId: string;
  title: string;
  authors?: string[];
  description?: string;
  thumbnailUrl?: string;
  publishedDate?: string;
  pageCount?: number;
  infoLink?: string;
  embeddable: boolean; // Can the book be viewed in an embedded viewer?
  previewLink?: string; // Link to a web preview (often same as infoLink or more specific)
  webReaderLink?: string; // Specific link for web reader if available
}
export interface GoogleBooksSearchInput {
  query: string;
  maxResults?: number;
}
export interface GoogleBooksSearchOutput {
  books: GoogleBookItem[];
}

// For Combined Study Materials Action
export interface CombinedStudyMaterialsOutput {
  notesOutput: GenerateStudyNotesOutput;
  notesError?: string;
  quizOutput?: GenerateQuizQuestionsOutput;
  flashcardsOutput?: GenerateFlashcardsOutput;
  quizError?: string;
  flashcardsError?: string;
}

// Generic type for TanStack Query useQuery error (can be more specific if needed)
export type QueryError = Error & { cause?: any; errors?: {message: string}[] };


// For Coding Playground
export interface CodeFile {
  name: string;
  language: string;
  content: string;
}

// For Prototyper AI Flow
export interface FileOperation {
  operation: 'create' | 'update' | 'delete';
  fileName: string;
  content?: string;
}

// For Playground Project Slots
export interface ProjectSlot {
  id: number;
  name: string;
  timestamp: number;
  files: CodeFile[];
}

// For Goal Selection
export type GoalType = 'college' | 'general' | 'neet' | 'jee' | 'school-boards' | 'ias' | 'school-prep' | 'olympiad' | 'govt-exams' | 'entrance-exam' | 'gate' | 'finance';

export interface UserGoal {
  type: GoalType;
  country: string; // Add country to the goal
  university?: string;
  program?: string;
  branch?: string;
  semester?: string;
  board?: 'CBSE' | 'ICSE' | 'International';
  class?: string;
}
