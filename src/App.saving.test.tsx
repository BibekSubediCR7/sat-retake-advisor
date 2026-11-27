// App behaviour with saving switched on. The backend is mocked: no network, no Firebase.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const backend = vi.hoisted(() => ({
  saveSubmission: vi.fn(() => Promise.resolve()),
  sendErrorReport: vi.fn(() => Promise.resolve()),
  countHelpClick: vi.fn(() => Promise.resolve()),
  countCheck: vi.fn(() => Promise.resolve()),
  cachedUsage: vi.fn((): { checks: number; students: number } | null => null),
  readUsage: vi.fn(() => Promise.resolve<{ checks: number; students: number } | null>(null)),
}));
vi.mock('./backend', () => ({ ...backend, backendConfigured: true }));
vi.mock('./config/site', async (importOriginal) => {
  const orig = await importOriginal<typeof import('./config/site')>();
  return { ...orig, SAVING_ENABLED: true, site: { ...orig.site, groupUrl: 'https://example.org/group' } };
});

import App from './App';

type User = ReturnType<typeof userEvent.setup>;
const form = () => within(document.querySelector<HTMLElement>('#candidate form')!);

async function fillAndSubmit(user: User) {
  const f = form();
  await user.type(f.getByLabelText('Total'), '1450');
  await user.type(f.getByLabelText('R&W'), '700');
  await user.type(f.getAllByLabelText('Math')[0]!, '750');
  await user.selectOptions(f.getByLabelText('Current grade'), '11');
  await user.selectOptions(f.getByLabelText('Entry year'), '2028');
  await user.selectOptions(f.getByLabelText('Applicant type'), 'international');
  await user.selectOptions(f.getByLabelText('Country'), 'NP');
  await user.selectOptions(f.getByLabelText('Application round'), 'RD');
  await user.type(f.getByRole('combobox', { name: /Schools/ }), 'mit');
  await user.keyboard('{Enter}');
  await user.click(screen.getByRole('button', { name: 'Check my scores' }));
}

