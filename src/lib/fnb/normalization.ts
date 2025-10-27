export function normalizeNumberString(x: any): number | null {
  if (x === undefined || x === null || x === "") return null;
  const n = Number(String(x).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function parseISOorDate(x?: string): Date | null {
  if (!x) return null;
  const d = new Date(x);
  return isNaN(d.getTime()) ? null : d;
}

export function normalizePhone(phone?: string): { ok: boolean; formatted: string } {
  if (!phone) return { ok: false, formatted: "" };
  const raw = String(phone).trim();
  const digits = raw.replace(/\D+/g, "");

  if (!digits) return { ok: false, formatted: raw };

  if (/^0\d{9}$/.test(digits)) {
    const e164 = "+264" + digits.slice(1);
    return { ok: true, formatted: e164 };
  }

  if (/^264\d{8,9}$/.test(digits)) return { ok: true, formatted: "+" + digits };
  if (/^\+?264\d{8,9}$/.test(raw.replace(/\s+/g, ""))) return { ok: true, formatted: raw.startsWith("+") ? raw : "+" + digits };

  if (/0\d[\d\s-]{7,}/.test(raw)) return { ok: true, formatted: raw };

  if (digits.length >= 9) return { ok: true, formatted: raw };

  return { ok: false, formatted: raw };
}

export function validateEmail(email?: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function daysSince(dateStr?: string): number | null {
  const d = parseISOorDate(dateStr);
  if (!d) return null;
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}
