// Zips dist/ into web-ext.zip for AMO submission. Uses the system `zip` if
// present, otherwise falls back to Node's built-in (deflate via zlib + a tiny
// store). Simplest: shell out to `zip` on *nix / `Compress-Archive` on Windows.
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { platform } from "node:os";

if (!existsSync("dist/manifest.json")) {
  console.error("✗ dist/ not built — run `npm run build` first.");
  process.exit(1);
}

const out = "twitter-enhanced.zip";
rmSync(out, { force: true });

try {
  if (platform() === "win32") {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path dist/* -DestinationPath ${out} -Force"`,
      { stdio: "inherit" }
    );
  } else {
    execSync(`cd dist && zip -r -FS ../${out} . && cd ..`, { stdio: "inherit", shell: "/bin/bash" });
  }
  console.log(`✓ packaged → ${out}`);
} catch (e) {
  console.error("✗ zip failed:", e.message);
  process.exit(1);
}
