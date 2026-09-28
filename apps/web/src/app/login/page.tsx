'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { authStorage } from '@/lib/auth';

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiFetch<LoginResult>('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password },
      });
      authStorage.save(result.accessToken, result.refreshToken);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-lg font-bold text-background">
            L
          </span>
          <div className="leading-tight">
            <p className="text-base font-semibold text-foreground">Lubdiesel</p>
            <p className="text-xs text-foreground-muted">Commercial Hub</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm text-foreground-muted">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              placeholder="voce@lubdiesel.com.br"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-foreground-muted">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              placeholder="••••••••"
            />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-background transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
