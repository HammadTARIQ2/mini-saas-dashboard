import type { ReactNode } from 'react';
import { Logo } from '@/components/layout/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-indigo-50 to-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-sm">
        <Logo className="justify-center" />
        <h1 className="mt-8 text-center text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">{subtitle}</p>
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
