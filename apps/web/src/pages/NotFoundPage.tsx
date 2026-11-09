import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useI18n } from '../lib/i18n';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-xl px-4 pt-16 text-center">
        <h1 className="text-2xl font-bold">{t('pageNotFound')}</h1>
        <Link to="/" className="mt-4 inline-block text-blue-700 underline">
          {t('backHome')}
        </Link>
      </main>
    </div>
  );
}
