import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildSources, reportFixture } from '../test/reportFixture';
import { mockFetchJson, renderApp } from '../test/render';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 5, 12));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ReportPage', () => {
  it('shows skeletons while loading, then every section', async () => {
    mockFetchJson(reportFixture);
    renderApp('/vehicle/36181801');

    const summary = screen.getByRole('region', { name: 'פרטי הרכב' });
    expect(summary).toHaveAttribute('aria-busy', 'true');

    expect(await screen.findByText('סקודה · OCTAVIA · 2017')).toBeInTheDocument();
    expect(summary).toHaveAttribute('aria-busy', 'false');
    expect(fetch).toHaveBeenCalledWith('/api/vehicle/36181801', expect.anything());

    for (const name of [
      'רישוי וטסטים',
      'היסטוריית בעלויות',
      'קריאות שירות (ריקול) פתוחות',
      'מפרט טכני',
    ]) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
    expect(screen.getByText('361-81-801')).toBeInTheDocument();
    expect(screen.getByText('אדום')).toBeInTheDocument();
    expect(screen.getByText('114,529 ק״מ')).toBeInTheDocument();
  });

  it('renders the alerts banner for open recalls and many ownership changes', async () => {
    mockFetchJson(reportFixture);
    renderApp('/vehicle/36181801');

    const banner = await screen.findByRole('alert');
    expect(within(banner).getByText('2 קריאות שירות (ריקול) פתוחות')).toBeInTheDocument();
    expect(within(banner).getByText('8 חילופי בעלות')).toBeInTheDocument();
    expect(within(banner).queryByText(/רישיון הרכב פג/)).not.toBeInTheDocument();
  });

  it('shows license days remaining, or overdue and an alert when expired', async () => {
    mockFetchJson({
      ...reportFixture,
      registry: { ...reportFixture.registry, licenseValidUntil: '2026-11-01' },
    });
    renderApp('/vehicle/36181801');

    expect(await screen.findByText('פג לפני 4 ימים')).toBeInTheDocument();
    expect(
      within(screen.getByRole('alert')).getByText('רישיון הרכב פג בתאריך 01/11/2026'),
    ).toBeInTheDocument();
  });

  it('renders the ownership timeline with type badges', async () => {
    mockFetchJson(reportFixture);
    renderApp('/vehicle/36181801');

    const section = await screen.findByRole('region', { name: 'היסטוריית בעלויות' });
    const items = await within(section).findAllByRole('listitem');
    expect(items).toHaveLength(9);
    expect(within(items[0]!).getByText('חברה')).toBeInTheDocument();
    expect(within(items[0]!).getByText('מ־12/2017')).toBeInTheDocument();
    expect(within(section).getAllByText('סוחר')).toHaveLength(2);
  });

  it('keeps other sections working when one dataset failed', async () => {
    mockFetchJson({
      ...reportFixture,
      ownership: null,
      specs: null,
      sources: buildSources({ ownership: 'error', wltpSpecs: 'error' }),
    });
    renderApp('/vehicle/36181801');

    const ownership = await screen.findByRole('region', { name: 'היסטוריית בעלויות' });
    expect(
      await within(ownership).findByText('לא הצלחנו לטעון את המידע הזה כרגע.'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'מפרט טכני' })).getByText(
        'לא הצלחנו לטעון את המידע הזה כרגע.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('סקודה · OCTAVIA · 2017')).toBeInTheDocument();
    expect(screen.getAllByText('שגיאה')).toHaveLength(2);
  });

  it('shows empty states', async () => {
    mockFetchJson({ ...reportFixture, recalls: [], ownership: [] });
    renderApp('/vehicle/36181801');

    expect(await screen.findByText('אין קריאות שירות פתוחות.')).toBeInTheDocument();
    expect(screen.getByText(/אין היסטוריית בעלויות/)).toBeInTheDocument();
    expect(screen.getByText('לא נמצאו אזהרות במאגרים הציבוריים.')).toBeInTheDocument();
  });

  it('lists data sources with statuses and the required attribution', async () => {
    mockFetchJson(reportFixture);
    renderApp('/vehicle/36181801');

    const footer = await screen.findByRole('contentinfo');
    expect(await within(footer).findByText('רכבים גנובים')).toBeInTheDocument();
    expect(within(footer).getByText('לא קיים')).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'מקור: data.gov.il' })).toHaveAttribute(
      'href',
      'https://data.gov.il',
    );
  });

  it('shows the not-found state for unknown plates', async () => {
    mockFetchJson({
      ...reportFixture,
      plate: '99999999',
      found: false,
      summary: null,
      registry: null,
      history: null,
      ownership: [],
      recalls: [],
      specs: null,
      sources: buildSources(
        Object.fromEntries(
          ['registry', 'history', 'ownership', 'recalls', 'wltpSpecs', 'recallNotices'].map(
            (id) => [id, 'empty'],
          ),
        ),
      ),
    });
    renderApp('/vehicle/99999999');

    expect(await screen.findByRole('heading', { name: 'הרכב לא נמצא' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'פרטי הרכב' })).not.toBeInTheDocument();
  });

  it('shows an error with retry when the request fails', async () => {
    const fetchMock = mockFetchJson({ error: 'boom', message: 'boom' }, 500);
    renderApp('/vehicle/36181801');

    const retry = await screen.findByRole('button', { name: 'נסה שוב' });
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(reportFixture)));
    await userEvent.click(retry);
    expect(await screen.findByText('סקודה · OCTAVIA · 2017')).toBeInTheDocument();
  });

  it('rejects an invalid plate in the URL without calling the API', async () => {
    const fetchMock = mockFetchJson(reportFixture);
    renderApp('/vehicle/abc');
    expect(await screen.findByRole('heading', { name: /2 עד 8 ספרות/ })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('switches to English and LTR', async () => {
    mockFetchJson(reportFixture);
    renderApp('/vehicle/36181801');
    await screen.findByText('סקודה · OCTAVIA · 2017');

    await userEvent.click(screen.getByRole('button', { name: 'Switch to English' }));
    expect(screen.getByRole('region', { name: 'Ownership history' })).toBeInTheDocument();
    expect(screen.getAllByText('Dealer')).toHaveLength(2);
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
  });
});
