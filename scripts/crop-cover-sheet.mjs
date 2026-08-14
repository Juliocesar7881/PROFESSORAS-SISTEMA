import sharp from "sharp";

const [input, ...names] = process.argv.slice(2);

if (!input || names.length !== 4) {
  console.error("Usage: node scripts/crop-cover-sheet.mjs <input> <top-left.webp> <top-right.webp> <bottom-left.webp> <bottom-right.webp>");
  process.exit(1);
}

const metadata = await sharp(input).metadata();
const sourceWidth = metadata.width ?? 0;
const sourceHeight = metadata.height ?? 0;
const width = Math.floor(sourceWidth / 2);
const height = Math.floor(sourceHeight / 2);

await Promise.all(
  names.map((name, index) => {
    const left = index % 2 === 0 ? 0 : width;
    const top = index < 2 ? 0 : height;

    return sharp(input)
      .extract({ left, top, width, height })
      .resize(1200, 800, { fit: "cover" })
      .webp({ quality: 92 })
      .toFile(`public/projects/covers/${name}`);
  }),
);

console.log(`cropped ${names.length} covers from ${sourceWidth}x${sourceHeight}`);
