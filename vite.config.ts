/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    // Component tests (*.test.tsx) run in jsdom; logic and data tests stay in node.
    environmentMatchGlobs: [['src/**/*.test.tsx', 'jsdom']],
    setupFiles: ['src/test-setup.ts'],
    // Tests never use the developer's real Firebase settings from .env.local:
    // saving is off unless a test mocks it on (see src/App.saving.test.tsx).
    env: {
      VITE_FIREBASE_API_KEY: '',
      VITE_FIREBASE_AUTH_DOMAIN: '',
      VITE_FIREBASE_PROJECT_ID: '',
      VITE_FIREBASE_APP_ID: '',
      VITE_RECAPTCHA_SITE_KEY: '',
      VITE_USE_EMULATOR: '',
    },
    exclude: ['src/mockups/**', 'node_modules/**'],
  },
});
