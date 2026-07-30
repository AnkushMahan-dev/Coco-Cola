# Hosting the CCLM Dashboard on Firebase

The `CCLM_Dashboard.html` file is a fully self-contained static dashboard (all
data is embedded; it only loads Chart.js and Grid.js from public CDNs). This
makes it a perfect fit for **Firebase Hosting**.

## What's in this setup

| File | Purpose |
| --- | --- |
| `public/index.html` | The dashboard, served as the site root. This is a copy of `CCLM_Dashboard.html`. |
| `firebase.json` | Hosting configuration. Serves **only** the `public/` folder. |
| `.gitignore` | Ignores Firebase/Node local artifacts. |

> `.firebaserc` (which pins the target Firebase project) is **not** committed —
> it is created for you the first time you run `firebase use --add`.

> **Only `public/` is deployed.** The internal `.xlsx`, `.docx`, `.MHTML`, log
> files, and the `01_*/` and `02_*/` folders are **never** uploaded to the
> public site — only `public/index.html` is.

## One-time setup

1. **Install the Firebase CLI** (needs Node.js):
   ```bash
   npm install -g firebase-tools
   ```

   > **Windows tip:** if the `firebase` command isn't recognized afterward,
   > either restart your terminal, or just prefix every command below with
   > `npx` — e.g. `npx firebase-tools login`. It runs the same tool without
   > needing PATH changes.

2. **Log in** to your Google account:
   ```bash
   firebase login
   ```

3. **Create a Firebase project** at https://console.firebase.google.com
   (**Add project**), then connect this folder to it:
   ```bash
   firebase use --add
   ```
   Select your project and give it the alias `default`. This creates the
   `.firebaserc` file for you.

## Deploy

From the repository root:

```bash
firebase deploy --only hosting
```

When it finishes, the CLI prints your live URL, e.g.
`https://YOUR_PROJECT_ID.web.app`.

## Preview before going live (optional)

```bash
firebase hosting:channel:deploy preview
```

This gives you a temporary, shareable preview URL that expires automatically.

## Updating the dashboard later

Whenever you regenerate `CCLM_Dashboard.html`, refresh the deployed copy and
redeploy:

```bash
cp CCLM_Dashboard.html public/index.html
firebase deploy --only hosting
```
