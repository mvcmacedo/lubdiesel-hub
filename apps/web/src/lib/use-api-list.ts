'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PaginationMeta } from '@lubdiesel/shared';
import { apiList, buildQuery } from './api';

type Params = Record<string, string | number | boolean | undefined>;

interface ApiListResult<T> {
  items: T[];
  meta: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Loads a paginated list endpoint and re-fetches whenever the params change. */
export function useApiList<T>(path: string, params: Params = {}): ApiListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify(params);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsed = JSON.parse(paramsKey) as Params;
      const result = await apiList<T>(`${path}${buildQuery(parsed)}`);
      setItems(result.data);
      setMeta(result.meta);
    } catch {
      setError('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [path, paramsKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, meta, loading, error, reload };
}
