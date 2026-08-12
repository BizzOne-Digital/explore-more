/**
 * Process Explore More Academy logo: remove background, export PNG + favicon.
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";

const SOURCE = path.resolve(
  "C:/Users/admin/.cursor/projects/e-2sri-nokri-explore-ore/assets/c__Users_admin_AppData_Roaming_Cursor_User_workspaceStorage_baca4a170f4cb78dbc9038e74c37a2a7_images_image-986b860d-1b8d-429c-b84e-e25b9c8d2bf4.png"
);

const OUT_DIR = path.resolve("public/uploads/settings");
const PUBLIC_DIR = path.resolve("public");

async function removeBackground(inputBuffer) {
  const image = sharp(inputBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  const { width, height, channels } = info;

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // Remove off-white / cream / light gray background and soft shadow
    const brightness = (r + g + b) / 3;
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));

    const isBackground =
      (brightness > 215 && maxDiff < 35) ||
      (brightness > 200 && r > 195 && g > 190 && b > 175 && maxDiff < 25);

    if (isBackground) {
      pixels[i + 3] = 0;
    } else if (brightness > 190 && maxDiff < 20) {
      // Feather shadow pixels
      pixels[i + 3] = Math.min(pixels[i + 3], Math.floor((210 - brightness) * 6));
    }
  }

  return sharp(pixels, { raw: { width, height, channels } }).png();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const input = fs.readFileSync(SOURCE);
  const processed = await removeBackground(input);

  const logoPath = path.join(OUT_DIR, "logo.png");
  await processed.clone().png({ quality: 100, compressionLevel: 9 }).toFile(logoPath);

  // Larger version for footer
  const logoFooterPath = path.join(OUT_DIR, "logo-footer.png");
  await processed.clone().resize(220, 220, { fit: "inside" }).png().toFile(logoFooterPath);

  // Header-optimized (compact height)
  const logoHeaderPath = path.join(OUT_DIR, "logo-header.png");
  await processed.clone().resize(160, 56, { fit: "inside" }).png().toFile(logoHeaderPath);

  // Favicon — scaled logo mark
  const faviconPng = path.join(PUBLIC_DIR, "favicon.png");
  const faviconIco = path.join(PUBLIC_DIR, "favicon.ico");
  const appleTouch = path.join(PUBLIC_DIR, "apple-touch-icon.png");

  await processed
    .clone()
    .resize(48, 48, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(faviconPng);

  await sharp(faviconPng).resize(32, 32).toFile(faviconIco);

  await processed
    .clone()
    .resize(180, 180, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(appleTouch);

  console.log("Logo processed:");
  console.log(" -", logoPath);
  console.log(" -", logoHeaderPath);
  console.log(" -", logoFooterPath);
  console.log(" -", faviconPng);
}

main().catch(console.error);
