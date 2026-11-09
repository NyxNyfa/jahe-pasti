import { createHash } from "crypto";

/**
 * Compute SHA-256 hash formatted as a hex string prefixed with 0x.
 */
export function sha256Hex(data: string | Buffer): string {
  const hash = createHash("sha256").update(data).digest("hex");
  return `0x${hash}`;
}

/**
 * Generate a deterministic hash for batch land data.
 */
export function generateLandDataHash(namaLahan: string, lat: number, lng: number, tanggalTanam: string): string {
  const payload = JSON.stringify({ namaLahan, lat, lng, tanggalTanam });
  return sha256Hex(payload);
}
