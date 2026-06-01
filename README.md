# Twitter Enhanced

Firefox (MV3) extension that removes age-assurance gates and sensitive-media
blurring on **X / Twitter**. It intercepts the site's webpack feature flags and
GraphQL responses in the page world, then exposes everything through a polished
**Next.js + TypeScript + Tailwind/shadcn** UI (toolbar popup + full settings
page).

Reworked from a userscript into a configurable extension with a real UI.

## Features

Each toggle is one clear intent — the underlying X.com webpack flags are grouped
behind it instead of being exposed as cryptic duplicates.

- **Bypass age verification** — skips age-assurance prompts + Grok age limits and
  spoofs the profile birthdate.
- **Show sensitive media** — removes blur, warnings and click-through
  interstitials on sensitive content.
- **Restore Twitter logo** — swaps the X brand mark for the classic blue bird.
- **Hide Grok** — removes Grok from nav and the compose bar.
- **Hide Premium upsell** — removes "Subscribe to Premium" prompts.
- **Domain allowlist** — choose between `x.com` and `twitter.com`.
- **Live stats sync** — real-time flags-patched / media-unblurred counters flow
  from the page → storage → popup.
- **Master switch** + toolbar badge.

## Architecture

```
src/shared/config.ts    Types, defaults, flag definitions (shared everywhere)
src/inject/engine.ts    Page-world engine: hooks fetch/JSON.parse/XHR/globals
src/content/content.ts  Isolated bridge: storage <-> page via postMessage
src/background/*.ts      Install defaults, toolbar badge
pages/popup.tsx          Toolbar popup UI
pages/options.tsx        Full settings dashboard
components/, lib/        shadcn-style UI + storage hooks
```

The page-world engine boots with safe defaults (all on) at `document_start`, so
hooks are installed before the app runs; the content script then pushes the
user's saved settings and the engine re-patches.

## Build

```bash
npm install
npm run build      # builds UI (out/) + scripts (dist/) and assembles dist/
```

Load in Firefox: `about:debugging#/runtime/this-firefox` → **Load Temporary
Add-on** → pick `dist/manifest.json`.

Package for AMO:

```bash
npm run package    # → twitter-enhanced.zip
```

Dev the UI in a normal browser (uses a `localStorage` fallback for settings):

```bash
npm run dev:ui     # http://localhost:3000/popup  and  /options
```

## License

GPL-3.0-or-later. See [LICENSE](./LICENSE).
