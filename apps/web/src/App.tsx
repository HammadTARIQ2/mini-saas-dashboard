import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Spinner } from '@/components/ui/Spinner';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { RedirectIfAuthenticated, RequireAuth } from '@/features/auth/components/RequireAuth';
import { queryClient } from '@/lib/query-client';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Route-level code splitting: each page is downloaded only when visited.
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ProjectsPage = lazy(() =>
  import('@/features/projects/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })),
);

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-8 text-indigo-600" />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route element={<RedirectIfAuthenticated />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route index element={<ProjectsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
