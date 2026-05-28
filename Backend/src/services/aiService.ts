import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAssignment } from '../models/Assignment';
import { ISection, Difficulty } from '../models/QuestionPaper';

interface GeneratedPaper {
  sections: ISection[];
  totalMarks: number;
  timeAllowed: number;
  generalInstruction: string;
}

const SECTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const buildPrompt = (assignment: IAssignment): string => {
  const questionTypesText = assignment.questionTypes
    .filter((qt) => qt.noOfQuestions > 0)
    .map(
      (qt, i) =>
        `Section ${SECTION_LABELS[i]}: ${qt.type} — ${qt.noOfQuestions} questions, ${qt.marks} mark(s) each`
    )
    .join('\n');

  const totalMarks = assignment.questionTypes.reduce(
    (sum, qt) => sum + qt.noOfQuestions * qt.marks,
    0
  );

  const contextSection = assignment.extractedText
    ? `\nReference Material (extracted from uploaded file):\n"""\n${assignment.extractedText.slice(0, 3000)}\n"""`
    : '';

  return `You are an expert teacher creating a formal question paper for students.

Assignment Details:
- Subject: ${assignment.subject}
- Grade/Class: ${assignment.grade}
- School: ${assignment.schoolName}
- Total Marks: ${totalMarks}
- Additional Instructions: ${assignment.additionalInstructions || 'None'}
${contextSection}

Question Paper Structure:
${questionTypesText}

CRITICAL RULES:
1. Generate questions appropriate for Grade ${assignment.grade} students.
2. Vary difficulty: mix Easy, Moderate, and Challenging across sections naturally.
3. Questions must be subject-specific, meaningful, and educationally sound.
4. Return ONLY valid JSON. No markdown, no code fences, no extra text.
5. Each section must have exactly the number of questions specified.
6. Answers must be complete and accurate.

Return this EXACT JSON structure:
{
  "generalInstruction": "All questions are compulsory unless stated otherwise.",
  "timeAllowed": <number in minutes, calculate based on total marks>,
  "totalMarks": ${totalMarks},
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "questions": [
        {
          "no": 1,
          "text": "<full question text>",
          "difficulty": "Easy",
          "marks": <number>,
          "answer": "<complete answer>"
        }
      ]
    }
  ]
}

Difficulty must be exactly one of: "Easy", "Moderate", "Challenging"
Generate NOW:`;
};

const parseGeminiResponse = (rawText: string): GeneratedPaper => {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let parsed: GeneratedPaper;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid response: missing sections array');
  }

  const validDifficulties: Difficulty[] = ['Easy', 'Moderate', 'Challenging'];
  parsed.sections = parsed.sections.map((section, si) => ({
    ...section,
    title: section.title || `Section ${SECTION_LABELS[si]}`,
    instruction: section.instruction || 'Attempt all questions.',
    questions: section.questions.map((q, qi) => ({
      ...q,
      no: q.no || qi + 1,
      difficulty: validDifficulties.includes(q.difficulty as Difficulty)
        ? q.difficulty
        : 'Moderate',
      marks: Number(q.marks) || 1,
    })),
  }));

  return parsed;
};

export class AIService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateQuestionPaper(assignment: IAssignment): Promise<GeneratedPaper> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    const prompt = buildPrompt(assignment);
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🤖 AI generation attempt ${attempt} for assignment ${assignment._id}`);
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();

        if (!rawText || rawText.trim().length === 0) {
          throw new Error('Empty response from Gemini');
        }

        const parsed = parseGeminiResponse(rawText);
        console.log(
          `✅ AI generation successful: ${parsed.sections.length} sections, ${parsed.totalMarks} total marks`
        );
        return parsed;
      } catch (err) {
        lastError = err as Error;
        console.warn(`⚠️  Attempt ${attempt} failed: ${lastError.message}`);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    throw new Error(`AI generation failed after 3 attempts: ${lastError?.message}`);
  }
}

export default new AIService();
