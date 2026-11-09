import { daysUntil, type VehicleReport } from '@app/shared';
import { useI18n } from '../lib/i18n';
import { formatDate, formatNumber } from '../lib/format';
import { OWNERSHIP_LABELS } from '../lib/messages';
import { REGISTRY_SOURCES, sectionState } from '../lib/sections';
import { Badge, Fields, Section } from './ui';

function LicenseValidity({ date, today }: { date: string; today: Date }) {
  const { t } = useI18n();
  const days = daysUntil(date, today);
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span>{formatDate(date)}</span>
      {days !== null &&
        (days > 0 ? (
          <Badge tone={days <= 30 ? 'amber' : 'green'}>{t('daysRemaining', { days })}</Badge>
        ) : days === 0 ? (
          <Badge tone="amber">{t('expiresToday')}</Badge>
        ) : (
          <Badge tone="red">{t('daysOverdue', { days: Math.abs(days) })}</Badge>
        ))}
    </span>
  );
}

export function RegistrationCard({ report, today }: { report: VehicleReport | null; today: Date }) {
  const { t, lang } = useI18n();
  const registry = report?.registry ?? null;
  const history = report?.history ?? null;
  const flags = report?.flags;
  const state = sectionState(report, registry !== null || history !== null, [
    ...REGISTRY_SOURCES,
    'history',
  ]);

  const yesNo = (value: boolean | null | undefined) =>
    value === null || value === undefined ? null : value ? t('yes') : t('no');
  const flag = (value: boolean | null | undefined, date?: string | null) => {
    if (value === null || value === undefined) return t('unknown');
    if (!value) return t('no');
    return (
      <Badge tone="red">
        {t('yes')}
        {date ? ` · ${formatDate(date)}` : ''}
      </Badge>
    );
  };

  const mileage = formatNumber(history?.mileageAtLastTest ?? null, lang);
  const tires =
    registry?.frontTire || registry?.rearTire
      ? `${registry.frontTire ?? '—'} / ${registry.rearTire ?? '—'}`
      : null;
  const ownership = registry?.currentOwnership
    ? OWNERSHIP_LABELS[lang][registry.currentOwnership]
    : null;

  return (
    <Section
      id="registration"
      title={t('registrationTitle')}
      state={state}
      emptyText={t('registrationEmpty')}
      skeletonRows={4}
    >
      <Fields
        items={[
          { label: t('lastTest'), value: formatDate(registry?.lastTestDate ?? null) },
          {
            label: t('licenseValidUntil'),
            value: registry?.licenseValidUntil ? (
              <LicenseValidity date={registry.licenseValidUntil} today={today} />
            ) : null,
          },
          { label: t('mileage'), value: mileage && `${mileage} ${t('km')}` },
          { label: t('onRoadSince'), value: formatDate(registry?.onRoadSince ?? null) },
          {
            label: t('firstRegistration'),
            value: formatDate(history?.firstRegistrationDate ?? null),
          },
          { label: t('currentOwnership'), value: ownership },
          { label: t('vin'), value: registry?.vin, ltr: true },
          { label: t('engineModel'), value: registry?.engineModel, ltr: true },
          { label: t('tires'), value: tires, ltr: true },
          { label: t('structuralChange'), value: yesNo(history?.structuralChange) },
          { label: t('lpgConversion'), value: yesNo(history?.lpgConversion) },
          { label: t('colorChanged'), value: yesNo(history?.colorChanged) },
          { label: t('tireSizeChanged'), value: yesNo(history?.tireSizeChanged) },
          { label: t('offRoadFlag'), value: flag(flags?.offRoad, flags?.offRoadDate) },
          {
            label: t('disabledPermit'),
            value: flags?.disabledPermit ? (
              <Badge tone="blue">
                {t('yes')}
                {flags.disabledPermitDate ? ` · ${formatDate(flags.disabledPermitDate)}` : ''}
              </Badge>
            ) : (
              (yesNo(flags?.disabledPermit) ?? t('unknown'))
            ),
          },
          {
            label: t('stolenFlag'),
            value: flags?.stolen === null ? t('notAvailablePublic') : flag(flags?.stolen),
          },
        ]}
      />
    </Section>
  );
}
