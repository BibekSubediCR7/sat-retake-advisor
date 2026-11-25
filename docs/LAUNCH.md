# Launch guide (Milestone 4)

Steps only the project owner can do (accounts, keys, consoles), in order. The code side is finished: without the settings below the site still works, it just doesn't save anything.

Nothing in this guide needs a secret key. reCAPTCHA Enterprise uses only a public key id, so no secret has to go into chat, the repo or Cloudflare.

## 0. Allow GitHub to update the CI workflow (once)

Your `gh` login can't push files under `.github/workflows/`. Run this and approve in the browser:

```powershell
gh auth refresh -h github.com -s workflow
```

Then `git push` sends the waiting CI commit. CI runs on every push and needs no secrets.

## 1. Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**. Use the free **Spark** plan. Google Analytics isn't needed.
2. **Build → Firestore Database → Create database**. Choose **production mode** and a location near most users (it can't be changed later).
3. **Project settings → General → Your apps → Web (`</>`)**. Register an app (no Hosting). Copy the config values `apiKey`, `authDomain`, `projectId` and `appId`. These identify the project publicly and are not secrets.
4. Send me the **project id** so I can add `.firebaserc`, or add it yourself:

   ```json
   { "projects": { "default": "YOUR-PROJECT-ID" } }
   ```

## 2. Deploy the Firestore rules

```powershell
npx firebase login
```

```powershell
npm run deploy:rules
```

`deploy:rules` first checks that `firestore.rules` matches the data (`rules:check`). After deploying, open **Firestore → Rules** and confirm they start with `// GENERATED from firestore.rules.template`.

## 3. reCAPTCHA Enterprise + App Check

Classic reCAPTCHA (v3) is deprecated for App Check, so this project uses **reCAPTCHA Enterprise** (part of Google Cloud Fraud Defense). It has a free tier of 10,000 assessments a month. App Check uses about one per visitor per hour of use, which is far above this tool's expected traffic.

1. Open <https://console.cloud.google.com/security/recaptcha> and make sure the project picker at the top shows **sat-retake-advisor** (your Firebase project is also a Google Cloud project). If asked, **Enable** the reCAPTCHA Enterprise API.
2. **Create key**:
   - Display name: `sat-retake-advisor web`
   - Platform: **Website**
   - Domains: `sat-retake-advisor.crharrybibek123.workers.dev`, plus the custom domain later. Don't add `localhost`; local development uses a debug token (point 7).
   - Leave **Use checkbox challenge** off (score-based, invisible).
   - Create it, then copy the **key id** (it looks like `6L…`). This is the public site key. Send it to me or put it in `VITE_RECAPTCHA_SITE_KEY`. There is **no secret key**.
3. Firebase console → **App Check** (under Security or Build) → **Get started** if shown → **Apps** tab → your web app → choose **reCAPTCHA Enterprise** → paste the **key id** → keep the default token time (1 hour) and risk threshold (0.5) → **Save**.
4. **Don't enforce yet.** First deploy (step 4) and watch **App Check → APIs → Cloud Firestore**. The share of "verified requests" should be close to 100%.
5. Then click **Enforce** for Cloud Firestore. After that, requests without a valid App Check token fail.
6. If you created a classic v3 key earlier, delete it in the reCAPTCHA admin console. It isn't used.
7. Local development against the real project: the dev build prints an App Check debug token in the browser console. Add it under **App Check → Apps → ⋮ → Manage debug tokens**. Never add debug tokens for production.

## 4. Cloudflare (Workers with static assets) — done

The site is deployed as the Worker **sat-retake-advisor** at <https://sat-retake-advisor.crharrybibek123.workers.dev>, connected to GitHub (`main`). Every push to `main` builds and deploys.

- Build command: `npm run build`. Deploy command: `npx wrangler deploy`. Root directory: `/`.
- `wrangler.jsonc` in the repo tells Wrangler to upload `dist/`. Without it, Cloudflare runs Wrangler's auto-setup on each deploy and builds twice.
- Security headers and caching come from `public/_headers`. They're confirmed on the live site.

**Still to do: build variables.** Vite bakes these into the site at build time, so they go under **Settings → Build → Variables and secrets** (not "Runtime variables", which a static-assets Worker can't have). Add them as plain text, then **Retry build** or push:

| Name | Value |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | from step 1 |
| `VITE_FIREBASE_AUTH_DOMAIN` | from step 1 |
| `VITE_FIREBASE_PROJECT_ID` | `sat-retake-advisor` |
| `VITE_FIREBASE_APP_ID` | from step 1 |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA Enterprise key id from step 3 |

Don't set `VITE_USE_EMULATOR` here. Saving stays off until all five are set.

Then:
1. **reCAPTCHA Enterprise key domains:** add `sat-retake-advisor.crharrybibek123.workers.dev`.
2. **Web Analytics:** a `workers.dev` address isn't on a Cloudflare zone, so analytics can't be switched on automatically. Either add a custom domain (below) and enable Web Analytics for it, or add the site under **Analytics → Web analytics → Add a site**. That gives a small script tag with a token, which I add to `index.html`; the CSP already allows `static.cloudflareinsights.com`.
3. **Custom domain** (optional, once the name is decided): **Domains** tab → **Add custom domain**. Add the domain to the reCAPTCHA Enterprise key too.

For local development against the real project, copy `.env.example` to `.env.local` and fill in the same values. `.env.local` is gitignored.

## 5. Checks after the first deploy (I can do these with you)

- [ ] Submit the form, and check that **Firestore → submissions** shows one document with exactly the 12 expected fields.
- [ ] Submit again from the same browser, and check that it's the same document (updated time changes).
- [ ] Send an error report, and check it in `errorReports`.
- [ ] Click "Get help" (once its link is set), and check that `counters/helpClicks` goes up by 1.
- [ ] Browser console: no Content-Security-Policy errors.
- [ ] App Check metrics show verified requests, then enforcement is turned on (step 3.5).
- [ ] Lighthouse 90+ for performance, accessibility and best practices on a phone profile.
- [ ] **Firebase → Usage and billing → Details & settings:** set a budget or usage alert.

## 6. Launch gate (before announcing in the group)

- [ ] Data checks in `docs/CHECKLIST.md` done by a person. Unverified schools are fine to launch: they show "Data not yet verified".
- [ ] Links in `src/config/site.ts` filled in: group, tutor contact, LinkedIn, GitHub, contact email, Patreon, and optionally the tutor team.
- [ ] Product name and domain decided.
- [ ] `/security-review` on the latest changes and the full security scan.
- [ ] App Check enforced, usage alert set.
