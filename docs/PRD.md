# SAT Retake Advisor — PRD

Nov 25, 2026 · Bibek Subedi
Live, editable version: https://claude.ai/artifact/NePJPecocK2FHHq2yiqUoc

## Overview

A free, single-page web tool that tells a student, school by school, whether to retake the SAT, using official score data, their own deadlines and statistics from the Digital SAT Questions community (160k+ members).

**Problem.** "Should I retake?" is one of the most-asked questions in the group. Existing answers are generic articles, chatbots that give unsourced and often outdated ranges, or tools that ask for contact details. No tool combines school data, section gaps, superscoring, test policy and deadlines in one personal report.

**Goal.** Give a trustworthy, personal answer in under a minute, and bring students back to the group.

**Users.**

- **Primary:** high-school students targeting top US universities, both domestic (US citizens and permanent residents) and international (many from South Asia), for entry in 2027, 2028 and later.
- **Secondary:** parents, and group tutors who use reports when advising students.

**Success metrics (proposed targets, first 3 months after launch).**

| Metric | Target | How measured |
| --- | --- | --- |
| Completed checks | 5,000 | Firestore submission count |
| Schools with group statistics live | 20 of ~60 | Schools with 30+ entries |
| Get help clicks | 3% of checks | Analytics event |
| Data errors reported | 0 unresolved after 7 days | Report-an-error log |

## Scope

Version 1 is the retake tool only, with ~60 schools (US News 2027 top 50 national universities + top 10 liberal arts colleges), no accounts.

**In scope (v1)**

- Score input form with past attempts
- Overall verdict and per-school retake labels
- Range chart per school
- Section-level gaps
- Superscore calculator
- Reach / target / safety labels
- Personal SAT-date timeline
- Test policy for domestic and international applicants (including test-blind schools), by entry year
- Score-sending rule (score choice vs all scores)
- Anonymous submissions and group statistics
- Sources and data year on every number
- Report-an-error link, Get help button and a "Support this tool" button linking to Patreon
- About section
- Responsive: mobile-first, works well on desktop. English only.

**Out of scope (v1)**

- Login, accounts or saved profiles
- Admission chance predictions or ML models
- ACT scores
- Admits-by-program / major-level data
- Scholarship and aid data, test-center tracker, Q&A section (possible later products)
- Ads or paid features
- Languages other than English

## User flow

One page: form at the top (left column on desktop), report below it (right column on desktop), no page reloads.

1. **Land:** short headline, one line on what the tool does, the form visible without scrolling on a phone.
2. **Enter scores:** latest total, Reading & Writing (R&W) and Math. Optional "Add a past attempt" (up to 5 attempts).
3. **Enter context:** current grade (9, 10, 11, 12, gap year), entry year (2027, 2028, 2029 or later), applicant type (domestic: US citizen or permanent resident; or international), country, application round (Early Decision / Early Action / Regular Decision).
4. **Pick schools:** searchable multi-select of ~60 schools, 1–15 schools.
5. **Submit:** "Check my scores". Inputs are validated before anything else happens.
6. **Report appears** (scrolls into view):
   - Overall verdict
   - Superscore summary (if past attempts were entered)
   - Timeline of usable SAT dates
   - One card per school: label, range chart, section gaps, test policy, superscore policy, score-sending rule, group statistic, source link
7. **Next steps:** Get help button, "Edit inputs", report-an-error link per school, Support (Patreon).
8. **In the background:** one anonymous record is saved (see Data).

## Functional requirements

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| FR-1 | Score input form | Total 400–1600, sections 200–800, steps of 10; total must equal R&W + Math; inline error messages; inputs kept if the user edits and resubmits |
| FR-2 | Past attempts | Up to 5 attempts, each with R&W, Math and test month; attempts can be removed |
| FR-3 | Overall verdict | One sentence at the top naming the verdict and the count of schools behind it ("Retake: below the median at 5 of 7 schools") |
| FR-4 | Per-school retake label | Uses the rules in Retake logic; test-blind schools show "SAT not considered" instead of a label |
| FR-5 | Range chart | Horizontal bar from 25th to 75th percentile, median tick, student's score marker; readable at 360 px width; text alternative for screen readers |
| FR-6 | Section-level gaps | For each school with section data: points needed in each section to reach its median, or "already above" |
| FR-7 | Superscore calculator | Best R&W + best Math across attempts; applied only to schools that superscore; other schools use the single best sitting |
| FR-8 | Reach / target / safety | Label per school from the Retake logic thresholds |
| FR-9 | Personal timeline | Lists upcoming official SAT dates (from `sat-dates.json`) that fall before each chosen school's deadline for the chosen round; dates are data, not hard-coded |
| FR-10 | Test policy | Shows required / optional / test-blind for the student's applicant type and entry year, with source link and year; flags schools whose policy differs between domestic and international |
| FR-11 | Group statistics | Per school: share of group users below / within / above its middle 50%; hidden until 30+ entries; labeled "Based on scores entered by our users, not admission results" |
| FR-12 | Sources, Get help, Report error | Every data point shows source link and data year; Get help links to the group and tutor contact; Report error opens a short form (school, field, correct value, source link) |
| FR-13 | Multi-year support | Student picks entry year (2027, 2028, 2029+). `testPolicy` is a list with `fromEntryYear`, so announced changes apply automatically (e.g. Princeton, Columbia, Notre Dame require tests from the 2027–28 cycle; Vanderbilt from fall 2029 entry). If College Board hasn't announced test dates for a year, show "Test dates not announced yet". Score ranges use the latest Common Data Set and say which class they describe |
| FR-14 | About section | Creator (Bibek Subedi, moderator of the Digital SAT Questions group), why the tool exists, links (group, LinkedIn, GitHub, contact email shown as text), tutor team, Patreon button, how data is collected and checked, disclaimer: "Not affiliated with or endorsed by College Board or any university. SAT is a trademark of College Board." |

