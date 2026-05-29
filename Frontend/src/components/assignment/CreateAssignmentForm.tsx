'use client';
import { useRef, useState } from 'react';
import { AssignmentFormData, QuestionType } from '@/types';
import { Upload, X, FileText, Calendar, Minus, Plus, AlertCircle } from 'lucide-react';

interface Props {
    formData: AssignmentFormData;
    onChange: (data: Partial<AssignmentFormData>) => void;
    onSubmit: (data: AssignmentFormData) => void;
    loading: boolean;
    error: string | null;
}

function Field({
    id,
    label,
    required,
    error,
    children,
}: {
    id: string;
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}
                {required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </div>
    );
}

const inputCls = (err?: string) =>
    `w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${err
        ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-400'
        : 'border-gray-200 focus:ring-violet-200 focus:border-violet-400'
    }`;

export default function CreateAssignmentForm({
    formData,
    onChange,
    onSubmit,
    loading,
    error,
}: Props) {
    const [local, setLocal] = useState({
        title: formData.title,
        subject: formData.subject,
        grade: formData.grade,
        schoolName: formData.schoolName,
        dueDate: formData.dueDate,
    });
    const [file, setFile] = useState<File | null>(formData.file);
    const [dragOver, setDragOver] = useState(false);
    const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(
        formData.questionTypes.map((qt) => ({ ...qt }))
    );
    const [instructions, setInstructions] = useState(formData.additionalInstructions);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const set =
        (field: keyof typeof local) =>
            (e: React.ChangeEvent<HTMLInputElement>) =>
                setLocal((prev) => ({ ...prev, [field]: e.target.value }));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!local.title.trim()) e.title = 'Title is required';
        if (!local.subject.trim()) e.subject = 'Subject is required';
        if (!local.grade.trim()) e.grade = 'Grade is required';
        if (!local.dueDate) e.dueDate = 'Due date is required';
        else if (new Date(local.dueDate) <= new Date())
            e.dueDate = 'Due date must be in the future';

        const hasQuestions = questionTypes.some((q) => q.noOfQuestions > 0);
        if (!hasQuestions) e.questions = 'At least one question type must have questions';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmitForm = () => {
        if (!validate()) return;
        const updatedData: AssignmentFormData = {
            ...formData,
            ...local,
            file,
            questionTypes,
            additionalInstructions: instructions,
        };
        onChange(updatedData);
        onSubmit(updatedData);
    };

    const handleFile = (f: File) => {
        if (f.size > 10 * 1024 * 1024) {
            setErrors((prev) => ({ ...prev, file: 'File size must be less than 10MB' }));
            return;
        }
        setFile(f);
        setErrors((prev) => {
            const { file: _, ...rest } = prev;
            return rest;
        });
    };

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

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-700">{error}</p>
                </div>
            )}

            {/* File Upload */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
                <div
                    onDragOver={() => setDragOver(true)}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const f = e.dataTransfer.files[0];
                        if (f) handleFile(f);
                    }}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragOver
                            ? 'border-violet-400 bg-violet-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                >
                    <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-700">
                            {file ? file.name : 'Choose a file or drag & drop it here'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">(JPEG, PNG, upto 10MB)</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-3 px-4 py-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                        >
                            Browse Files
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.md,.jpg,.jpeg,.png"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        className="hidden"
                    />
                    {file && (
                        <button
                            onClick={() => setFile(null)}
                            className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    )}
                </div>
                {errors.file && <p className="text-xs text-rose-500">{errors.file}</p>}
                <p className="text-xs text-gray-500 text-center">Upload images of your preferred document/image</p>
            </div>

            {/* Due Date */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <Field id="dueDate" label="Due Date" required error={errors.dueDate}>
                    <input
                        id="dueDate"
                        type="date"
                        value={local.dueDate}
                        onChange={set('dueDate')}
                        className={inputCls(errors.dueDate)}
                    />
                </Field>
            </div>

            {/* Question Types */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Question Type</h3>

                <div className="space-y-3">
                    {questionTypes.map((qt, i) => (
                        <div
                            key={i}
                            className="grid grid-cols-[1fr_auto_100px_100px] gap-3 items-center p-3 rounded-lg bg-gray-50 border border-gray-100"
                        >
                            <span className="text-sm text-gray-700 font-medium">{qt.type}</span>

                            <button
                                onClick={() => setQuestionTypes(qt => qt.filter((_, idx) => idx !== i))}
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                            </button>

                            <div className="flex items-center justify-center gap-1">
                                <button
                                    onClick={() => updateQT(i, 'noOfQuestions', Math.max(0, qt.noOfQuestions - 1))}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    disabled={qt.noOfQuestions === 0}
                                >
                                    <Minus className="w-3.5 h-3.5 text-gray-600" />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold text-gray-900">{qt.noOfQuestions}</span>
                                <button
                                    onClick={() => updateQT(i, 'noOfQuestions', qt.noOfQuestions + 1)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5 text-gray-600" />
                                </button>
                            </div>

                            <input
                                type="number"
                                value={qt.marks}
                                onChange={(e) => updateQT(i, 'marks', Math.max(1, Number(e.target.value)))}
                                className="text-center text-sm border border-gray-300 rounded px-2 py-1.5 font-semibold"
                                min="1"
                            />
                        </div>
                    ))}
                </div>

                <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Question Type
                </button>

                <div className="flex justify-end gap-6 text-sm pt-3 border-t border-gray-200">
                    <div>
                        <span className="text-gray-600">Total Questions: </span>
                        <span className="font-semibold text-gray-900">{totalQuestions}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Total Marks: </span>
                        <span className="font-semibold text-gray-900">{totalMarks}</span>
                    </div>
                </div>

                {errors.questions && (
                    <p className="text-xs text-rose-500">{errors.questions}</p>
                )}
            </div>

            {/* Additional Instructions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Additional Information (For better output)</h3>
                <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g Generate a question paper for 3 hour exam duration..."
                    rows={3}
                    className={`${inputCls()} resize-none`}
                />
            </div>

            {/* Basic Details */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Assignment Details</h3>
                <p className="text-xs text-gray-500 mb-6">Basic information about your assignment</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field id="title" label="Title" required error={errors.title}>
                        <input
                            id="title"
                            type="text"
                            value={local.title}
                            onChange={set('title')}
                            placeholder="e.g., Physics Chapter 5 Quiz"
                            className={inputCls(errors.title)}
                        />
                    </Field>

                    <Field id="subject" label="Subject" required error={errors.subject}>
                        <input
                            id="subject"
                            type="text"
                            value={local.subject}
                            onChange={set('subject')}
                            placeholder="e.g., Physics"
                            className={inputCls(errors.subject)}
                        />
                    </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Field id="grade" label="Grade" required error={errors.grade}>
                        <input
                            id="grade"
                            type="text"
                            value={local.grade}
                            onChange={set('grade')}
                            placeholder="e.g., Class 10"
                            className={inputCls(errors.grade)}
                        />
                    </Field>

                    <Field id="schoolName" label="School Name" required>
                        <input
                            id="schoolName"
                            type="text"
                            value={local.schoolName}
                            onChange={set('schoolName')}
                            placeholder="Your school name"
                            className={inputCls()}
                        />
                    </Field>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    onClick={handleSubmitForm}
                    disabled={loading}
                    className="px-8 py-3 bg-black hover:bg-gray-900 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating...
                        </>
                    ) : (
                        'Next'
                    )}
                </button>
            </div>
        </div>
    );
}
