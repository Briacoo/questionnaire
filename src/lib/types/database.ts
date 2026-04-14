export type Role = "admin" | "manager" | "suspended";

export type QuizStatus = "draft" | "published" | "archived";

export type PageStatus = "draft" | "published";

export type QuestionType =
  | "mcq_single"
  | "mcq_multiple"
  | "true_false"
  | "free_text"
  | "drag_order"
  | "matching"
  | "scale";

export interface Profile {
  id: string;
  pseudo: string;
  role: Role;
  avatar_url: string | null;
  created_at: string;
}

export interface QuizSettings {
  time_limit: number | null;
  passing_score: number | null;
  show_feedback: boolean;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  allow_back_navigation: boolean;
  require_answer: boolean;
  allow_restart: boolean;
  error_message: string | null;
  entry_form_enabled: boolean;
  entry_form_fields: string[];
  max_attempts: number | null;
}

export const ENTRY_FORM_FIELD_OPTIONS = [
  { key: "nom", label: "Nom" },
  { key: "prenom", label: "Prenom" },
  { key: "email", label: "Email" },
  { key: "telephone", label: "Telephone" },
  { key: "entreprise", label: "Entreprise" },
  { key: "poste", label: "Poste" },
  { key: "autre", label: "Autre" },
] as const;

export interface Quiz {
  id: string;
  admin_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  status: QuizStatus;
  settings: QuizSettings;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  time_limit: null,
  passing_score: null,
  show_feedback: false,
  shuffle_questions: false,
  shuffle_answers: false,
  allow_back_navigation: true,
  require_answer: true,
  allow_restart: true,
  error_message: null,
  entry_form_enabled: false,
  entry_form_fields: [],
  max_attempts: null,
};

export interface McqOption {
  id: string;
  text: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface ScaleConfig {
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  step: number;
}

export interface Question {
  id: string;
  quiz_id: string;
  type: QuestionType;
  content: string;
  media_url: string | null;
  options: McqOption[] | MatchingPair[] | ScaleConfig | string[] | null;
  correct_answer: string | string[] | number | Record<string, string> | null;
  feedback: string | null;
  points: number;
  order: number;
}

export interface Submission {
  id: string;
  quiz_id: string;
  participant_name: string | null;
  participant_info: Record<string, string>;
  score: number;
  passed: boolean | null;
  started_at: string;
  completed_at: string | null;
  time_spent: number;
}

export interface Answer {
  id: string;
  submission_id: string;
  question_id: string;
  response: unknown;
  is_correct: boolean;
  time_spent: number;
}

export type BlockType = "heading" | "text" | "image" | "button";

export interface HeadingBlockProps {
  text: string;
  level: 1 | 2 | 3;
  align: "left" | "center" | "right";
  color: string | null;
}

export interface TextBlockProps {
  html: string;
}

export interface ImageBlockProps {
  src: string;
  alt: string;
  fullWidth: boolean;
}

export interface ButtonBlockProps {
  text: string;
  action: "url" | "quiz" | "anchor";
  url: string;
  quizId: string | null;
  anchorBlockId: string | null;
  style: "primary" | "outline";
  color: string | null;
}

export type BlockProps = HeadingBlockProps | TextBlockProps | ImageBlockProps | ButtonBlockProps;

export interface Block {
  id: string;
  type: BlockType;
  props: BlockProps;
}

export interface PageSettings {
  fontFamily: string;
  customFontUrl: string | null;
  h1Size: number;
  h2Size: number;
  h3Size: number;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  blockSpacing: number;
  logoUrl: string | null;
}

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  fontFamily: "Inter",
  customFontUrl: null,
  h1Size: 36,
  h2Size: 28,
  h3Size: 22,
  primaryColor: "#60a5fa",
  secondaryColor: "#a78bfa",
  backgroundColor: "#0a0a0a",
  blockSpacing: 24,
  logoUrl: null,
};

export const PRESET_FONTS = [
  "Inter",
  "Roboto",
  "Poppins",
  "Playfair Display",
  "Montserrat",
  "Lora",
] as const;

export interface Page {
  id: string;
  admin_id: string;
  quiz_id: string | null;
  title: string;
  slug: string;
  blocks: Block[];
  settings: PageSettings;
  status: PageStatus;
  created_at: string;
  updated_at: string;
}
