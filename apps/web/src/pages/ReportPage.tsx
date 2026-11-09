import { useMemo, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { normalizePlate } from '@app/shared';
import { AlertsBanner } from '../components/AlertsBanner';
import { Header } from '../components/Header';
import { OwnershipTimeline } from '../components/OwnershipTimeline';
import { PlateBadge } from '../components/Plate';
import { RecallsList } from '../components/RecallsList';
import { RegistrationCard } from '../components/RegistrationCard';
import { SourcesFooter } from '../components/SourcesFooter';
import { SpecsGrid } from '../components/SpecsGrid';
import { SummaryCard } from '../components/SummaryCard';
import { useVehicle } from '../hooks/useVehicle';
import { ApiRequestError } from '../lib/api';
import { useI18n } from '../lib/i18n';

function Message({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-2xl border border-slate-200 bg-white p-6 text-center"
    >
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="mt-2 text-slate-600">{children}</div>
    </div>
  );
}

export function ReportPage() {
  const { t } = useI18n();
  const params = useParams<{ plate: string }>();
  const plate = normalizePlate(params.plate ?? '');
  const query = useVehicle(plate);
  const today = useMemo(() => new Date(), []);

  let content: ReactNode;
  if (!plate) {
    content = (
      <Message title={t('plateInvalid')}>
        <Link to="/" className="text-blue-700 underline">
          {t('newSearch')}
        </Link>
      </Message>
    );
  } else if (query.isError) {
    const rateLimited = query.error instanceof ApiRequestError && query.error.status === 429;
    content = (
      <Message title={t('errorTitle')}>
        {rateLimited && <p>{t('rateLimited')}</p>}
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-3 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
        >
          {t('retry')}
        </button>
      </Message>
    );
  } else if (query.data && !query.data.found) {
    content = (
      <>
        <Message title={t('notFoundTitle')}>
          <p className="mb-3">
            {t('notFoundBody')} <PlateBadge plate={plate} />
          </p>
          <Link to="/" className="text-blue-700 underline">
            {t('newSearch')}
          </Link>
        </Message>
        <SourcesFooter report={query.data} />
      </>
    );
  } else {
    const report = query.data ?? null;
    content = (
      <>
        <h1 className="sr-only">
          {t('summaryTitle')} {plate}
        </h1>
        {!report && (
          <p className="sr-only" aria-live="polite">
            {t('loading')}
          </p>
        )}
        <AlertsBanner report={report} today={today} />
        <SummaryCard report={report} />
        <RegistrationCard report={report} today={today} />
        <div className="grid gap-4 lg:grid-cols-2">
          <OwnershipTimeline report={report} />
          <RecallsList report={report} />
        </div>
        <SpecsGrid report={report} />
        <SourcesFooter report={report} />
      </>
    );
  }

  return (
    <div className="min-h-dvh">
      <Header showNewSearch />
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-16">{content}</main>
    </div>
  );
}
