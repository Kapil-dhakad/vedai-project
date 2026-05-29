'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  setFormData,
  resetForm,
  createAssignment,
} from '@/store/assignmentSlice';
import { useWebSocket } from '@/hooks/useWebSocket';
import Header from '@/components/layout/Header';
import CreateAssignmentForm from '@/components/assignment/CreateAssignmentForm';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateAssignmentPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { formData, loading, error } = useAppSelector((s) => s.assignment);
  const { subscribe } = useWebSocket();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const result = await dispatch(createAssignment(formData));
    if (createAssignment.fulfilled.match(result)) {
      const assignmentId = result.payload._id;
      subscribe(assignmentId);
      setSubmitted(true);
      setTimeout(() => {
        dispatch(resetForm());
        router.push(`/assignments/view?id=${assignmentId}`);
      }, 1500);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Create Assignment" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Assignment Created!</h2>
            <p className="text-sm text-gray-500">AI is generating your question paper...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Create Assignment" />

      <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <Link
          href="/assignments"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assignments
        </Link>

        <CreateAssignmentForm
          formData={formData}
          onChange={(data) => dispatch(setFormData(data))}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
