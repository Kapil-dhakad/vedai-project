export interface QuestionType {
  type: string;
  noOfQuestions: number;
  marks: number;
}

export type AssignmentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  grade: string;
  schoolName: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions?: string;
  fileUrl?: string;
  status: AssignmentStatus;
  jobId?: string;
  questionPaperId?: string;
  errorMessage?: string;
  totalQuestions?: number;
  totalMarks?: number;
  createdAt: string;
  updatedAt: string;
}

export type Difficulty = 'Easy' | 'Moderate' | 'Challenging';

export interface Question {
  no: number;
  text: string;
  difficulty: Difficulty;
  marks: number;
  answer?: string;
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface QuestionPaper {
  _id: string;
  assignmentId: string;
  schoolName: string;
  subject: string;
  grade: string;
  timeAllowed: number;
  totalMarks: number;
  sections: Section[];
  generalInstruction: string;
  generatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: string;
  cached?: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  grade: string;
  schoolName: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions: string;
  file: File | null;
}

export interface WSEvent {
  type: 'status' | 'error' | 'connected' | 'subscribed';
  assignmentId?: string;
  status?: AssignmentStatus;
  paperId?: string;
  message?: string;
  progress?: number;
}

export const DEFAULT_QUESTION_TYPES: QuestionType[] = [
  { type: 'Multiple Choice Questions', noOfQuestions: 5, marks: 1 },
  { type: 'Short Questions', noOfQuestions: 3, marks: 2 },
  { type: 'Diagram/Graph Based Questions', noOfQuestions: 2, marks: 3 },
  { type: 'Numerical Problems', noOfQuestions: 2, marks: 3 },
  { type: 'Long Answer Questions', noOfQuestions: 1, marks: 5 },
];
