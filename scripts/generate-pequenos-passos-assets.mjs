import sharp from "sharp";

const source = "public/brand/pequenos-passos-icon-source.png";
const ivory = { r: 255, g: 253, b: 250, alpha: 1 };

async function square(path, size) {
  await sharp(source)
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(path);
}

async function adaptiveForeground() {
  const size = 1024;
  const foreground = await sharp(source)
    .resize(820, 820, { fit: "contain" })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: ivory },
  })
    .composite([{ input: foreground, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile("mobile/assets/android-icon-foreground.png");
}

await Promise.all([
  square("public/brand/pequenos-passos-icon.png", 1024),
  square("public/brand/icon-192.png", 192),
  square("public/brand/icon-512.png", 512),
  square("public/brand/icon-512-maskable.png", 512),
  square("mobile/assets/icon.png", 1024),
  square("mobile/assets/splash-icon.png", 512),
  square("mobile/assets/favicon.png", 96),
  sharp({ create: { width: 432, height: 432, channels: 4, background: ivory } })
    .png({ compressionLevel: 9 })
    .toFile("mobile/assets/android-icon-background.png"),
  adaptiveForeground(),
]);

console.log("Pequenos Passos brand assets generated.");
