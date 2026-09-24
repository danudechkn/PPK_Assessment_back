export function signBuffer(
  signs: Record<string, string | null | undefined>,
): Record<string, Buffer | null> {
  const result: Record<string, Buffer | null> = {};
  for (const key in signs) {
    const dataUrl = signs[key];
    if (!dataUrl) {
      result[key] = null;
      continue;
    }
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    result[key] = Buffer.from(base64, "base64");
  }
  return result;
}

export function bufferToSign(buffer: Buffer | null | undefined): string | null {
  if (!buffer) return null;
  return `data:image/png;base64,${buffer.toString("base64")}`;
}
