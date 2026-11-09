import type { ReactNode } from 'react';
import type { VehicleReport } from '@app/shared';
import { useI18n } from '../lib/i18n';
import { formatNumber } from '../lib/format';
import type { MessageKey } from '../lib/messages';
import { sectionState } from '../lib/sections';
import { Fields, Section, type FieldItem } from './ui';

function Check({ value }: { value: boolean | null }) {
  const { t } = useI18n();
  if (value === null) return null;
  return value ? (
    <span className="text-green-700">
      <span aria-hidden="true">✓ </span>
      {t('yes')}
    </span>
  ) : (
    <span className="text-slate-500">
      <span aria-hidden="true">✗ </span>
      {t('no')}
    </span>
  );
}

function Group({ title, items }: { title: string; items: FieldItem[] }) {
  if (!items.some((i) => i.value !== null && i.value !== undefined)) return null;
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h3>
      <Fields items={items} columns={3} />
    </div>
  );
}

export function SpecsGrid({ report }: { report: VehicleReport | null }) {
  const { t, lang } = useI18n();
  const specs = report?.specs ?? null;
  const state = sectionState(report, specs !== null, ['wltpSpecs']);

  const num = (value: number | null | undefined, unit?: MessageKey): ReactNode => {
    const formatted = formatNumber(value ?? null, lang);
    return formatted && (unit ? `${formatted} ${t(unit)}` : formatted);
  };
  const pair = (a: number | null | undefined, b: number | null | undefined, unit?: MessageKey) =>
    a == null && b == null
      ? null
      : `${num(a) ?? '—'} / ${num(b) ?? '—'}${unit ? ` ${t(unit)}` : ''}`;
  const check = (value: boolean | null | undefined) =>
    value == null ? null : <Check value={value} />;

  return (
    <Section
      id="specs"
      title={t('specsTitle')}
      state={state}
      emptyText={t('specsEmpty')}
      skeletonRows={6}
    >
      {specs && (
        <div className="space-y-6">
          <Group
            title={t('specsGroupEngine')}
            items={[
              { label: t('engineCc'), value: num(specs.engineCc, 'cc'), ltr: true },
              { label: t('horsepower'), value: num(specs.horsepower, 'hp'), ltr: true },
              {
                label: t('transmission'),
                value:
                  specs.automatic === null ? null : specs.automatic ? t('automatic') : t('manual'),
              },
              { label: t('drive'), value: specs.driveRaw, ltr: true },
              { label: t('propulsion'), value: specs.propulsionRaw },
              { label: t('fuel'), value: specs.fuelRaw },
            ]}
          />
          <Group
            title={t('specsGroupBody')}
            items={[
              { label: t('bodyType'), value: specs.bodyTypeRaw },
              { label: t('grossWeight'), value: num(specs.grossWeightKg, 'kg'), ltr: true },
              { label: t('doorsSeats'), value: pair(specs.doors, specs.seats), ltr: true },
              {
                label: t('towing'),
                value: pair(specs.towingBrakedKg, specs.towingUnbrakedKg, 'kg'),
                ltr: true,
              },
            ]}
          />
          <Group
            title={t('specsGroupSafety')}
            items={[
              { label: t('airbags'), value: num(specs.airbags) },
              { label: t('safetyLevel'), value: num(specs.safetyEquipmentLevel) },
              { label: t('safetyScore'), value: num(specs.safetyScore) },
              { label: t('abs'), value: check(specs.abs) },
              { label: t('stabilityControl'), value: check(specs.stabilityControl) },
              { label: t('laneDepartureControl'), value: check(specs.laneDepartureControl) },
              {
                label: t('forwardDistanceMonitoring'),
                value: check(specs.forwardDistanceMonitoring),
              },
              { label: t('pedestrianDetection'), value: check(specs.pedestrianDetection) },
              { label: t('adaptiveCruise'), value: check(specs.adaptiveCruise) },
              { label: t('blindSpotDetection'), value: check(specs.blindSpotDetection) },
              { label: t('reverseCamera'), value: check(specs.reverseCamera) },
            ]}
          />
          <Group
            title={t('specsGroupEnvironment')}
            items={[
              { label: t('pollutionGroup'), value: num(specs.pollutionGroup) },
              { label: t('greenIndex'), value: num(specs.greenIndex) },
              { label: t('co2'), value: num(specs.co2Wltp, 'gkm'), ltr: true },
              { label: t('homologation'), value: specs.homologationRaw },
            ]}
          />
        </div>
      )}
    </Section>
  );
}
