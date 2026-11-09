import type { SourceStatus, VehicleReport } from '@app/shared';
import { useI18n } from '../lib/i18n';
import { formatDateTime } from '../lib/format';
import { SOURCE_LABELS_EN, statusKey } from '../lib/messages';
import { Badge, Skeleton, type BadgeTone } from './ui';

const STATUS_TONES: Record<SourceStatus, BadgeTone> = {
  ok: 'green',
  empty: 'slate',
  error: 'red',
  unavailable: 'amber',
};

export function SourcesFooter({ report }: { report: VehicleReport | null }) {
  const { t, lang } = useI18n();
  return (
    <footer
      aria-labelledby="sources-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4 text-sm sm:p-6"
    >
      <h2 id="sources-heading" className="mb-3 text-base font-bold">
        {t('sourcesTitle')}
      </h2>
      {report ? (
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {report.sources.map((source) => (
            <li key={source.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate" title={source.resourceId ?? undefined}>
                {lang === 'en' ? SOURCE_LABELS_EN[source.id] : source.name}
              </span>
              <Badge tone={STATUS_TONES[source.status]}>{t(statusKey(source.status))}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <Skeleton rows={4} />
      )}
      <p className="mt-4 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 text-slate-600">
        <a
          href="https://data.gov.il"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-700 underline"
        >
          {t('attribution')}
        </a>
        {report && <span>{t('fetchedAt', { date: formatDateTime(report.fetchedAt, lang) })}</span>}
      </p>
    </footer>
  );
}
