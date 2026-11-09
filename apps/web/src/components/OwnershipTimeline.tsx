import { ownershipChanges, type OwnershipType, type VehicleReport } from '@app/shared';
import { useI18n } from '../lib/i18n';
import { formatDate } from '../lib/format';
import { OWNERSHIP_LABELS } from '../lib/messages';
import { sectionState } from '../lib/sections';
import { Badge, Section, type BadgeTone } from './ui';

const TONES: Record<OwnershipType, BadgeTone> = {
  private: 'green',
  company: 'blue',
  leasing: 'violet',
  rental: 'amber',
  dealer: 'slate',
  hireLease: 'teal',
  other: 'slate',
};

export function OwnershipTimeline({ report }: { report: VehicleReport | null }) {
  const { t, lang } = useI18n();
  const ownership = report?.ownership ?? null;
  const state = sectionState(report, (ownership?.length ?? 0) > 0, ['ownership']);
  const changes = report ? ownershipChanges(report) : 0;

  return (
    <Section
      id="ownership"
      title={t('ownershipTitle')}
      state={state}
      emptyText={t('ownershipEmpty')}
      aside={
        <span className="text-sm text-slate-600">{t('ownershipChanges', { count: changes })}</span>
      }
    >
      <ol className="relative ms-2 border-s-2 border-slate-200">
        {ownership?.map((entry, i) => (
          <li key={`${entry.since}-${i}`} className="relative mb-4 ps-6 last:mb-0">
            <span
              aria-hidden="true"
              className={`absolute -start-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ${
                i === ownership.length - 1 ? 'bg-blue-600' : 'bg-slate-400'
              }`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <time dateTime={entry.since} className="font-semibold tabular-nums">
                {t('since', { date: formatDate(entry.since) ?? entry.since })}
              </time>
              <Badge tone={TONES[entry.type]}>{OWNERSHIP_LABELS[lang][entry.type]}</Badge>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
