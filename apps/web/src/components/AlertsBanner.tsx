import { computeAlerts, type VehicleReport } from '@app/shared';
import { useI18n } from '../lib/i18n';
import { formatDate } from '../lib/format';
import { alertKey } from '../lib/messages';

export function AlertsBanner({ report, today }: { report: VehicleReport | null; today: Date }) {
  const { t } = useI18n();
  if (!report) {
    return <div className="h-14 animate-pulse rounded-2xl bg-slate-200" aria-hidden="true" />;
  }

  const alerts = computeAlerts(report, today);
  if (alerts.length === 0) {
    return (
      <p className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-900">
        {t('noAlerts')}
      </p>
    );
  }

  return (
    <section
      role="alert"
      aria-labelledby="alerts-heading"
      className="rounded-2xl border-2 border-red-600 bg-red-50 p-4 text-red-900"
    >
      <h2 id="alerts-heading" className="mb-2 flex items-center gap-2 text-lg font-bold">
        <span aria-hidden="true">⚠</span>
        {t('alertsTitle')}
      </h2>
      <ul className="list-disc space-y-1 ps-6 font-semibold">
        {alerts.map((alert) => {
          const detail = typeof alert.detail === 'string' ? formatDate(alert.detail) : alert.detail;
          return <li key={alert.kind}>{t(alertKey(alert.kind), { detail: detail ?? '' })}</li>;
        })}
      </ul>
    </section>
  );
}