## Retake logic

Each school gets a label from where the student's score sits in its percentiles; then timing, attempts and test policy adjust it.

**Score used per school (S):** the superscore if the school superscores; otherwise the best single sitting.

| Where S falls | Retake label | Fit label |
| --- | --- | --- |
| Below 25th percentile | Retake strongly recommended | Reach |
| 25th to below 50th | Retake if you have time | Reach |
| 50th to below 75th | Optional; essays may matter more | Target |
| 75th or above | Don't retake; focus on your application | Target or Safety |

**Adjustments (applied in this order):**

1. **Test-blind school:** no label; show "SAT not considered."
2. **Highly selective school:** admit rate under 15% is never labeled Safety; fit label is Reach regardless of score.
3. **No usable test dates left** before the deadline: replace any retake label with "No time to retake; focus on your application."
4. **3 or more past attempts:** add the note "Score gains usually shrink after 2–3 attempts."
5. **Test-optional school and S below 25th:** add the note "Consider applying without a score if this school's policy allows it for your applicant type."

**Score-sending rule:** `scoreSending` is `score-choice`, `all-scores-required` or `all-scores-recommended`. All-scores schools add: "This school sees every SAT you take, so make your next attempt count." Score-choice schools add: "You can send only your best test dates."

**Overall verdict** (counts only schools that consider the SAT):

- **Retake** if half or more are labeled "strongly recommended" or "if you have time."
- **Optional** if at least one is, but fewer than half.
- **Don't retake** if none are.

**Missing data:** if a school has no published median, show 25th–75th only and use the midpoint for labels, marked "estimated." If section data is missing, hide section gaps. If scores are missing entirely (status `needs-official-check`), show "Data not yet verified" instead of a label. Never invent values.

## Data

School data and SAT dates live as JSON files in the repo, reviewed like code; only anonymous submissions and the daily statistics summary live in Firestore.

**Sources, in order of preference**

1. Common Data Set: C9 for SAT percentiles, C1 for admit rate, C21/C22 for ED/EA deadlines
2. Official admissions website: test policy (domestic and international), superscore, score sending, self-reporting
3. Official class profile, for schools without a full Common Data Set
4. College Board website: official SAT test dates

Every value carries its source URL and data year. A value with no official source stays empty.

**Files**

- `data/schools.json` — 61 schools (collected Nov 25, 2026). Needs conversion of `testPolicy` to the per-year list below, using each record's `recentChange` text.
- `data/sat-dates.json` — official test dates from March 2027 onward.
- `docs/CHECKLIST.md` — what a human must verify before launch.

**Target school record format**

```json
{
  "id": "mit",
  "name": "Massachusetts Institute of Technology",
  "usNewsRank2027": 1,
  "admissions": { "applied": 29281, "admitted": 1334, "admitRate": 0.0456 },
  "sat": {
    "total": { "p25": 1520, "p50": 1550, "p75": 1570 },
    "rw":    { "p25": 740,  "p50": 760,  "p75": 780 },
    "math":  { "p25": 780,  "p50": 790,  "p75": 800 }
  },
  "dataYear": "2025-26",
  "testPolicy": [
    { "fromEntryYear": 2027, "domestic": "required", "international": "required" }
  ],
  "superscore": "yes",
  "scoreSending": "all-scores-recommended",
  "deadlines": { "ED": [], "EA": "11-01", "RD": "01-01" },
  "sources": { "cds": "https://...", "policy": [{ "url": "https://...", "appliesTo": "..." }] },
  "status": { "scores": "official-cds-read", "policy": "official-site-read" },
  "verified": false
}
```

