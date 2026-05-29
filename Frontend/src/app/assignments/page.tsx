'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { fetchAssignments, deleteAssignment } from '@/store/assignmentSlice';
import Header from '@/components/layout/Header';
import {
  Plus,
  Search,
  Calendar,
  MoreVertical,
  Eye,
  Trash2,
  ClipboardList,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Assignment } from '@/types';
import { format } from 'date-fns';

function StatusBadge({ status }: { status: Assignment['status'] }) {
  const config = {
    pending:    { label: 'Pending',    cls: 'status-pending' },
    processing: { label: 'Generating', cls: 'status-processing' },
    completed:  { label: 'Ready',      cls: 'status-completed' },
    failed:     { label: 'Failed',     cls: 'status-failed' },
  };
  const { label, cls } = config[status];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {status === 'processing' && (
        <Loader2 className="inline w-3 h-3 mr-1 animate-spin" />
      )}
      {label}
    </span>
  );
}

function AssignmentCard({
  assignment,
  onDelete,
}: {
  assignment: Assignment;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    try { return format(new Date(dateStr), 'dd-MM-yyyy'); }
    catch { return dateStr; }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-violet-200 hover:shadow-md transition-all duration-200 group animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={assignment.status} />
          </div>
          <h3 className="font-semibold text-gray-900 truncate text-sm mt-1">
            {assignment.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {assignment.subject} · Grade {assignment.grade}
          </p>
        </div>

        {/* Menu */}
        <div className="relative flex-shrink-0">
          <button
            id={`assignment-menu-${assignment._id}`}
            onClick={() => setMenuOpen((o) => !o)}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-9 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-40 animate-fade-in">
                {assignment.status === 'completed' && (
                  <Link
                    href={`/assignments/view?id=${assignment._id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Eye className="w-4 h-4" />
                    View Paper
                  </Link>
                )}
                <button
                  onClick={() => { onDelete(assignment._id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Assigned: {formatDate(assignment.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-amber-500" />
          <span>Due: {formatDate(assignment.dueDate)}</span>
        </div>
      </div>

      {/* View button for completed */}
      {assignment.status === 'completed' && (
        <Link
          href={`/assignments/view?id=${assignment._id}`}
          id={`view-assignment-${assignment._id}`}
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold rounded-xl transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
          View Question Paper
        </Link>
      )}
      {assignment.status === 'processing' && (
        <div className="mt-3">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '60%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">AI is generating...</p>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 animate-fade-in">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-6">
        <ClipboardList className="w-12 h-12 text-violet-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">No assignments yet</h2>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-8">
        Create your first assignment to start collecting and grading student submissions. You can set
        up rubrics, define marking criteria, and let AI assist with grading.
      </p>
      <Link
        href="/assignments/create"
        id="create-first-assignment-btn"
        className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
      >
        <Plus className="w-4 h-4" />
        Create Your First Assignment
      </Link>
    </div>
  );
}

export default function AssignmentsPage() {
  const dispatch = useAppDispatch();
  const { assignments, loading, error } = useAppSelector((s) => s.assignment);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchAssignments(1));
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      dispatch(deleteAssignment(id));
    }
  };

  const filtered = assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Assignments" subtitle="Manage your AI-powered question papers" />

      <div className="flex-1 p-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="assignments-search"
              type="text"
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-all"
            />
          </div>

          <button
            id="refresh-assignments-btn"
            onClick={() => dispatch(fetchAssignments(1))}
            disabled={loading}
            className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-violet-600 hover:border-violet-200 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/assignments/create"
            id="create-assignment-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Assignment
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && assignments.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="skeleton h-4 w-16 mb-3" />
                <div className="skeleton h-5 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/2" />
                <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between">
                  <div className="skeleton h-3 w-28" />
                  <div className="skeleton h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && <EmptyState />}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((a) => (
              <AssignmentCard key={a._id} assignment={a} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Floating create button */}
      <Link
        href="/assignments/create"
        id="fab-create-btn"
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all"
      >
        <Plus className="w-4 h-4" />
        Create Assignment
      </Link>
    </div>
  );
}
