import type { VehicleReport } from '@app/shared';
import { useI18n } from '../lib/i18n';
import { FUEL_LABELS, SOURCE_LABELS_EN } from '../lib/messages';
import { REGISTRY_SOURCES, sectionState } from '../lib/sections';
import { PlateBadge } from './Plate';
import { Fields, Section } from './ui';

export function SummaryCard({ report }: { report: VehicleReport | null }) {
  const { t, lang } = useI18n();
  const summary = report?.summary ?? null;
  const state = sectionState(report, summary !== null, REGISTRY_SOURCES);

  const registryKind = report?.registry?.kind;
  const registrySourceName =
    registryKind &&
    (lang === 'en'
      ? SOURCE_LABELS_EN[registryKind]
      : report?.sources.find((s) => s.id === registryKind)?.name);

  const title = summary
    ? [summary.make, summary.commercialName ?? summary.model, summary.year]
        .filter(Boolean)
        .join(' · ')
    : null;

  return (
    <Section
      id="summary"
      title={t('summaryTitle')}
      state={state}
      emptyText={t('summaryEmpty')}
      skeletonRows={5}
      aside={report && <PlateBadge plate={report.plate} />}
    >
      {summary && (
        <>
          {title && <p className="mb-4 text-2xl font-extrabold text-slate-900">{title}</p>}
          <Fields
            columns={3}
            items={[
              { label: t('make'), value: summary.manufacturerRaw ?? summary.make },
              { label: t('model'), value: summary.model, ltr: true },
              { label: t('commercialName'), value: summary.commercialName, ltr: true },
              { label: t('trim'), value: summary.trim, ltr: true },
              { label: t('year'), value: summary.year },
              { label: t('color'), value: summary.colorRaw },
              {
                label: t('fuel'),
                value: lang === 'en' && summary.fuel ? FUEL_LABELS[summary.fuel] : summary.fuelRaw,
              },
              { label: t('origin'), value: summary.originRaw ?? t('originRegular') },
              { label: t('country'), value: summary.countryOfManufacture },
              { label: t('vehicleType'), value: summary.vehicleTypeRaw },
              {
                label: t('registrySource'),
                value: registryKind !== 'registry' ? registrySourceName : null,
              },
            ]}
          />
        </>
      )}
    </Section>
  );
}
