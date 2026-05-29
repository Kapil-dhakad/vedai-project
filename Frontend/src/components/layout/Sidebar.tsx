'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home,
  Users,
  FileText,
  Wrench,
  Library,
  Settings,
  Plus,
  GraduationCap,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/groups', label: 'My Groups', icon: Users },
  { href: '/assignments', label: 'Assignments', icon: FileText },
  { href: '/toolkit', label: "AI Teacher's Toolkit", icon: Wrench },
  { href: '/library', label: 'My Library', icon: Library },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 flex flex-col z-40 shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 cursor-pointer group">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center group-hover:shadow-md transition-all duration-200 shadow-sm">
            <Image
              src="/vedai-logo.png"
              alt="VedaAI Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="text-lg font-bold text-gray-900 group-hover:text-black transition-colors duration-200">VedaAI</span>
        </div>
      </div>

      {/* Create Button */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/assignments/create"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/'
            ? pathname === '/'
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${isActive
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
              />
              <span className="truncate">{label}</span>
              {label === 'Assignments' && (
                <span className="ml-auto bg-violet-100 text-violet-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <Settings className="w-4 h-4 text-gray-400" />
          Settings
        </Link>

        {/* School Profile */}
        <div className="flex items-center gap-3 px-3 py-3 mt-1 bg-gray-50 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-gray-800 truncate">Delhi Public School</p>
            <p className="text-xs text-gray-500 truncate">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
