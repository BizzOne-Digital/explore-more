/**
 * Upscale certificate template images for sharper PDF output.
 * Run: node scripts/upscale-certificate-templates.mjs
 */
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const SCALE = 3;
const TEMPLATE_DIR = path.resolve("public/images/certificate-templates");

async function main() {
  const files = await fs.readdir(TEMPLATE_DIR);
  for (const file of files) {
    if (!/\.(jpg|jpeg|png)$/i.test(file)) continue;
    const filePath = path.join(TEMPLATE_DIR, file);
    const input = await fs.readFile(filePath);
    const meta = await sharp(input).metadata();
    const width = Math.round((meta.width ?? 1024) * SCALE);
    const height = Math.round((meta.height ?? 790) * SCALE);

    const output =
      file.toLowerCase().endsWith(".png")
        ? await sharp(input)
            .resize(width, height, { kernel: sharp.kernel.lanczos3 })
            .png({ compressionLevel: 6 })
            .toBuffer()
        : await sharp(input)
            .resize(width, height, { kernel: sharp.kernel.lanczos3 })
            .jpeg({ quality: 92, mozjpeg: true })
            .toBuffer();

    await fs.writeFile(filePath, output);
    console.log(`${file}: ${meta.width}x${meta.height} → ${width}x${height}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
