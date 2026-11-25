# Design prompt — 4 styles for SAT Retake Advisor

Paste this into the design AI. Then tell Claude which style you picked.

```
Design a responsive web app UI (mobile 360px AND desktop 1280px) in 4 different
visual styles, so I can pick one. Show each style as a separate mockup.

PRODUCT
"SAT Retake Advisor" — a free tool by the Digital SAT Questions community
(160k+ members). A student enters their SAT scores and target US universities,
and gets a school-by-school answer to "Should I retake the SAT?"

SCREENS TO SHOW (for every style, mobile + desktop)
1. Input form:
   - Total SAT score, Reading & Writing score, Math score
   - "Add a past attempt" (optional, up to 5)
   - Current grade, entry year (2027, 2028, 2029...), applicant type
     (domestic / international), country, application round (ED / EA / RD)
   - Searchable multi-select of ~60 US universities
   - Button: "Check my scores"
2. Results report:
   - Overall verdict at the top, e.g. "Retake: you're below the median at 5 of 7 schools"
   - One card per school, containing:
     • a horizontal range bar: 25th–75th percentile, median tick, and a marker
       showing the student's score
     • a label: "Retake strongly recommended" / "Retake if you have time" /
       "Optional" / "Don't retake" and Reach / Target / Safety
     • section gaps, e.g. "+40 Math to reach median · Reading & Writing above median"
     • test policy, superscore yes/no, "sends all scores" vs "score choice"
     • small source line: "Source: Common Data Set 2025–26"
   - A timeline of upcoming SAT test dates the student can still use
   - Group stat line, e.g. "62% of our students targeting this school score below its median"
   - Buttons: "Get help from our tutors", "Support this tool" (Patreon)
3. About section: the creator (a student moderator of the group), why it
   exists, links, and the line "Not affiliated with College Board or any university."

THE 4 STYLES
A. Official score report — feels like a printed score sheet/admission letter:
   paper tones, serif headings, ruled lines, stamp-like labels.
B. Newspaper data desk — editorial layout like a top newspaper's graphics
   team: strong headline, clean charts, black/white with one accent color.
C. Swiss minimal — strict grid, big bold numbers, lots of white space,
   one bright accent color, sans-serif.
D. Exam hall — answer-sheet / bubble-sheet feel: circles, grid paper,
   pencil-gray and one highlight color.

RULES
- Must look modern, clean and trustworthy, for students aged 15–19.
- Fully responsive: mobile layout stacks; desktop uses the extra width well
  (e.g. form on the left, results on the right).
- Accessible: high contrast, readable 16px body text, tap targets 44px+,
  color is never the only signal (labels always have text).
- AVOID: purple/blue gradients, glassmorphism, neon glows, emoji icons,
  generic "Unlock your potential" copy, stock 3D illustrations, Inter
  font everywhere, cards with colored left-border accents.
- Do NOT use College Board or university logos.
- Use realistic sample data (e.g. MIT 1520 / 1550 / 1570) and mark it "sample data".
```
