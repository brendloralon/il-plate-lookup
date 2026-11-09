import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export function LanguageToggle() {
  const { t, lang, setLang } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
      aria-label={t('languageAria')}
      lang={lang === 'he' ? 'en' : 'he'}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
    >
      {t('language')}
    </button>
  );
}

export function Header({ showNewSearch = false }: { showNewSearch?: boolean }) {
  const { t } = useI18n();
  return (
    <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4">
      {showNewSearch ? (
        <Link to="/" className="font-semibold text-blue-700 underline-offset-4 hover:underline">
          {t('newSearch')}
        </Link>
      ) : (
        <span />
      )}
      <LanguageToggle />
    </header>
  );
}
