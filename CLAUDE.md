# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# SAT Retake Advisor

Free tool by the Digital SAT Questions group (creator: Bibek Subedi). A student enters SAT scores and target US universities and gets a school-by-school answer to "Should I retake the SAT?"

- Full spec: `docs/PRD.md` (read it before planning any feature)
- Data: `data/schools.json` (61 schools), `data/sat-dates.json` (official SAT dates)
- Data checks still needed: `docs/CHECKLIST.md`

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — runs `check:data`, then `tsc -b`, then `vite build` (bad data fails the build)
- `npm test` — all Vitest suites · `npm run test:watch`
- single test: `npx vitest run src/logic/labels.test.ts -t "<name>"`
- `npm run check:data` — schema check of `data/*.json` (add `-- --quiet` to hide warnings)
- `npm run typecheck`
- Git: local repo on `main`, no remote yet (create the private GitHub remote before pushing).

## Data layout (read before touching data/)

- `src/data/schema.ts` is the single source of truth for the data shape (zod + cross-field rules) and exports the `School` / `SatDate` types. Import those types with `import type` in app code so zod stays out of the bundle.
- `testPolicy` is a list `[{fromEntryYear, domestic, international, source, note?}]`, sorted, first entry 2027. Look up the entry with the highest `fromEntryYear` ≤ the student's entry year. `"not-announced"` = the school's announced policy ends before that year (card: "Policy for fall YYYY entry not yet announced"). A single 2027 entry is open-ended: show it as "policy as published for the fall 2027 cycle".
- Policy history is hand-written in `scripts/policy-history.ts` (evidence quote + source per entry); `docs/policy-conversion.md` is the human review table. To change a policy, edit the JSON directly and keep `source` pointing to one of that school's `sources.policy` URLs. `scripts/convert-schools.ts` was a one-time conversion and refuses to run again.
- Evidence fields (`superscoreQuote`, `scoreSendingQuote`, `notes`, `recentChange`, old `policyCycle`) live under `meta` — for reviewers, never shown in the UI.
- Top-level extras kept: `category`, `pctSubmittingSAT` (show as "X% of enrolled students sent SAT scores"), `entryTerm`, `selfReporting`, `deadlines.eaType`. `deadlines.ED: []` = not offered, `null` = unknown.
- Printed odd values (Columbia R&W 777, UW 1502) are allowlisted in `knownOddValues`; add to it only for values printed that way in an official CDS.
- **Non-standard values** (never fall back to a guess):
  - `superscore: "not stated"` → treat as NOT superscored (use best single sitting) and show "Superscore policy not stated — using your best single test date."
  - `scoreSending: "not stated"` → show no score-sending note.
  - `"n/a"` (test-blind schools) → hide superscore/score-sending lines; card shows "SAT not considered."
- **22 records have `status.scores: "needs-official-check"`** → no retake label; show "Data not yet verified" plus the source link. Their CDS links are in `docs/CHECKLIST.md` §1. Only a human sets `verified: true`.

## Retake logic decisions (beyond the PRD; agreed 2026-11-25)

- Fit at or above the 75th percentile: Safety if admit rate ≥ 30%, else Target; admit rate unpublished → Target (never Safety). Admit rate < 15% → always Reach.
- The "gains usually shrink" note counts all sittings, including the latest (≥ 3).
- No published total (e.g. Harvard): total "Not published", show section ranges/gaps, no retake label, excluded from the verdict with a note.
- Deadline year: MM ≥ 07 → year before entry; MM ≤ 06 → entry year. Two ED deadlines → use ED I and mention ED II. Round not offered → use RD with a note. Null deadline → "Deadline not yet verified" and no "No time to retake".
- Entry year "2029 or later" is looked up as 2029. Logic functions take `today` as a parameter (never read the clock inside logic).
- Order in `evaluateSchool`: test-blind first (for the student's applicant type), then unverified scores, then no total. "No time" replaces only "strongly", "if you have time" and "optional"; "Don't retake" stays. A date whose late registration has closed is listed but doesn't count as time to retake (note: "Only usable if you are already registered").
- Verdict uses the final labels; if no school is below the median but some have no time left, the verdict is "No time to retake". No labeled schools → "No verdict".

## Logic layout

`src/logic/` holds pure functions with a test file beside each: `validate` → `superscore` → `policy` / `ranges` / `labels` / `sectionGaps` / `timeline` → `evaluateSchool` (one school, all adjustments) → `verdict`. `index.ts` exposes `buildReport(input, schools, dates, today)` for the UI. Test fixtures, including the real data parsed through the schema, are in `src/logic/fixtures.ts`.

## Mockup notes

`src/mockups/ScoreReport.tsx` is a style reference only. It imports a `./shared` file that doesn't exist, so it won't compile — do not wire it into the app and do not reuse its logic (real rules: PRD "Retake logic"). Its Courier labels use 10–11px; the real app uses 12px minimum. Replace the sample creator name ("Aarav Mehta") with Bibek Subedi.

## Stack

React + Vite + TypeScript + Tailwind CSS, lucide-react (line icons, allowed; always `aria-hidden` when decorative), Recharts (or hand-drawn SVG) for charts, Firebase Firestore (with App Check), Cloudflare Pages hosting, GitHub Actions for daily stats, Vitest for tests, zod + tsx for the data check (dev only).

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
