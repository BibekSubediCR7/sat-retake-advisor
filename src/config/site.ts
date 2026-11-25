import { backendConfigured } from '../backend/config';

// Outside links and switches. A null link is hidden in the UI ("Link coming soon").
// Never fill these with guesses: each value must come from Bibek Subedi.

export const site = {
  creatorName: 'Bibek Subedi',
  groupName: 'Digital SAT Questions',
  /** The Facebook group (or other) URL. */
  groupUrl: null as string | null,
  /** Where "Get help from our tutors" goes (URL or mailto:). */
  tutorContactUrl: null as string | null,
  linkedinUrl: null as string | null,
  githubUrl: null as string | null,
  /** Shown as plain text, never as a mailto link scraped by bots. */
  contactEmail: null as string | null,
  patreonUrl: null as string | null,
  /** Optional one-line description of the tutor team for the About section. */
  tutorTeam: null as string | null,
} as const;

/** Saving is on only when the Firebase env vars are set (see .env.example). */
export const SAVING_ENABLED = backendConfigured;
