'use client';
import { useRef, useState } from 'react';
import { AssignmentFormData } from '@/types';
import { Upload, X, FileText, Calendar } from 'lucide-react';

interface Props {
  formData: AssignmentFormData;
  onChange: (data: Partial<AssignmentFormData>) => void;
  onNext: () => void;
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

export default function StepUpload({ formData, onChange, onNext }: Props) {
  const [local, setLocal] = useState({
    title: formData.title,
    subject: formData.subject,
    grade: formData.grade,
    schoolName: formData.schoolName,
    dueDate: formData.dueDate,
  });
  const [file, setFile] = useState<File | null>(formData.file);
  const [dragOver, setDragOver] = useState(false);
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    onChange({ ...local, file });
    onNext();
  };

  const handleFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    const allowed = ['application/pdf', 'text/plain', 'text/markdown'];
    if (!allowed.includes(f.type) && !['pdf', 'txt', 'md'].includes(ext || '')) {
      setErrors((prev) => ({ ...prev, file: 'Only PDF and text files are allowed' }));
      return;
    }
    setFile(f);
    setErrors((prev) => ({ ...prev, file: '' }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <Field id="title" label="Assignment Title" required error={errors.title}>
        <input
          id="title"
          type="text"
          autoComplete="off"
          placeholder="e.g., Quiz on Electricity"
          value={local.title}
          onChange={set('title')}
          className={inputCls(errors.title)}
        />
      </Field>

      {/* Subject + Grade */}
      <div className="grid grid-cols-2 gap-4">
        <Field id="subject" label="Subject" required error={errors.subject}>
          <input
            id="subject"
            type="text"
            autoComplete="off"
            placeholder="e.g., Science"
            value={local.subject}
            onChange={set('subject')}
            className={inputCls(errors.subject)}
          />
        </Field>
        <Field id="grade" label="Grade / Class" required error={errors.grade}>
          <input
            id="grade"
            type="text"
            autoComplete="off"
            placeholder="e.g., 8th"
            value={local.grade}
            onChange={set('grade')}
            className={inputCls(errors.grade)}
          />
        </Field>
      </div>

      {/* School Name */}
      <Field id="schoolName" label="School Name">
        <input
          id="schoolName"
          type="text"
          autoComplete="off"
          value={local.schoolName}
          onChange={set('schoolName')}
          className={inputCls()}
        />
      </Field>

      {/* Due Date */}
      <Field id="dueDate" label="Due Date" required error={errors.dueDate}>
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            id="dueDate"
            type="date"
            value={local.dueDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={set('dueDate')}
            className={`${inputCls(errors.dueDate)} pl-10`}
          />
        </div>
      </Field>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Upload Material{' '}
          <span className="text-gray-400 font-normal">(Optional — PDF or text)</span>
        </label>

        {file ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-200 rounded-xl">
            <FileText className="w-5 h-5 text-violet-500 flex-shrink-0" />
            <span className="flex-1 text-sm text-violet-700 truncate">{file.name}</span>
            <button
              id="remove-file-btn"
              type="button"
              onClick={() => setFile(null)}
              className="w-6 h-6 rounded-full bg-violet-200 hover:bg-violet-300 flex items-center justify-center text-violet-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            id="file-dropzone"
            role="button"
            tabIndex={0}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver
                ? 'border-violet-400 bg-violet-50'
                : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
              }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <Upload className={`w-8 h-8 mx-auto mb-3 ${dragOver ? 'text-violet-400' : 'text-gray-300'}`} />
            <p className="text-sm font-medium text-gray-600">
              Choose a file or drag &amp; drop here
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, TXT up to 10MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {errors.file && <p className="mt-1 text-xs text-rose-500">{errors.file}</p>}
      </div>

      {/* Next */}
      <div className="flex justify-end pt-2">
        <button
          id="step1-next-btn"
          type="button"
          onClick={handleNext}
          className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
