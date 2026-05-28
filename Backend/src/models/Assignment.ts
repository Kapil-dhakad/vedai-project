import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IQuestionType {
  type: string;
  noOfQuestions: number;
  marks: number;
}

export interface IAssignment extends Document {
  _id: Types.ObjectId;
  title: string;
  subject: string;
  grade: string;
  schoolName: string;
  dueDate: Date;
  questionTypes: IQuestionType[];
  additionalInstructions?: string;
  fileUrl?: string;
  extractedText?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  questionPaperId?: Types.ObjectId;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeSchema = new Schema<IQuestionType>({
  type: { type: String, required: true },
  noOfQuestions: { type: Number, required: true, min: 0 },
  marks: { type: Number, required: true, min: 0 },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true },
    schoolName: { type: String, required: true, trim: true, default: 'Delhi Public School, Bokaro' },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [QuestionTypeSchema], required: true },
    additionalInstructions: { type: String, trim: true },
    fileUrl: { type: String },
    extractedText: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    jobId: { type: String },
    questionPaperId: { type: Schema.Types.ObjectId, ref: 'QuestionPaper' },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

AssignmentSchema.virtual('totalQuestions').get(function () {
  return this.questionTypes.reduce((sum, qt) => sum + qt.noOfQuestions, 0);
});

AssignmentSchema.virtual('totalMarks').get(function () {
  return this.questionTypes.reduce((sum, qt) => sum + qt.noOfQuestions * qt.marks, 0);
});

AssignmentSchema.index({ status: 1, createdAt: -1 });
AssignmentSchema.index({ dueDate: 1 });

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);
