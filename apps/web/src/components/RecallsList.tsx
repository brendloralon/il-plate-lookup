import type { VehicleReport } from '@app/shared';
import { useI18n } from '../lib/i18n';
import { formatDate } from '../lib/format';
import { sectionState } from '../lib/sections';
import { Badge, Section } from './ui';

function websiteHref(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website.toLowerCase()}`;
}

export function RecallsList({ report }: { report: VehicleReport | null }) {
  const { t } = useI18n();
  const recalls = report?.recalls ?? null;
  const state = sectionState(report, (recalls?.length ?? 0) > 0, ['recalls']);

  return (
    <Section id="recalls" title={t('recallsTitle')} state={state} emptyText={t('recallsEmpty')}>
      <ul className="space-y-3">
        {recalls?.map((recall) => (
          <li key={recall.id} className="rounded-xl border border-red-200 bg-red-50/50 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {recall.safety && <Badge tone="red">{t('recallSafety')}</Badge>}
              {recall.categoryRaw && <Badge>{recall.categoryRaw}</Badge>}
              <span className="text-xs text-slate-500">{t('recallId', { id: recall.id })}</span>
              {recall.openedDate && (
                <span className="text-xs text-slate-500">
                  {t('recallOpened', { date: formatDate(recall.openedDate) ?? '' })}
                </span>
              )}
            </div>
            {recall.descriptionRaw && <p className="text-sm leading-6">{recall.descriptionRaw}</p>}
            {(recall.fixMethodRaw || recall.importer) && (
              <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                {recall.fixMethodRaw && (
                  <div>
                    <dt className="inline text-slate-500">{t('recallFix')}: </dt>
                    <dd className="inline font-medium">{recall.fixMethodRaw}</dd>
                  </div>
                )}
                {recall.importer && (
                  <div>
                    <dt className="inline text-slate-500">{t('recallImporter')}: </dt>
                    <dd className="inline font-medium">
                      {recall.importer}
                      {recall.phone && (
                        <>
                          {' · '}
                          <a
                            className="text-blue-700 underline"
                            href={`tel:${recall.phone}`}
                            dir="ltr"
                          >
                            {recall.phone}
                          </a>
                        </>
                      )}
                      {recall.website && (
                        <>
                          {' · '}
                          <a
                            className="break-all text-blue-700 underline"
                            href={websiteHref(recall.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            dir="ltr"
                          >
                            {recall.website.toLowerCase()}
                          </a>
                        </>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
