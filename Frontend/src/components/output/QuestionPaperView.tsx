'use client';
import { QuestionPaper, Question, Section, Difficulty } from '@/types';

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const map: Record<Difficulty, string> = {
    Easy: 'badge-easy',
    Moderate: 'badge-moderate',
    Challenging: 'badge-challenging',
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${map[difficulty]}`}>
      {difficulty}
    </span>
  );
}

function QuestionItem({ question }: { question: Question }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm font-bold text-gray-700 flex-shrink-0 w-6">{question.no}.</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-relaxed">{question.text}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <DifficultyBadge difficulty={question.difficulty} />
          <span className="text-xs text-gray-400">[{question.marks} Mark{question.marks > 1 ? 's' : ''}]</span>
        </div>
      </div>
    </div>
  );
}

function SectionView({ section }: { section: Section }) {
  return (
    <div className="mb-8">
      <div className="mb-3">
        <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">
          {section.title}
        </h3>
        <p className="text-sm text-gray-500 italic mt-0.5">{section.instruction}</p>
      </div>
      <div className="divide-y divide-gray-100">
        {section.questions.map((q) => (
          <QuestionItem key={q.no} question={q} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  paper: QuestionPaper;
}

export default function QuestionPaperView({ paper }: Props) {
  return (
    <div
      id="question-paper-content"
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-slide-up"
    >
      {/* Formal Header */}
      <div className="text-center px-8 py-7 border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white">
        <h1 className="text-xl font-bold text-gray-900">{paper.schoolName}</h1>
        <p className="text-sm font-semibold text-gray-700 mt-1">Subject: {paper.subject}</p>
        <p className="text-sm text-gray-600 mt-0.5">Class: {paper.grade}</p>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-gray-200 text-sm text-gray-600">
        <span>Time Allowed: <strong>{paper.timeAllowed} minutes</strong></span>
        <span>Maximum Marks: <strong>{paper.totalMarks}</strong></span>
      </div>

      {/* General instruction */}
      <div className="px-8 py-3 border-b border-gray-200 bg-amber-50">
        <p className="text-sm text-amber-800 font-medium">{paper.generalInstruction}</p>
      </div>

      {/* Student info */}
      <div className="px-8 py-4 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-6">
          {['Name', 'Roll Number', 'Section'].map((field) => (
            <div key={field}>
              <span className="text-sm text-gray-600">{field}: </span>
              <span className="inline-block border-b border-gray-400 w-28 ml-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="px-8 py-6">
        {paper.sections.map((section, i) => (
          <SectionView key={i} section={section} />
        ))}
        <p className="text-center text-sm font-bold text-gray-700 py-4 border-t border-gray-200">
          — End of Question Paper —
        </p>
      </div>

      {/* Answer Key */}
      <details className="border-t border-gray-200">
        <summary className="px-8 py-4 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50 flex items-center justify-between transition-colors">
          <span>📋 Answer Key</span>
          <span className="text-xs text-gray-400 font-normal">Click to expand</span>
        </summary>
        <div className="px-8 pb-6 space-y-4">
          {paper.sections.map((section, si) => (
            <div key={si}>
              <h4 className="text-sm font-bold text-gray-800 mb-2">{section.title}</h4>
              <ol className="space-y-2">
                {section.questions.filter((q) => q.answer).map((q) => (
                  <li key={q.no} className="text-sm text-gray-700">
                    <span className="font-semibold">{q.no}.</span>{' '}
                    <span className="text-gray-600">{q.answer}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
