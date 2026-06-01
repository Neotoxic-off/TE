// Ambient globals for the WebExtension APIs. Firefox exposes `browser`
// (promise-based); Chromium exposes `chrome`. Typed loosely on purpose — the
// extension scripts are bundled by esbuild, not type-checked against the full
// WebExtension surface.
export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chrome: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const browser: any;
}
