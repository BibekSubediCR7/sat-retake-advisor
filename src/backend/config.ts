// Firebase web config from Vite env vars (see .env.example). These are public identifiers;
// reCAPTCHA Enterprise needs only the public site key (no secret key anywhere).
const env = import.meta.env;

export const useEmulator = env.DEV === true && env.VITE_USE_EMULATOR === '1';

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || (useEmulator ? 'demo-sat-retake-advisor' : ''),
  appId: env.VITE_FIREBASE_APP_ID ?? '',
};

export const recaptchaSiteKey = env.VITE_RECAPTCHA_SITE_KEY ?? '';

/** Saving is on only with a complete config (or the local emulator in dev). */
export const backendConfigured =
  useEmulator ||
  Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId && recaptchaSiteKey);
