// Renders assets/icon.svg → PNG at 48/96/128 into assets/.
import sharp from "sharp";
import { readFileSync } from "node:fs";

const svg = readFileSync("assets/icon.svg");
const sizes = [48, 96, 128];

await Promise.all(
  sizes.map((s) =>
    sharp(svg, { density: 384 })
      .resize(s, s)
      .png()
      .toFile(`assets/icon-${s}.png`)
      .then(() => console.log(`✓ assets/icon-${s}.png`))
  )
);
