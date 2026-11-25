# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# SAT Retake Advisor

Free tool by the Digital SAT Questions group (creator: Bibek Subedi). A student enters SAT scores and target US universities and gets a school-by-school answer to "Should I retake the SAT?"

- Full spec: `docs/PRD.md` (read it before planning any feature)
- Data: `data/schools.json` (61 schools), `data/sat-dates.json` (official SAT dates)
- Data checks still needed: `docs/CHECKLIST.md`

## Repo state & commands

- Not a git repository yet: run `git init` (and create the private GitHub remote) before the first commit.
- No `package.json` yet — Milestone 1 creates the Vite project. When it exists, replace this line with the real commands:
  - `npm run dev` · `npm run build` · `npm test`
  - single test: `npx vitest run <path> -t "<name>"`
  - schema check: `npm run check:data`

## Current data vs PRD format (read before touching data/)

`data/schools.json` is NOT yet in the PRD target format. Milestone 1 converts it:

- **testPolicy**: all 61 records hold one object `{domestic, international, cycle}`. Convert to the per-year list `[{fromEntryYear, domestic, international}]`. Planned changes exist only as free text in `recentChange` (27 records). Build the list from that text, list every conversion in a table for human review, and when the text is unclear keep only the current-cycle entry and add a note — never guess a future rule.
- **Extra fields — keep them** (move under a `meta` object where noted):
  - keep top-level: `category`, `pctSubmittingSAT` (show as "X% of enrolled students sent SAT scores"), `entryTerm`, `selfReporting`, `deadlines.eaType`
  - move to `meta`: `superscoreQuote`, `scoreSendingQuote`, `notes` (evidence for reviewers, not shown in UI)
- **Non-standard values** (never fall back to a guess):
  - `superscore: "not stated"` → treat as NOT superscored (use best single sitting) and show "Superscore policy not stated — using your best single test date."
  - `scoreSending: "not stated"` → show no score-sending note.
  - `"n/a"` (test-blind schools) → hide superscore/score-sending lines; card shows "SAT not considered."
- **22 records have `status.scores: "needs-official-check"`** → no retake label; show "Data not yet verified" plus the source link. Their CDS links are in `docs/CHECKLIST.md` §1. Only a human sets `verified: true`.

## Mockup notes

`src/mockups/ScoreReport.tsx` is a style reference only. It imports a `./shared` file that doesn't exist, so it won't compile — do not wire it into the app and do not reuse its logic (real rules: PRD "Retake logic"). Its Courier labels use 10–11px; the real app uses 12px minimum. Replace the sample creator name ("Aarav Mehta") with Bibek Subedi.

## Stack

React + Vite + TypeScript + Tailwind CSS, lucide-react (line icons, allowed; always `aria-hidden` when decorative), Recharts (or hand-drawn SVG) for charts, Firebase Firestore (with App Check), Cloudflare Pages hosting, GitHub Actions for daily stats, Vitest for tests.

## Build order

1. Data: convert `schools.json` to the PRD target format (per-entry-year `testPolicy`), add a schema check that fails the build if any record lacks a source URL or data year.
2. Logic: retake labels, superscore, timeline, overall verdict, per-year policy — pure TypeScript functions with Vitest tests for every rule and edge case in the PRD "Retake logic" section.
3. Interface: form, report, school cards, range chart, timeline, About section.
4. Backend + launch: Firestore rules, App Check, anonymous submissions, deploy.
5. Group statistics.

Work one milestone at a time. Use plan mode before each milestone. Commit after each working step.

## Non-negotiable rules

