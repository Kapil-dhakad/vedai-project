'use client';
import { useState } from 'react';
import { AssignmentFormData, QuestionType } from '@/types';
import { Minus, Plus, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  formData: AssignmentFormData;
  onChange: (data: Partial<AssignmentFormData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

export default function StepQuestions({
  formData,
  onChange,
  onBack,
  onSubmit,
  loading,
  error,
}: Props) {
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(
    formData.questionTypes.map((qt) => ({ ...qt }))
  );
  const [instructions, setInstructions] = useState(formData.additionalInstructions);

  const updateQT = (index: number, field: keyof QuestionType, value: number | string) => {
    setQuestionTypes((prev) =>
      prev.map((qt, i) =>
        i === index
          ? { ...qt, [field]: field === 'type' ? value : Math.max(0, Number(value)) }
          : qt
      )
    );
  };

  const totalQuestions = questionTypes.reduce((s, q) => s + q.noOfQuestions, 0);
  const totalMarks = questionTypes.reduce((s, q) => s + q.noOfQuestions * q.marks, 0);
  const hasQuestions = questionTypes.some((q) => q.noOfQuestions > 0);

  const handleSubmit = () => {
    onChange({ questionTypes, additionalInstructions: instructions });
    onSubmit();
  };

  const handleBack = () => {
    onChange({ questionTypes, additionalInstructions: instructions });
    onBack();
  };

  return (
    <div className="space-y-5">
      {/* Table Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Question Types</p>
          <p className="text-xs text-gray-400">Set no. of questions &amp; marks each</p>
        </div>

        <div className="grid grid-cols-[1fr_120px_100px] gap-3 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Question Type</span>
          <span className="text-center">No. of Questions</span>
          <span className="text-center">Marks Each</span>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {questionTypes.map((qt, i) => (
            <div
              key={i}
              className={`grid grid-cols-[1fr_120px_100px] gap-3 items-center px-3 py-3 rounded-xl border transition-all ${qt.noOfQuestions > 0
                  ? 'border-violet-200 bg-violet-50'
                  : 'border-gray-100 bg-gray-50'
                }`}
            >
              <span className="text-sm font-medium text-gray-700 truncate">{qt.type}</span>

              {/* No. of Questions */}
              <div className="flex items-center justify-center gap-1.5">
                <button
                  id={`qt-${i}-dec-questions`}
                  type="button"
                  onClick={() => updateQT(i, 'noOfQuestions', qt.noOfQuestions - 1)}
                  className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-violet-600 hover:border-violet-300 transition-all"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  id={`qt-${i}-questions`}
                  type="number"
                  min={0}
                  max={50}
                  value={qt.noOfQuestions}
                  onChange={(e) => updateQT(i, 'noOfQuestions', e.target.value)}
                  className="w-10 text-center text-sm font-semibold bg-white border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
                <button
                  id={`qt-${i}-inc-questions`}
                  type="button"
                  onClick={() => updateQT(i, 'noOfQuestions', qt.noOfQuestions + 1)}
                  className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-violet-600 hover:border-violet-300 transition-all"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Marks */}
              <div className="flex items-center justify-center gap-1.5">
                <button
                  id={`qt-${i}-dec-marks`}
                  type="button"
                  onClick={() => updateQT(i, 'marks', qt.marks - 1)}
                  className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-violet-600 hover:border-violet-300 transition-all"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  id={`qt-${i}-marks`}
                  type="number"
                  min={1}
                  max={20}
                  value={qt.marks}
                  onChange={(e) => updateQT(i, 'marks', e.target.value)}
                  className="w-10 text-center text-sm font-semibold bg-white border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
                <button
                  id={`qt-${i}-inc-marks`}
                  type="button"
                  onClick={() => updateQT(i, 'marks', qt.marks + 1)}
                  className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-violet-600 hover:border-violet-300 transition-all"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white rounded-xl">
            <span className="text-xs font-medium opacity-70">Total Questions</span>
            <span className="text-lg font-bold">{totalQuestions}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-violet-600 text-white rounded-xl">
            <span className="text-xs font-medium opacity-80">Total Marks</span>
            <span className="text-lg font-bold">{totalMarks}</span>
          </div>
        </div>
      </div>

      {/* Additional Instructions */}
      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1.5">
          Additional Instructions{' '}
          <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <textarea
          id="instructions"
          rows={3}
          placeholder="e.g., Focus on Chapter 3 and 4. Include real-world application questions."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-all resize-none"
        />
      </div>

      {/* Warnings */}
      {!hasQuestions && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          At least one question type must have questions.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          id="step2-back-btn"
          type="button"
          onClick={handleBack}
          className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
        >
          ← Previous
        </button>

        <button
          id="step2-submit-btn"
          type="button"
          onClick={handleSubmit}
          disabled={loading || !hasQuestions}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            '🤖 Generate with AI'
          )}
        </button>
      </div>
    </div>
  );
}
