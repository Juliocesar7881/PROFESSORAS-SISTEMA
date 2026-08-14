export function constrainedSize(width: number, height: number, maxSide: number) {
  const safeWidth = Math.max(1, width || maxSide);
  const safeHeight = Math.max(1, height || maxSide);
  const scale = Math.min(1, maxSide / Math.max(safeWidth, safeHeight));
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}
