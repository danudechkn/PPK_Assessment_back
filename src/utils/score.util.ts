import { ApiError } from "./api-response.util";
/** Numeric strings are accepted; implicit boolean/array/blank coercions are rejected. */
export function parseScore(value: unknown, field: string, max: number, nullable = false): number | null {
  if (nullable && (value === null || value === "")) return null;
  if ((typeof value !== "number" && typeof value !== "string") ||
      (typeof value === "string" && value.trim() === "") ||
      !Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > max) {
    throw new ApiError(`${field} must be an integer between 0 and ${max}${nullable ? " or null" : ""}`);
  }
  return Number(value);
}