Each `testPolicy` value is one of `required`, `optional`, `test-blind`, `required-with-alternatives`. `verified` turns true after a tutor-admin checks the record.

**Submission record** (Firestore collection `submissions`, one document per browser ID)

```json
{
  "anonId": "a8f3k2…",
  "total": 1420, "rw": 660, "math": 760,
  "attempts": 2,
  "grade": "11", "entryYear": 2028,
  "applicantType": "international", "country": "NP", "round": "EA",
  "schools": ["mit", "columbia", "duke"],
  "updatedAt": "server timestamp"
}
```

No names, emails, IP addresses or free-text fields.

**Statistics summary** (Firestore document `stats/summary`, written once a day): per school, entry count and share of users below, within and above its middle 50%, plus total checks, checks by country, and domestic vs international split.

## Architecture

Static site: the browser loads the app and school data from Cloudflare Pages and does every calculation itself — no server to sleep, pay for or attack.

```
GitHub repo (private) --push deploys--> Cloudflare Pages --serves app + data--> Student's browser
GitHub Action (daily) --reads submissions, writes summary--> Firebase Firestore
Student's browser --saves 1 anonymous record--> Firestore ; --reads summary--> Firestore
```

| Layer | Choice |
| --- | --- |
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Charts | Recharts or hand-drawn SVG |
| Hosting | Cloudflare Pages, connected to the private GitHub repo |
| Database | Firebase Firestore with App Check |
| Scheduled job | GitHub Actions (daily statistics) |
| Analytics | Cloudflare Web Analytics |
| Tests | Vitest |
| Support | Patreon link (payout to Nepal bank in NPR is supported) |

## Non-functional requirements

**Security**

- Firestore rules: `submissions` allows create and update only on the document whose ID matches its `anonId`, every field validated (types, ranges, known school IDs, max 15 schools). No read, list or delete from the browser.
- `errorReports` collection: create only, length limits on every field.
- `stats/summary`: read only from the browser; written only by the GitHub Action using a service-account key in GitHub Secrets.
- Firebase App Check on to block scripted spam.
- No secrets in the repo; `.env` in `.gitignore`.
- Security Guidance plugin on during development; `/security-review` before every merge; full Claude Security scan before launch; Dependabot and `npm audit` on.

**Privacy**

- No personal data collected; a one-line notice near the submit button says scores are saved anonymously for group statistics.
- No third-party trackers beyond Cloudflare Web Analytics.

**Performance**

- First load under 2 seconds on a mid-range Android phone over 4G; JS bundle under 200 KB gzipped.
- Report renders in under 300 ms after submit.
- Lighthouse 90+ for performance, accessibility and best practices.

**Accessibility**

- WCAG 2.2 AA: labeled inputs, keyboard use, visible focus, color never the only signal, text alternatives for charts.

**Design**

- One chosen design direction recorded in `CLAUDE.md` before any UI work; Frontend Design plugin installed.
- Avoid: purple gradients, glassmorphism, emoji icons, generic hero copy, Inter-everywhere type.
- Responsive: mobile first (360 px), desktop uses two columns (form left, report right).

**Quality**

- TypeScript throughout.
- Unit tests (Vitest) for retake labels, superscore, timeline, verdict and per-year policy, including every edge case in Retake logic.
- A schema check that fails the build if any school record is missing a source URL or data year.

## Milestones, risks and open questions

1. **M1 — Data:** convert `schools.json` to the target format (per-year test policy); schema check passes; human check of the CHECKLIST items.
2. **M2 — Logic:** retake labels, superscore, timeline, verdict, per-year policy with passing unit tests.
3. **M3 — Interface:** form, report, charts, About, chosen design; mobile + desktop; Lighthouse 90+.
4. **M4 — Backend and launch:** Firebase rules, App Check, submissions, Cloudflare Pages deploy, security scan; announce in the group.
5. **M5 — Group statistics:** GitHub Action live; statistics appear as schools pass 30 entries.

**Risks**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Wrong or outdated school data | Bad decisions; trust lost | Sources on every value, human check, report-error link, yearly update |
| Spam or fake submissions | Misleading statistics | App Check, strict rules, validation, one record per browser |
| Labels read as admission predictions | Misplaced confidence | Wording: "based on score ranges only, not a chance of admission" |
| Firebase free limits exceeded | Saves fail at peaks | One summary read per visit; monitor; saves fail silently |
| Test policies change | Wrong policy shown | Per-year policy, data year shown, error reports reviewed weekly |

**Open questions**

- Final product name and domain
- Contact on the Get help button: group link, tutor email or both
- Who verifies the data before launch
- Which design direction to use (4 styles being generated — see `docs/design-prompt.md`)
