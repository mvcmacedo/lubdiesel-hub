'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { apiFetch, ApiError, apiList } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import type { User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/stat-card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Field, Input, Select } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';

export default function SettingsPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [me, setMe] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [saving, setSaving] = useState(false);

  const isAdmin = me?.role === 'ADMIN';

  const loadUsers = useCallback(() => {
    apiList<User>('/users?pageSize=100')
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    apiFetch<User>('/users/me')
      .then(setMe)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin, loadUsers]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/users', { method: 'POST', body: form });
      notify('Usuário criado.', 'success');
      setOpen(false);
      setForm({ name: '', email: '', password: '', role: 'USER' });
      loadUsers();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Erro ao salvar.', 'danger');
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    authStorage.clear();
    router.replace('/login');
  }

  const columns: Column<User>[] = [
    { key: 'name', header: 'Nome', render: (u) => <span className="font-medium">{u.name}</span> },
    { key: 'email', header: 'E-mail' },
    { key: 'role', header: 'Papel', render: (u) => <Badge>{u.role}</Badge> },
    {
      key: 'active',
      header: 'Status',
      render: (u) =>
        u.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="danger">Inativo</Badge>,
    },
    { key: 'createdAt', header: 'Criado', render: (u) => formatDate(u.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Perfil, usuários e sessão." />

      <Card className="max-w-md">
        <h2 className="text-sm font-semibold text-foreground">Meu perfil</h2>
        <div className="mt-3 space-y-1 text-sm">
          <p className="text-foreground">{me?.name ?? '—'}</p>
          <p className="text-foreground-muted">{me?.email ?? '—'}</p>
          {me ? <Badge>{me.role}</Badge> : null}
        </div>
        <Button variant="secondary" size="sm" className="mt-4" onClick={logout}>
          Sair
        </Button>
      </Card>

      {isAdmin ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Usuários</h2>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Novo usuário
            </Button>
          </div>
          <DataTable columns={columns} rows={users} />
        </div>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo usuário"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button form="user-form" type="submit" disabled={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={submit} className="space-y-4">
          <Field label="Nome">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Senha" hint="Mínimo de 8 caracteres.">
            <Input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Papel">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
