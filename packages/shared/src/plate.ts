export const PLATE_MIN_DIGITS = 2;
export const PLATE_MAX_DIGITS = 8;

/**
 * Normalize user input to a canonical plate string (digits, no leading zeros).
 * Accepts dashes and whitespace as separators. Returns null when invalid.
 * Short (2–4 digit) plates exist for old and heavy vehicles, so the minimum is 2.
 */
export function normalizePlate(input: string): string | null {
  const stripped = input.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(stripped)) return null;
  if (stripped.length < PLATE_MIN_DIGITS || stripped.length > PLATE_MAX_DIGITS) return null;
  const canonical = stripped.replace(/^0+/, '');
  if (canonical.length < PLATE_MIN_DIGITS) return null;
  return canonical;
}

/** Zero-pad to 8 characters, as stored by the legacy off-road resources. */
export function padPlate8(plate: string): string {
  return plate.padStart(PLATE_MAX_DIGITS, '0');
}

/**
 * Format digits the way they appear on an Israeli plate.
 * 7 digits → `12-345-67`, 8 digits → `123-45-678`. Partial input is formatted progressively
 * using the 7-digit pattern, switching to the 8-digit pattern once the 8th digit is typed.
 */
export function formatPlate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, PLATE_MAX_DIGITS);
  const groups = digits.length === 8 ? [3, 2, 3] : [2, 3, 2];
  const parts: string[] = [];
  let i = 0;
  for (const size of groups) {
    if (i >= digits.length) break;
    parts.push(digits.slice(i, i + size));
    i += size;
  }
  return parts.join('-');
}
