import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '../auth-context';

/** Route guard: renders child routes only for signed-in users. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8 text-indigo-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

/** Inverse guard for /login and /register: signed-in users go to the dashboard. */
export function RedirectIfAuthenticated() {
  const { status } = useAuth();
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}
