# Deploy to Firebase Hosting

The app is a static Vite single-page app (HashRouter), so Firebase Hosting
serves it as-is — no server, no functions. These steps are for Windows
PowerShell; run them from **this folder** (`claude-ai-academy`).

## 1. One-time setup

```powershell
# Install the Firebase CLI globally (needs Node.js)
npm install -g firebase-tools

# Sign in to the Google account that owns the Firebase project
firebase login
```

Create a Firebase project first if you don't have one:
https://console.firebase.google.com → **Add project**. Hosting is free on the
Spark (no-cost) plan.

## 2. Point this repo at your project

Open `.firebaserc` and replace `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID` with
your real **Project ID** (Firebase console → Project settings → Project ID),
or run:

```powershell
firebase use --add
```

and pick your project when prompted.

## 3. Build and deploy

```powershell
# Builds to dist/ and deploys it to Firebase Hosting
npm run deploy
```

That's the whole loop. When it finishes, the CLI prints your live URL:

```
Hosting URL: https://<your-project-id>.web.app
```

To deploy again after changes, just re-run `npm run deploy`.

## What the config does

`firebase.json`:
- `public: "dist"` — serves the Vite production build.
- `rewrites` — sends unknown paths to `index.html` (safe SPA fallback; this
  app uses HashRouter so routes live in the URL hash anyway).
- `headers` — long-cache the fingerprinted JS/CSS/fonts, never-cache
  `index.html` so new deploys show up immediately.

## Notes for testers

- Progress (completed lessons, notes, bookmarks) is stored in each visitor's
  **own browser** (localStorage) — nothing is sent to a server.
- Video thumbnails and the YouTube Shorts load from youtube.com, so testers
  need internet and a network that doesn't block YouTube.
- A custom domain can be added later in Firebase console → Hosting → Add
  custom domain.
