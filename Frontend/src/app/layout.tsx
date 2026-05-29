import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ReduxProvider from '@/components/providers/ReduxProvider';
import Sidebar from '@/components/layout/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VedaAI — AI Assessment Creator',
  description:
    'Create AI-powered question papers and assessments for your students instantly.',
  keywords: ['AI', 'assessment', 'question paper', 'teacher', 'education'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <ReduxProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-60 min-h-screen">{children}</main>
          </div>
        </ReduxProvider>
      </body>
    </html>
  );
}
