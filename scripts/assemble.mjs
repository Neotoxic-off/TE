// Assembles the loadable extension into dist/:
//   - bundled scripts (already emitted to dist/ by esbuild)
//   - Next.js static export (out/ → dist/)
//   - manifest.json + icon
import { cpSync, copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });

if (!existsSync("out")) {
  console.error("✗ out/ not found — run `npm run build:ui` first.");
  process.exit(1);
}

// Copy the Next export (popup.html, options.html, _next/, ...) into dist/.
for (const entry of readdirSync("out")) {
  cpSync(`out/${entry}`, `dist/${entry}`, { recursive: true });
}

// Manifest + icon at the extension root.
copyFileSync("manifest.json", "dist/manifest.json");
copyFileSync("assets/icon.svg", "dist/icon.svg");

console.log("✓ extension assembled → dist/ (load via about:debugging → Load Temporary Add-on → dist/manifest.json)");
