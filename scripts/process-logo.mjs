/**
 * Process Explore More Academy logo: remove background, export PNG + favicon.
 *
 * Place the master logo at public/logo-source.jpg (or .png), then run:
 *   node scripts/process-logo.mjs
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";

const OUT_DIR = path.resolve("public/uploads/settings");
const PUBLIC_DIR = path.resolve("public");

const SOURCE_CANDIDATES = [
  path.join(PUBLIC_DIR, "logo-source.png"),
  path.join(PUBLIC_DIR, "logo-source.jpg"),
  path.join(PUBLIC_DIR, "logo-source.jpeg"),
  path.join(OUT_DIR, "logo.png"),
];

function isBackgroundPixel(r, g, b) {
  const brightness = (r + g + b) / 3;
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

  // Pure / near-white
  if (r > 248 && g > 248 && b > 248) return true;

  // Off-white / cream
  if (brightness > 215 && maxDiff < 35) return true;
  if (brightness > 200 && r > 195 && g > 190 && b > 175 && maxDiff < 25) return true;

  // Checkerboard gray squares (common in exported previews)
  if (brightness > 168 && brightness < 232 && maxDiff < 14) return true;

  return false;
}

async function removeBackground(inputBuffer) {
  const image = sharp(inputBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  const { width, height, channels } = info;

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    if (isBackgroundPixel(r, g, b)) {
      pixels[i + 3] = 0;
    } else {
      const brightness = (r + g + b) / 3;
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      if (brightness > 190 && maxDiff < 20) {
        pixels[i + 3] = Math.min(pixels[i + 3], Math.floor((210 - brightness) * 6));
      }
    }
  }

  return sharp(pixels, { raw: { width, height, channels } })
    .png()
    .trim({ threshold: 10 });
}

function resolveSource() {
  for (const candidate of SOURCE_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    `No logo source found. Place your logo at one of:\n${SOURCE_CANDIDATES.join("\n")}`
  );
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const sourcePath = resolveSource();
  console.log("Using logo source:", sourcePath);
  const input = fs.readFileSync(sourcePath);
  const processed = await removeBackground(input);

  const logoPath = path.join(OUT_DIR, "logo.png");
  const trimmedBuffer = await processed.clone().png().toBuffer();
  await fs.promises.writeFile(logoPath, trimmedBuffer);

  const trimmed = sharp(trimmedBuffer);
  const meta = await trimmed.metadata();
  const iconWidth = Math.max(1, Math.min(Math.round(meta.width * 0.38), meta.width));

  const logoFooterPath = path.join(OUT_DIR, "logo-footer.png");
  await trimmed.clone().resize(360, 160, { fit: "inside" }).png().toFile(logoFooterPath);

  const logoHeaderPath = path.join(OUT_DIR, "logo-header.png");
  await trimmed.clone().resize(320, 80, { fit: "inside" }).png().toFile(logoHeaderPath);

  const faviconPng = path.join(PUBLIC_DIR, "favicon.png");
  const faviconIco = path.join(PUBLIC_DIR, "favicon.ico");
  const appleTouch = path.join(PUBLIC_DIR, "apple-touch-icon.png");

  const iconMark = trimmed.clone().extract({
    left: 0,
    top: 0,
    width: iconWidth,
    height: meta.height ?? 1,
  });

  await iconMark
    .clone()
    .resize(48, 48, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(faviconPng);

  await sharp(faviconPng).resize(32, 32).toFile(faviconIco);

  await iconMark
    .clone()
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(appleTouch);

  console.log("Logo processed:");
  console.log(" -", logoPath);
  console.log(" -", logoHeaderPath);
  console.log(" -", logoFooterPath);
  console.log(" -", faviconPng);
  console.log(" -", faviconIco);
  console.log(" -", appleTouch);
}

main().catch(console.error);
