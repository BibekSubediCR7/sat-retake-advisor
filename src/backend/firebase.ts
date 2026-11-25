// Lazy Firebase setup. The SDK is downloaded on the first save, never on page load.
// App Check uses reCAPTCHA Enterprise: classic reCAPTCHA v3 is deprecated for App Check.
import type { Firestore } from 'firebase/firestore/lite';
import { backendConfigured, firebaseConfig, recaptchaSiteKey, useEmulator } from './config';

let dbPromise: Promise<Firestore> | null = null;

export function getDb(): Promise<Firestore> {
  if (!backendConfigured) return Promise.reject(new Error('Saving is not configured.'));
  dbPromise ??= (async () => {
    const [{ initializeApp }, appCheck, fs] = await Promise.all([
      import('firebase/app'),
      import('firebase/app-check'),
      import('firebase/firestore/lite'),
    ]);
    const app = initializeApp(firebaseConfig);
    if (!useEmulator) {
      if (import.meta.env.DEV) {
        // Local dev only: App Check prints a debug token in the console to register in the
        // Firebase console (App Check → Manage debug tokens). Never set in production builds.
        (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
      appCheck.initializeAppCheck(app, {
        provider: new appCheck.ReCaptchaEnterpriseProvider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    }
    const db = fs.getFirestore(app);
    if (useEmulator) fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    return db;
  })();
  // A failed setup can be retried on the next save.
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

export function firestoreLite() {
  return import('firebase/firestore/lite');
}
