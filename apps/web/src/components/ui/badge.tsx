import { cn } from '@/lib/utils';
import type { BadgeTone } from '@/lib/labels';

const tones: Record<BadgeTone, string> = {
  neutral: 'border-border bg-background-secondary text-foreground-muted',
  brand: 'border-brand/30 bg-brand/10 text-brand',
  success: 'border-success/40 bg-success/10 text-success',
  danger: 'border-danger/40 bg-danger/10 text-danger',
  warning: 'border-brand/40 bg-brand/10 text-brand',
};

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
