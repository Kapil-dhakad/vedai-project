'use client';
import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  fetchAssignment,
  fetchPaper,
  regenerateAssignment,
} from '@/store/assignmentSlice';
import { useWebSocket } from '@/hooks/useWebSocket';
import Header from '@/components/layout/Header';
import QuestionPaperView from '@/components/output/QuestionPaperView';
import GeneratingState from '@/components/output/GeneratingState';
import { ArrowLeft, RotateCcw, Download, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { downloadPDF } from '@/lib/pdfExport';

function AssignmentOutputContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') as string;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const paperRef = useRef<HTMLDivElement>(null);

  const {
    currentAssignment,
    currentPaper,
    generationStatus,
    generationProgress,
    generationMessage,
    loading,
    papersLoading,
  } = useAppSelector((s) => s.assignment);

  const { subscribe } = useWebSocket(id);

  useEffect(() => {
    dispatch(fetchAssignment(id));
    dispatch(fetchPaper(id));
    subscribe(id);
  }, [id, dispatch, subscribe]);

  useEffect(() => {
    if (!currentAssignment) return;
    if (currentAssignment.status === 'pending' || currentAssignment.status === 'processing') {
      const interval = setInterval(() => {
        dispatch(fetchAssignment(id));
        dispatch(fetchPaper(id));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentAssignment?.status, id, dispatch]);

  const handleRegenerate = async () => {
    if (!confirm('Regenerate this question paper? The current paper will be replaced.')) return;
    await dispatch(regenerateAssignment(id));
    subscribe(id);
  };

  const handleDownloadPDF = () => {
    if (paperRef.current && currentPaper && currentAssignment) {
      downloadPDF(paperRef.current, `${currentAssignment.title}-question-paper`);
    }
  };

  if (loading && !currentAssignment) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Question Paper" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </div>
    );
  }

  const effectiveStatus = generationStatus !== 'idle'
    ? generationStatus
    : currentAssignment?.status || 'pending';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Question Paper Output" />

      <div className="flex-1 max-w-4xl mx-auto w-full p-6">
        {/* Back */}
        <Link
          href="/assignments"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assignments
        </Link>

        {/* AI Banner */}
        {currentPaper && (
          <div className="mb-5 px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium opacity-90 mb-0.5">🤖 AI Generated</p>
                <p className="text-sm font-semibold">
                  Certainly! Here are customized Question Papers for your{' '}
                  {currentAssignment?.subject} class on Grade {currentAssignment?.grade}.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  id="download-pdf-btn"
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl transition-all backdrop-blur-sm border border-white/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download as PDF
                </button>

                <button
                  id="regenerate-btn"
                  onClick={handleRegenerate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl transition-all backdrop-blur-sm border border-white/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* States */}
        {(effectiveStatus === 'pending' || effectiveStatus === 'processing') && (
          <GeneratingState
            status={effectiveStatus}
            progress={generationProgress}
            message={generationMessage}
          />
        )}

        {effectiveStatus === 'failed' && (
          <div className="flex flex-col items-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Generation Failed</h2>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
              {currentAssignment?.errorMessage || 'Something went wrong. Please try again.'}
            </p>
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {effectiveStatus === 'completed' && papersLoading && !currentPaper && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        )}

         {/* The question paper itself */}
        {currentPaper && (
          <div ref={paperRef}>
            <QuestionPaperView paper={currentPaper} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssignmentOutputPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    }>
      <AssignmentOutputContent />
    </Suspense>
  );
}
