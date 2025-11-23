/**
 * =============================================================================
 * POLLING SYSTEM - TYPE DEFINITIONS (ENHANCED WITH SECTIONS & SUCCESS MESSAGE)
 * =============================================================================
 */

export type QuestionType = 
  | "short-answer"
  | "paragraph"
  | "multiple-choice"
  | "checkbox"
  | "dropdown"
  | "file-upload"
  | "linear-scale"
  | "star-rating"
  | "matrix-grid"
  | "yes-no"
  | "date"
  | "time"
  | "section-break";

export type PollType = "poll" | "evaluation" | "survey" | "assessment" | "form";

export type PollStatus = "open" | "closed" | "draft";

export type Visibility = "public" | "private";

export type TargetAudience = "all" | "officers" | "auditors" | "committee" | "custom";

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  imageUrl?: string;
  optionImages?: { [key: string]: string };
  
  // Linear scale
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  
  // Matrix grid
  rows?: string[];
  columns?: string[];
  
  // Settings
  shuffleChoices?: boolean;
  allowOther?: boolean;
  
  // File upload settings
  acceptedFileTypes?: string; // e.g., "image/*" or "application/pdf,.doc,.docx"
  maxFileSize?: number; // in MB
  
  // Conditional logic
  conditionalLogic?: {
    showIf: {
      questionId: string;
      operator: "equals" | "contains" | "greater" | "less";
      value: any;
    };
  };
}

export interface PollSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  type: PollType;
  status: PollStatus;
  visibility: Visibility;
  
  // Creator info
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  
  // Deadline
  deadline?: string;
  openForever: boolean;
  scheduledPublish?: string;
  
  // Questions (legacy - for backward compatibility)
  questions: Question[];
  
  // Sections (new - for section-based polls)
  sections?: PollSection[];
  useSections: boolean; // Toggle between section mode and single-page mode
  
  // Success message (customizable)
  successMessage?: string;
  showSuccessMessage: boolean;
  
  // Target audience (for private polls)
  targetAudience: TargetAudience;
  specificCommittee?: string;
  customAudience?: string[];
  
  // Response settings
  allowEditAfterSubmit: boolean;
  allowMultipleSubmissions: boolean;
  anonymousResponses: boolean;
  autosaveResponses: boolean;
  randomizeQuestionOrder: boolean;
  randomizeChoiceOrder: boolean;
  showResultsToParticipants: boolean;
  
  // Security
  accountOnlySubmissions: boolean;
  ipLock: boolean;
  deviceLock: boolean;
  timerMinutes?: number;
  blockTabSwitching: boolean;
  
  // Permissions
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  editPermissions: string[];
  viewResultsPermissions: string[];
  
  // Theme
  theme: PollTheme;
  
  // Stats
  responses: number;
  views: number;
  shareLink?: string;
}

export interface PollTheme {
  // Header
  headerImage?: string;
  headerOverlay?: "dark" | "light" | "none";
  headerAlignment?: "center" | "left" | "right";
  
  // Colors
  primaryColor: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  accentColor: string;
  
  // Typography
  headingFont: string;
  subheadingFont: string;
  bodyFont: string;
  
  // Layout
  spacing: "compact" | "normal" | "wide";
  cardStyle: "glass" | "solid" | "border" | "transparent";
  alignment: "left" | "centered" | "wide";
  
  // Branding
  showLogo: boolean;
  customLogo?: string;
  footerText?: string;
}

export interface PollResponse {
  id: string;
  pollId: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  userCommittee?: string;
  isAnonymous: boolean;
  
  submittedAt: string;
  updatedAt?: string;
  
  ipAddress?: string;
  deviceId?: string;
  
  answers: {
    questionId: string;
    answer: any;
  }[];
  
  completionTime?: number; // in seconds
}

export interface PollAnalytics {
  totalResponses: number;
  completionRate: number;
  averageTime: number;
  
  byRole?: { [key: string]: number };
  byCommittee?: { [key: string]: number };
  byDate?: { [key: string]: number };
  
  questionStats: {
    questionId: string;
    type: QuestionType;
    responses: number;
    
    // For choice questions
    choiceDistribution?: { [key: string]: number };
    
    // For rating questions
    averageRating?: number;
    ratingDistribution?: { [key: number]: number };
    
    // For text questions
    commonWords?: { word: string; count: number }[];
  }[];
}
