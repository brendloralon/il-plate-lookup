import type { ReactNode } from 'react';
import { useI18n } from '../lib/i18n';

export type SectionState = 'loading' | 'error' | 'empty' | 'ready';

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-4 rounded bg-slate-200" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

interface SectionProps {
  id: string;
  title: string;
  state: SectionState;
  emptyText: string;
  skeletonRows?: number;
  aside?: ReactNode;
  children?: ReactNode;
}

export function Section({
  id,
  title,
  state,
  emptyText,
  skeletonRows,
  aside,
  children,
}: SectionProps) {
  const { t } = useI18n();
  const headingId = `${id}-heading`;
  return (
    <section
      aria-labelledby={headingId}
      aria-busy={state === 'loading'}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={headingId} className="text-lg font-bold text-slate-900">
          {title}
        </h2>
        {state === 'ready' && aside}
      </div>
      {state === 'loading' && <Skeleton rows={skeletonRows} />}
      {state === 'error' && (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {t('sectionError')}
        </p>
      )}
      {state === 'empty' && <p className="text-sm text-slate-600">{emptyText}</p>}
      {state === 'ready' && children}
    </section>
  );
}

export interface FieldItem {
  label: string;
  value: ReactNode;
  /** Render left-to-right (VINs, tire sizes, numbers with units). */
  ltr?: boolean;
}

/** Definition list that skips empty values. */
export function Fields({ items, columns = 2 }: { items: FieldItem[]; columns?: 2 | 3 }) {
  const visible = items.filter((i) => i.value !== null && i.value !== undefined && i.value !== '');
  return (
    <dl
      className={`grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 ${columns === 3 ? 'lg:grid-cols-3' : ''}`}
    >
      {visible.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs font-medium text-slate-500">{item.label}</dt>
          <dd className="mt-0.5 break-words font-semibold text-slate-900">
            {item.ltr ? (
              <bdi dir="ltr" className="inline-block">
                {item.value}
              </bdi>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export type BadgeTone = 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'teal';

const BADGE_TONES: Record<BadgeTone, string> = {
  slate: 'bg-slate-100 text-slate-800',
  blue: 'bg-blue-100 text-blue-900',
  green: 'bg-green-100 text-green-900',
  amber: 'bg-amber-100 text-amber-900',
  red: 'bg-red-100 text-red-900',
  violet: 'bg-violet-100 text-violet-900',
  teal: 'bg-teal-100 text-teal-900',
};
