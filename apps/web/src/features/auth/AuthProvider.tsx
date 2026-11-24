import type { AuthResponse, LoginInput, RegisterInput } from '@mini-saas/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onUnauthorized } from '@/lib/api-client';
import { tokenStorage } from '@/lib/token-storage';
import { authApi } from './api';
import { AuthContext, type AuthContextValue } from './auth-context';

const ME_QUERY_KEY = ['auth', 'me'] as const;

/**
 * Owns the session: restores it from the stored token on load, exposes
 * login/register/logout and signs the user out when the API returns 401.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(tokenStorage.get);

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authApi.me,
    enabled: !!token,
    staleTime: Infinity,
    retry: false,
  });

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => onUnauthorized(logout), [logout]);

  const startSession = useCallback(
    ({ token: newToken, user }: AuthResponse) => {
      tokenStorage.set(newToken);
      queryClient.setQueryData(ME_QUERY_KEY, user);
      setToken(newToken);
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(() => {
    const user = token ? (meQuery.data ?? null) : null;
    const status = !token
      ? 'unauthenticated'
      : user
        ? 'authenticated'
        : meQuery.isError
          ? 'unauthenticated'
          : 'loading';

    return {
      user,
      status,
      login: async (input: LoginInput) => startSession(await authApi.login(input)),
      register: async (input: RegisterInput) => startSession(await authApi.register(input)),
      logout,
    };
  }, [token, meQuery.data, meQuery.isError, startSession, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