describe('App with saving on', () => {
  beforeEach(() => {
    backend.saveSubmission.mockClear();
    backend.sendErrorReport.mockReset().mockResolvedValue(undefined);
    backend.countHelpClick.mockClear();
    backend.countCheck.mockClear();
    backend.cachedUsage.mockReset().mockReturnValue(null);
    backend.readUsage.mockReset().mockResolvedValue(null);
  });

  it('mentions the anonymous count once, in About, not under the button', () => {
    render(<App />);
    expect(screen.getByText(/We keep an anonymous count of checks/)).toBeTruthy();
    expect(screen.queryByText(/saved anonymously/)).toBeNull();
  });

  it('saves once per valid submit, and not for an invalid one', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Check my scores' }));
    expect(backend.saveSubmission).not.toHaveBeenCalled();
    await fillAndSubmit(user);
    expect(backend.saveSubmission).toHaveBeenCalledTimes(1);
    expect(backend.countCheck).toHaveBeenCalledTimes(1);
    expect(backend.saveSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ latest: { total: 1450, rw: 700, math: 750 }, schoolIds: ['mit'] }),
    );
  });

  it('still shows the report when saving fails', async () => {
    backend.saveSubmission.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    render(<App />);
    await fillAndSubmit(user);
    expect(document.getElementById('verdict-headline')?.textContent).toMatch(/Retake/);
  });

  it('counts a click on "Ask a question in the group"', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillAndSubmit(user);
    await user.click(screen.getByRole('link', { name: /Ask a question in the group/ }));
    expect(backend.countHelpClick).toHaveBeenCalledTimes(1);
  });

  it('prints the optional name on the PDF only: never saved or sent, even after resubmitting', async () => {
    const print = vi.fn();
    window.print = print;
    document.title = 'SAT Retake Advisor';
    const user = userEvent.setup();
    render(<App />);
    await fillAndSubmit(user);
    await user.type(screen.getByLabelText('Name to print on the report (optional)'), 'Sita Sharma');
    expect(screen.getByText('Score report for Sita Sharma')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Save as PDF/ }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(document.title).toMatch(/^SAT report - Sita Sharma - \d{4}-\d{2}-\d{2}$/);
    window.dispatchEvent(new Event('afterprint'));
    expect(document.title).toBe('SAT Retake Advisor');
    await user.click(screen.getByRole('button', { name: 'Check my scores' }));
    const calls = JSON.stringify([
      backend.saveSubmission.mock.calls,
      backend.countCheck.mock.calls,
      backend.countHelpClick.mock.calls,
      backend.sendErrorReport.mock.calls,
    ]);
    expect(backend.saveSubmission).toHaveBeenCalledTimes(2);
    expect(calls).not.toMatch(/Sita/);
  });

  it('sends an error report, and says so when it fails', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillAndSubmit(user);
    const open = () => user.click(screen.getByRole('button', { name: /Report an error for Massachusetts/ }));
    const fill = async () => {
      const d = within(document.querySelector('dialog')!);
      await user.selectOptions(d.getByLabelText('Which value is wrong?'), 'Admit rate');
      await user.type(d.getByLabelText('Correct value'), '4.5%');
      await user.type(d.getByLabelText('Official source link'), 'https://ir.mit.edu/cds');
      await user.click(d.getByRole('button', { name: 'Send report' }));
      return d;
    };
    await open();
    let d = await fill();
    expect(backend.sendErrorReport).toHaveBeenCalledWith('mit', {
      field: 'Admit rate',
      correctValue: '4.5%',
      sourceUrl: 'https://ir.mit.edu/cds',
    });
    expect((await d.findByRole('status')).textContent).toMatch(/your report was sent/);
    await user.click(d.getAllByRole('button', { name: 'Close' })[0]!);

    backend.sendErrorReport.mockRejectedValueOnce(new Error('denied'));
    await open();
    d = await fill();
    expect((await d.findByRole('alert')).textContent).toMatch(/send right now/);
  });

  describe('usage counter in the header', () => {
    it('shows the cached count right away from 30 students', () => {
      backend.cachedUsage.mockReturnValue({ checks: 2418, students: 1530 });
      render(<App />);
      expect(screen.getByText('2,418 score checks · 1,530 students')).toBeTruthy();
      expect(backend.readUsage).not.toHaveBeenCalled();
    });

    it('shows at exactly 30 students', () => {
      backend.cachedUsage.mockReturnValue({ checks: 75, students: 30 });
      render(<App />);
      expect(screen.getByText('75 score checks · 30 students')).toBeTruthy();
    });

    it('stays hidden under 30 students', () => {
      backend.cachedUsage.mockReturnValue({ checks: 52, students: 29 });
      render(<App />);
      expect(screen.queryByText(/score checks/)).toBeNull();
    });

    it('reads the live count when the cached one is under 30 students', async () => {
      vi.useFakeTimers();
      backend.cachedUsage.mockReturnValue({ checks: 40, students: 21 });
      backend.readUsage.mockResolvedValue({ checks: 64, students: 33 });
      render(<App />);
      expect(screen.queryByText(/score checks/)).toBeNull();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10000);
      });
      vi.useRealTimers();
      expect(backend.readUsage).toHaveBeenCalledTimes(1);
      expect(screen.getByText('64 score checks · 33 students')).toBeTruthy();
    });

    it('reads the count after the page settles when nothing is cached', async () => {
      vi.useFakeTimers();
      backend.readUsage.mockResolvedValue({ checks: 150, students: 90 });
      render(<App />);
      expect(backend.readUsage).not.toHaveBeenCalled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      vi.useRealTimers();
      expect(backend.readUsage).toHaveBeenCalledTimes(1);
      expect(screen.getByText('150 score checks · 90 students')).toBeTruthy();
    });
  });
});