- **Data accuracy first.** Never invent, estimate or "fill in" school data. Every value needs an official source URL and data year. Missing values stay `null` and the UI says "Not published" or "Data not yet verified" — never a guess.
- **Derived values are allowed, stored ones are not.** When a school publishes no median, the app computes the midpoint of its published 25th and 75th percentiles at runtime and labels it "estimated" in the UI. Never write derived or estimated values into `data/*.json`.
- **SAT dates rules** (`data/sat-dates.json`):
  - `status: "anticipated"` dates are shown labeled "Anticipated — not yet confirmed by College Board" and never counted as confirmed.
  - A date is "usable" for a deadline if its `scoreRelease` is on or before the deadline. If `scoreRelease` is null, compare the test date itself and show "Score release date not announced — compared using the test date."
  - Dates whose `lateRegistrationDeadline` has passed are shown as "Registration closed" (still relevant only to students already registered).
- Supports entry years 2027, 2028, 2029 and later. Test policy is looked up by entry year. Unannounced SAT dates show "Test dates not announced yet".
- No login. No personal data stored (no names, emails, IPs, free text). One anonymous record per browser.
- All retake logic runs in the browser and is unit-tested.
- TypeScript strict mode. No secrets in the repo; `.env` is gitignored.
- Run `/security-review` before every merge.
- Labels must say they are based on score ranges only, not a chance of admission.
- Footer/About disclaimer: "Not affiliated with or endorsed by College Board or any university. SAT is a trademark of College Board." No College Board or university logos.

## Design direction: "Official score report"

The site should feel like a printed official score report / admission letter — formal, trustworthy, paper-and-ink. Reference mockup: `src/mockups/ScoreReport.tsx` (style reference only; the real app must include every PRD feature).

### Fonts (Google Fonts)
- **Playfair Display** 600–900 → `font-scoreDisplay`: big headings, verdict headline (e.g. "Candidate Score Particulars").
- **Source Serif 4** 400–700 → `font-scoreSerif`: body text, school names.
- **Courier Prime** 400/700 → `font-scoreMono`: stamp labels, section numbers (I., II., III.), field labels, source lines. Uppercase with `tracking-[0.2em]`.

### Colors
| Token | Hex | Use |
| --- | --- | --- |
| paper | `#f3ede1` | page background |
| paper-light | `#fdfcf9` | document panels, form fields |
| ink | `#1a1611` | text, double-rule borders |
| seal-red | `#8c2f24` | "Action advised" stamps, percentile range bar, primary button |
| stamp-green | `#3c5a3c` | positive stamps (e.g. "Don't retake", "Free tool") |
| stamp-amber | `#7a5b1e` | "Retake if you have time" stamp |
| rule | `#c9bfae` | ruled lines, dashed borders |
| rule-light | `#e2dacc` | dividers |

### Signature details
- Double-line borders (`border-double`) around document panels.
- Dashed dividers like perforations.
- Stamps slightly rotated (`rotate-[-1.5deg]`), outlined, uppercase Courier.
- Section numbering in Roman numerals (I. Candidate details, II. Score particulars, III. School-by-school findings, IV. Test calendar).

### Responsive rules (mobile AND desktop)
- Mobile first at 360px: everything in one column; the form fits without horizontal scroll; stamps never overflow their card.
- Tablet ≥768px: school cards in 2 columns.
- Desktop ≥1024px: two-column layout — form ("Candidate details") on the left, report on the right; max content width ~1200px, centered on the paper background.
- Range chart readable at 360px; labels move above/below the bar when space is tight.

### Accessibility (keep the look, stay readable)
- Body text 16px minimum; Courier labels never below 12px.
- Text contrast ≥ 4.5:1 on paper (check red/amber/green text on `#f3ede1`).
- Every stamp has words, never color alone. Rotation is decorative only — keep it off body text, and disable the stamp "press" animation under `prefers-reduced-motion`.
- Tap targets ≥ 44px. Visible focus ring in seal-red. Labeled inputs. Charts have a text alternative.

### Avoid
Purple/blue gradients, glassmorphism, neon, emoji icons, generic hero copy ("Unlock your potential"), Inter, colored left-border accent cards, stock 3D illustrations.
