import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPlate, normalizePlate } from '@app/shared';
import { Header } from '../components/Header';
import { PlateInputField } from '../components/Plate';
import { useI18n } from '../lib/i18n';

export function SearchPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const plate = normalizePlate(value);
    if (!plate) {
      setError(t('plateInvalid'));
      return;
    }
    navigate(`/vehicle/${plate}`);
  }

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 pt-8 pb-16 text-center sm:pt-16">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{t('appTitle')}</h1>
        <p className="mt-2 text-slate-600">{t('appSubtitle')}</p>

        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-10 flex w-full flex-col items-center gap-4"
        >
          <label htmlFor={inputId} className="text-sm font-semibold text-slate-700">
            {t('plateLabel')}
          </label>
          <PlateInputField
            id={inputId}
            value={value}
            onChange={(e) => {
              setValue(formatPlate(e.target.value));
              setError(null);
            }}
            aria-invalid={error !== null}
            aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          />
          <p id={hintId} className="text-sm text-slate-500">
            {t('plateHint')}
          </p>
          <p
            id={errorId}
            aria-live="assertive"
            className="min-h-5 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
          <button
            type="submit"
            className="w-full max-w-md rounded-xl bg-blue-700 px-6 py-3 text-lg font-bold text-white shadow hover:bg-blue-800 disabled:opacity-50"
          >
            {t('search')}
          </button>
        </form>
      </main>
    </div>
  );
}
