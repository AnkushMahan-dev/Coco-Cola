/**
 * Content model for the Academy curriculum.
 * All lesson content is data-driven: modules are plain TypeScript objects
 * rendered by a single LessonPage engine, so adding a lesson never
 * requires touching a component.
 */

export type Level = "Beginner" | "Intermediate" | "Advanced";

export interface CodeSnippet {
  /** Display language tag, e.g. "abap", "bash", "json", "text", "powershell" */
  language: string;
  /** Optional filename or context label shown in the code block header */
  filename?: string;
  code: string;
}

export interface CalloutData {
  type: "info" | "tip" | "warning" | "danger" | "success";
  title: string;
  body: string;
}

export interface Step {
  title: string;
  /** One or more paragraphs describing the step */
  body: string[];
  code?: CodeSnippet;
  callout?: CalloutData;
}

export interface MediaPlaceholder {
  /** Short caption describing what the screenshot/video will show */
  caption: string;
  /** Alt-style description of the visual for accessibility */
  description: string;
}

export interface VideoPlaceholder extends MediaPlaceholder {
  /** e.g. "8:30" */
  duration: string;
  /** Optional embed URL; when present an iframe is rendered instead of the placeholder */
  url?: string;
}

export interface SapExample {
  title: string;
  /** Business/technical scenario at a real SAP customer */
  scenario: string;
  /** The prompt a developer would give Claude, when relevant */
  prompt?: string;
  code?: CodeSnippet;
  explanation: string[];
}

export interface CommonMistake {
  mistake: string;
  fix: string;
}

export interface Exercise {
  title: string;
  scenario: string;
  tasks: string[];
  hint?: string;
  solution?: CodeSnippet;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Index into options */
  correctIndex: number;
  explanation: string;
}

export interface LessonDownload {
  name: string;
  description: string;
  filename: string;
  /** Markdown/text content generated as a client-side download */
  content: string;
}

export interface Lesson {
  slug: string;
  title: string;
  description: string;
  /** Estimated reading + practice time in minutes */
  duration: number;
  level: Level;
  /** Search keywords in addition to title/description */
  keywords: string[];

  overview: string[];
  objectives: string[];
  steps: Step[];
  screenshots: MediaPlaceholder[];
  video: VideoPlaceholder;
  sapExample: SapExample;
  bestPractices: string[];
  commonMistakes: CommonMistake[];
  tips: string[];
  exercise: Exercise;
  quiz: QuizQuestion[];
  summary: string[];
  download?: LessonDownload;
  /** Slugs of related lessons (rendered as Related Topics) */
  relatedSlugs: string[];
}

export type ModuleIcon =
  | "rocket"
  | "message-square"
  | "sparkles"
  | "plug"
  | "database"
  | "shield"
  | "briefcase"
  | "gauge";

export interface Module {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: ModuleIcon;
  lessons: Lesson[];
}
