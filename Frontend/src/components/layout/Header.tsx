'use client';
import { Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          id="header-notifications-btn"
          className="relative w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full border-2 border-white" />
        </button>

        {/* User Avatar */}
        <button
          id="header-user-btn"
          className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">JD</span>
          </div>
          <span className="text-sm font-medium text-gray-700">John Doe</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
