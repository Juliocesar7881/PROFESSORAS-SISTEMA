import { File } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

import { constrainedSize } from "./photo-size";

export const PHOTO_TARGET_BYTES = 900 * 1024;
export const PHOTO_MAX_BYTES = Math.round(1.25 * 1024 * 1024);
export const PHOTO_MAX_SIDE = 1440;

export async function preparePhoto(asset: {
  uri: string;
  width?: number;
  height?: number;
  fileName?: string | null;
}) {
  let dimensions = constrainedSize(asset.width ?? PHOTO_MAX_SIDE, asset.height ?? PHOTO_MAX_SIDE, PHOTO_MAX_SIDE);
  const qualities = [0.82, 0.72, 0.62, 0.52, 0.42, 0.34];
  let latest: { uri: string; fileName: string; mimeType: "image/jpeg" } | null = null;
  let latestSize = Number.POSITIVE_INFINITY;

  for (const [index, quality] of qualities.entries()) {
    if (index === 4 && latestSize > PHOTO_MAX_BYTES) {
      dimensions = constrainedSize(dimensions.width, dimensions.height, 1200);
    }
    const output = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: dimensions }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
    );
    const file = new File(output.uri);
    latest = {
      uri: output.uri,
      fileName: asset.fileName?.replace(/\.[^.]+$/, ".jpg") || `foto-${Date.now()}-${index}.jpg`,
      mimeType: "image/jpeg",
    };
    latestSize = file.size;
    if (latestSize <= PHOTO_TARGET_BYTES) return latest;
  }

  if (!latest || latestSize > PHOTO_MAX_BYTES) {
    throw new Error("A imagem nao conseguiu ser reduzida para o limite de 1,25 MB.");
  }
  return latest;
}
