// Bundles the extension's TypeScript scripts (content / background / page-world
// inject) into plain JS in dist/. The Next.js UI is built separately.
import { build } from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });

const common = {
  bundle: true,
  format: "iife",
  target: ["firefox115", "chrome110"],
  legalComments: "none",
  logLevel: "info",
};

const dev = process.argv.includes("--dev");

await Promise.all([
  build({
    ...common,
    entryPoints: { content: "src/content/content.ts" },
    outfile: "dist/content.js",
    minify: !dev,
  }),
  build({
    ...common,
    entryPoints: { background: "src/background/background.ts" },
    outfile: "dist/background.js",
    minify: !dev,
  }),
  build({
    ...common,
    entryPoints: { inject: "src/inject/engine.ts" },
    outfile: "dist/inject.js",
    // inject runs in the page's MAIN world; keep it readable-ish but small.
    minify: !dev,
  }),
]);

console.log("✓ scripts bundled → dist/{content,background,inject}.js");
