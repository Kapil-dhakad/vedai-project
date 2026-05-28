import mongoose, { Document, Schema, Types } from 'mongoose';

export type Difficulty = 'Easy' | 'Moderate' | 'Challenging';

export interface IQuestion {
  no: number;
  text: string;
  difficulty: Difficulty;
  marks: number;
  answer?: string;
}

export interface ISection {
  title: string;       // "Section A"
  instruction: string; // "Attempt all questions. Each question carries 2 marks."
  questions: IQuestion[];
}

export interface IQuestionPaper extends Document {
  _id: Types.ObjectId;
  assignmentId: Types.ObjectId;
  schoolName: string;
  subject: string;
  grade: string;
  timeAllowed: number; // in minutes
  totalMarks: number;
  sections: ISection[];
  generalInstruction: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  no: { type: Number, required: true },
  text: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Challenging'],
    required: true,
  },
  marks: { type: Number, required: true, min: 1 },
  answer: { type: String },
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true },
});

const QuestionPaperSchema = new Schema<IQuestionPaper>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    schoolName: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    timeAllowed: { type: Number, required: true, default: 45 },
    totalMarks: { type: Number, required: true },
    sections: { type: [SectionSchema], required: true },
    generalInstruction: {
      type: String,
      default: 'All questions are compulsory unless stated otherwise.',
    },
    generatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
