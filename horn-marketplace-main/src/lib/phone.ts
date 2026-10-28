/** Normalize Somaliland / Somalia mobile numbers to E.164 (+252…). */
export function toE164(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("252")) {
    if (digits.length < 12 || digits.length > 13) return null;
    return `+${digits}`;
  }
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length < 8 || digits.length > 9) return null;
  return `+252${digits}`;
}

export function maskPhone(e164: string) {
  if (e164.length < 6) return e164;
  return `${e164.slice(0, 5)}•••${e164.slice(-3)}`;
}
