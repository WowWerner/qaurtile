export type SESLabel = "Upmarket" | "Mid-income" | "Low-income" | "Unknown";

export const SES_MAP: Record<string, Exclude<SESLabel, "Unknown">> = {
  "ludwigsdorf": "Upmarket",
  "auasblick": "Upmarket",
  "klein windhoek": "Upmarket",
  "eros": "Upmarket",
  "olympia": "Upmarket",
  "pioneers park": "Mid-income",
  "hochland park": "Mid-income",
  "rocky crest": "Mid-income",
  "khomasdal": "Mid-income",
  "otjomuise": "Mid-income",
  "katutura": "Low-income",
  "havana": "Low-income",
  "okuryangava": "Low-income",
  "greenwell matongo": "Low-income",
  "hakahana": "Low-income",
};

export function inferSES(address?: string): SESLabel {
  if (!address) return "Unknown";
  const s = address.toLowerCase();
  for (const key of Object.keys(SES_MAP)) {
    if (s.includes(key)) return SES_MAP[key];
  }
  return "Unknown";
}
