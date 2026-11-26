import { backendConfigured } from '../backend/config';

// Outside links and switches. A null link is hidden in the UI ("Link coming soon").
// Never fill these with guesses: each value must come from Bibek Subedi.

export interface Tutor {
  name: string;
  /** Shown as plain text. Add a tutor only with their permission to publish the address. */
  email: string;
}

export const site = {
  creatorName: 'Bibek Subedi',
  groupName: 'Digital SAT Questions',
  /** The Facebook group: "Ask a question in the group" and About links go here. */
  groupUrl: 'https://www.facebook.com/groups/941020050656522/' as string | null,
  linkedinUrl: 'https://www.linkedin.com/in/bibeksubedicr7/' as string | null,
  githubUrl: 'https://github.com/BibekSubediCR7' as string | null,
  /** Shown as plain text, never as a mailto link scraped by bots. */
  contactEmail: 'bibek.sub7@gmail.com' as string | null,
  /** Support link (e.g. Buy Me a Coffee). Both "Support this tool" buttons stay hidden while null. */
  supportUrl: null as string | null,
  /** Expert SAT tutors for one-to-one help. The tutoring block stays hidden while empty. */
  tutors: [] as readonly Tutor[],
} as const;

/** Saving is on only when the Firebase env vars are set (see .env.example). */
export const SAVING_ENABLED = backendConfigured;
