import { Construction } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  description?: string;
}

/** Temporary page used for navigation targets that arrive in later deliveries (Entrega 2+). */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-foreground-muted">{description}</p> : null}
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background-secondary">
          <Construction className="h-6 w-6 text-brand" />
        </span>
        <p className="mt-4 text-sm font-medium text-foreground">Em breve</p>
        <p className="mt-1 max-w-sm text-sm text-foreground-muted">
          Este módulo faz parte das próximas entregas do Commercial Hub.
        </p>
      </div>
    </div>
  );
}
