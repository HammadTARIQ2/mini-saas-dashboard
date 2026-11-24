const TOKEN_KEY = 'mini-saas.token';

/**
 * Stores the JWT. "Remember me" sessions go to `localStorage` and survive a
 * browser restart; other sessions go to `sessionStorage` and end when the
 * browser (or tab) is closed.
 */
export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY),

  set: (token: string, { remember }: { remember: boolean }) => {
    tokenStorage.clear();
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};
