import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import App, { copyrightYears } from './App';
import { site } from './config/site';

type User = ReturnType<typeof userEvent.setup>;

function form() {
  return within(document.querySelector<HTMLElement>('#candidate form')!);
}

async function fillValid(user: User, schools: string[] = ['ucla', 'mit', 'georgia tech']) {
  const f = form();
  await user.type(f.getByLabelText('Total'), '1450');
  await user.type(f.getByLabelText('R&W'), '700');
  await user.type(f.getAllByLabelText('Math')[0]!, '750');
  await user.selectOptions(f.getByLabelText('Current grade'), '11');
  await user.selectOptions(f.getByLabelText('Entry year'), '2028');
  await user.selectOptions(f.getByLabelText('Applicant type'), 'international');
  await user.selectOptions(f.getByLabelText('Country'), 'NP');
  await user.selectOptions(f.getByLabelText('Application round'), 'RD');
  const search = f.getByRole('combobox', { name: /Schools/ });
  for (const q of schools) {
    await user.type(search, q);
    await user.keyboard('{Enter}');
  }
}

async function runAxe(container: Element) {
  const result = await axe.run(container, {
    // jsdom has no layout, so colour contrast is checked by src/design/contrast.test.ts instead.
    rules: { 'color-contrast': { enabled: false } },
  });
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

describe('footer', () => {
  it('shows the copyright line with the creator and the disclaimer', () => {
    render(<App />);
    const footer = within(document.querySelector('footer')!);
    expect(footer.getByText(/^© 2026(–\d{4})? Bibek Subedi · Digital SAT Questions$/)).toBeTruthy();
    expect(footer.getByText(/Not affiliated with or endorsed by College Board/)).toBeTruthy();
  });

  it('extends the year range in later years', () => {
    expect(copyrightYears('2026-11-27')).toBe('2026');
    expect(copyrightYears('2028-01-02')).toBe('2026–2028');
  });
});

describe('App', () => {
  it('shows inline errors and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Check my scores' }));
    await new Promise((r) => requestAnimationFrame(r));
    expect(screen.getByText('Enter your Total score.')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/fix the 9 fields/);
    expect(document.activeElement).toBe(form().getByLabelText('Total'));
    expect(form().getByLabelText('Total').getAttribute('aria-invalid')).toBe('true');
  });

  it('checks that the total equals R&W + Math and clears the error when edited', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillValid(user);
    const total = form().getByLabelText('Total');
    await user.clear(total);
    await user.type(total, '1460');
    await user.click(screen.getByRole('button', { name: 'Check my scores' }));
    expect(screen.getByText('Total must equal Reading and Writing + Math (1450).')).toBeTruthy();
    await user.type(total, '{Backspace}{Backspace}50');
    expect(screen.queryByText('Total must equal Reading and Writing + Math (1450).')).toBeNull();
  });

  it('renders the verdict and cards, most urgent first', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Check my scores' }));
    expect(document.getElementById('verdict-headline')?.textContent).toBe(
      'Retake: below the median at 2 of 2 schools',
    );
    const cards = within(document.getElementById('findings')!).getAllByRole('article');
    expect(cards.map((c) => within(c).getByRole('heading').textContent)).toEqual([
      'Massachusetts Institute of Technology',
      'Georgia Institute of Technology',
      'University of California, Los Angeles',
    ]);
    expect(within(cards[2]!).getByText('SAT not considered')).toBeTruthy();
    // CDS C7 rating: shown for MIT, hidden for test-blind UCLA.
    expect(within(cards[0]!).getByText(/^Important in admission decisions \(Common Data Set 2025-26, section C7\)$/)).toBeTruthy();
    expect(within(cards[2]!).queryByText(/in admission decisions/)).toBeNull();
    expect(screen.getAllByText(/not a chance of admission/).length).toBeGreaterThan(0);
    // Summary of results: balance counts and a table row per school, in card order, linking to each card.
    const summary = within(screen.getByRole('region', { name: 'Summary of results' }));
    expect(document.getElementById('summary-balance')?.textContent).toMatch(/Reach 2.*Target 0.*Safety 0/);
    expect(summary.getByText('Not labeled: 1 (SAT not considered)')).toBeTruthy();
    const rows = within(summary.getByRole('table')).getAllByRole('rowheader');
    expect(rows.map((r) => r.textContent)).toEqual([
      'Massachusetts Institute of Technology',
      'Georgia Institute of Technology',
      'University of California, Los Angeles',
    ]);
    expect(within(rows[0]!).getByRole('link').getAttribute('href')).toBe('#school-mit');
    expect(summary.getByText(/Next SAT you can use/)).toBeTruthy();
    // Fall 2028 entry reaches the 2027-28 dates, whose deadlines and score release are not published yet.
    expect(screen.getAllByText('TBD').length).toBeGreaterThan(0);
    expect(screen.queryByText(/not announced$/)).toBeNull();
  });

  it('adds up to 5 past attempts and removes them', async () => {
    const user = userEvent.setup();
    render(<App />);
    const add = () => user.click(screen.getByRole('button', { name: /Add a past attempt/ }));
    for (let i = 0; i < 5; i++) await add();
    expect(screen.queryByRole('button', { name: /Add a past attempt/ })).toBeNull();
    expect(screen.getAllByLabelText('Test month')).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: 'Remove attempt 2' }));
    expect(screen.getAllByLabelText('Test month')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Add a past attempt/ })).toBeTruthy();
  });

  it('school search works with the keyboard and stops at 15 schools', async () => {
    const user = userEvent.setup();
    render(<App />);
    const search = form().getByRole('combobox', { name: /Schools/ });
    await user.type(search, 'university of');
    await user.keyboard('{ArrowDown}');
    const active = search.getAttribute('aria-activedescendant');
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)?.getAttribute('aria-selected')).toBe('true');
    await user.keyboard('{Escape}');
    expect(search.getAttribute('aria-expanded')).toBe('false');
    await user.clear(search);
    for (let i = 0; i < 15; i++) {
      await user.click(search);
      await user.keyboard('{Enter}');
    }
    expect(within(screen.getByRole('list', { name: 'Chosen schools' })).getAllByRole('listitem')).toHaveLength(15);
    expect(search).toHaveProperty('disabled', true);
    expect(screen.getByText(/15 of 15 chosen/)).toBeTruthy();
    await user.click(screen.getAllByRole('button', { name: /^Remove / })[0]!);
    expect(search).toHaveProperty('disabled', false);
  });

  it('"Edit inputs" keeps the values and focuses the form', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Check my scores' }));
    await user.click(screen.getByRole('button', { name: /Edit inputs/ }));
    expect(document.activeElement?.id).toBe('candidate-heading');
    expect((form().getByLabelText('Total') as HTMLInputElement).value).toBe('1450');
  });

  it('report-an-error dialog validates the source link and stores nothing', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillValid(user, ['mit']);
    await user.click(screen.getByRole('button', { name: 'Check my scores' }));
    await user.click(screen.getByRole('button', { name: /Report an error for Massachusetts/ }));
    const dialog = within(document.querySelector('dialog')!);
    expect(dialog.getByRole('heading', { name: 'Massachusetts Institute of Technology' })).toBeTruthy();
    await user.selectOptions(dialog.getByLabelText('Which value is wrong?'), 'Admit rate');
    await user.type(dialog.getByLabelText('Correct value'), '4.5%');
    await user.type(dialog.getByLabelText('Official source link'), 'http://example.edu/cds');
    await user.click(dialog.getByRole('button', { name: 'Send report' }));
    expect(dialog.getByText('Use an https:// link.')).toBeTruthy();
    await user.clear(dialog.getByLabelText('Official source link'));
    await user.type(dialog.getByLabelText('Official source link'), 'https://example.edu/cds');
    await user.click(dialog.getByRole('button', { name: 'Send report' }));
    expect(dialog.getByRole('status').textContent).toMatch(/Error reports open soon/);
  });

  it('links the set config values and shows "coming soon" for unset ones', () => {
    render(<App />);
    expect(site.supportUrl).toBeNull();
    const about = within(document.getElementById('about')!);
    const hrefs = about.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([site.groupUrl, site.linkedinUrl, site.githubUrl]);
    expect(about.queryByText('(link coming soon)')).toBeNull();
    expect(screen.queryByText(/Support this tool/)).toBeNull(); // hidden until a support link is set
    expect(document.body.textContent).not.toMatch(/patreon/i);
    expect(about.getByText(site.contactEmail!)).toBeTruthy();
    expect(about.queryByText('Need tutoring help?')).toBeNull(); // no tutors yet
  });

  it('has no axe violations on the form or the report', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    expect(await runAxe(container)).toEqual([]);
    await fillValid(user, ['mit', 'harvard', 'ucla', 'princeton']);
    await user.click(screen.getByRole('button', { name: 'Check my scores' }));
    expect(await runAxe(container)).toEqual([]);
  });
});
