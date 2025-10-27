export type SESLabel = "High" | "Medium" | "Low" | "Unknown";

export const SES_MAP: Record<string, Exclude<SESLabel, "Unknown">> = {
  // Upmarket/High SES areas
  "ludwigsdorf": "High",
  "auasblick": "High",
  "klein windhoek": "High",
  "eros": "High",
  "olympia": "High",
  "luxuryhill": "High",
  "avis": "High",
  "finkenstein": "High",
  "cimbebasia": "High",
  "suiderhof": "High",
  "kleine kuppe": "High",
  "elisenheim": "High",

  // Mid-income areas
  "pioneers park": "Medium",
  "pionierspark": "Medium",
  "hochland park": "Medium",
  "rocky crest": "Medium",
  "khomasdal": "Medium",
  "otjomuise": "Medium",
  "windhoek west": "Medium",
  "windhoek north": "Medium",
  "academia": "Medium",
  "dorado park": "Medium",
  "prosperita": "Medium",
  "lafrenz": "Medium",

  // Low-income areas
  "katutura": "Low",
  "havana": "Low",
  "okuryangava": "Low",
  "greenwell matongo": "Low",
  "hakahana": "Low",
  "wanaheda": "Low",
  "goreangab": "Low",
  "okahandja park": "Low",
  "one nation": "Low",
  "ombili": "Low",
  "informal settlement": "Low",
  "informal": "Low",
};

// Street name patterns that suggest SES
const UPMARKET_STREET_PATTERNS = [
  /\b(olive|cedar|pine|oak|maple|elm)\s+(st|street|ave|avenue|rd|road)\b/i,
  /\b(park|garden|grove|valley|hill|ridge|crest)\s+(st|street|ave|avenue|rd|road)\b/i,
  /\b(first|1st|second|2nd|third|3rd)\s+ave/i,
];

const LOW_INCOME_INDICATORS = [
  /\b(informal|settlement|shack|temporary)\b/i,
  /\b(village|location)\b/i,
  /\b(erf\s+\d{4,})\b/i, // High ERF numbers often indicate newer townships
];

export function inferSES(address?: string, postalCode?: string): SESLabel {
  if (!address) return "Unknown";
  const s = address.toLowerCase();

  // First check direct neighborhood matches
  for (const key of Object.keys(SES_MAP)) {
    if (s.includes(key)) return SES_MAP[key];
  }

  // Check for explicit low-income indicators
  for (const pattern of LOW_INCOME_INDICATORS) {
    if (pattern.test(s)) return "Low";
  }

  // Check for upmarket street patterns
  for (const pattern of UPMARKET_STREET_PATTERNS) {
    if (pattern.test(s)) return "High";
  }

  // Use postal code if available (Windhoek postal codes)
  if (postalCode) {
    const code = parseInt(postalCode.replace(/\D/g, '')) || 0;
    if (code >= 9000 && code <= 9999) return "High"; // Premium areas
    if (code >= 1000 && code <= 8999) return "Medium"; // Standard areas
    if (code > 0 && code < 1000) return "Low"; // Township areas
  }

  // Default to Medium for addresses with proper street names
  if (/\b(st|street|ave|avenue|rd|road|drive|lane)\b/i.test(s)) {
    return "Medium";
  }

  return "Unknown";
}
