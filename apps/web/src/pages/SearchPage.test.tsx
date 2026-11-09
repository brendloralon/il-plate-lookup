import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { reportFixture } from '../test/reportFixture';
import { mockFetchJson, renderApp } from '../test/render';

afterEach(() => vi.restoreAllMocks());

describe('SearchPage', () => {
  it('auto-formats digits as the user types and ignores non-digits', async () => {
    renderApp('/');
    const input = screen.getByLabelText('מספר רישוי');

    await userEvent.type(input, '12a34567');
    expect(input).toHaveValue('12-345-67');

    await userEvent.type(input, '8');
    expect(input).toHaveValue('123-45-678');
  });

  it('shows an accessible error for an invalid plate', async () => {
    renderApp('/');
    await userEvent.type(screen.getByLabelText('מספר רישוי'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'בדיקה' }));

    expect(screen.getByText('יש להזין מספר רישוי בן 2 עד 8 ספרות.')).toHaveAttribute(
      'aria-live',
      'assertive',
    );
    expect(screen.getByLabelText('מספר רישוי')).toHaveAttribute('aria-invalid', 'true');
  });

  it('navigates to the report on submit', async () => {
    mockFetchJson(reportFixture);
    renderApp('/');
    await userEvent.type(screen.getByLabelText('מספר רישוי'), '36181801{Enter}');

    expect(await screen.findByText('סקודה · OCTAVIA · 2017')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/vehicle/36181801', expect.anything());
  });
});
