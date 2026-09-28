'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { authStorage } from '@/lib/auth';

export function Topbar() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network/logout errors — we clear local state regardless.
    } finally {
      authStorage.clear();
      router.replace('/login');
    }
  }

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-6">
      <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-border bg-background-secondary px-3 py-2">
        <Search className="h-4 w-4 text-foreground-muted" />
        <input
          type="search"
          placeholder="Buscar contatos, leads, pedidos..."
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
        />
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-card hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </header>
  );
}
