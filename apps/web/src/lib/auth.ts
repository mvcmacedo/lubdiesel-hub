const ACCESS_TOKEN_KEY = 'lubdiesel.accessToken';
const REFRESH_TOKEN_KEY = 'lubdiesel.refreshToken';

/**
 * Minimal browser-side token storage for the MVP.
 * A future iteration should move to httpOnly cookies + server-side session handling.
 */
export const authStorage = {
  get accessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  get refreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  save(accessToken: string, refreshToken: string): void {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear(): void {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  isAuthenticated(): boolean {
    return Boolean(this.accessToken);
  },
};
