import { normalizeNumberString, daysSince, normalizePhone, validateEmail } from "./normalization";
import { inferSES, SESLabel } from "./ses";

export type Bucket = "High" | "Medium" | "Low" | "Trace Required";

export type Weights = {
  contact_cell: number;
  contact_email: number;
  contact_work: number;
  contact_address: number;
  contact_absent_penalty: number;
  pay_last_lt30: number;
  pay_last_30_90: number;
  pay_amount_gte_25pct: number;
  pay_amount_5_24pct: number;
  debt_cap_le_5k: number;
  debt_cap_5k_50k: number;
  debt_high_interest_fee_penalty: number;
  ses_upmarket: number;
  ses_mid: number;
  stable_occupation: number;
  legal_none: number;
  legal_inflight: number;
  legal_insolvency: number;
};

export const DEFAULT_WEIGHTS: Weights = {
  contact_cell: 15,
  contact_email: 5,
  contact_work: 5,
  contact_address: 5,
  contact_absent_penalty: -10,
  pay_last_lt30: 20,
  pay_last_30_90: 10,
  pay_amount_gte_25pct: 10,
  pay_amount_5_24pct: 5,
  debt_cap_le_5k: 10,
  debt_cap_5k_50k: 5,
  debt_high_interest_fee_penalty: -5,
  ses_upmarket: 10,
  ses_mid: 5,
  stable_occupation: 5,
  legal_none: 10,
  legal_inflight: 5,
  legal_insolvency: 0,
};

export type Debtor = Record<string, any> & {
  clientRef?: string;
  amount?: number | string;
  capitalOnDefault?: number | string;
  interestPortion?: number | string;
  legalFeePortion?: number | string;
  interestRate?: number | string;
  interestDate?: string;
  dateOfDefault?: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number | string;
  debtorFirstName?: string;
  debtorSecondName?: string;
  debtorSurname?: string;
  debtorID?: string;
  email1?: string;
  email2?: string;
  cell1?: string;
  cell2?: string;
  home1?: string;
  work1?: string;
  streetLine1?: string;
  streetLine2?: string;
  streetPostalCode?: string;
  postalLine1?: string;
  postalLine2?: string;
  postalPostalCode?: string;
  occupation?: string;
  employer?: string;
  employerAddress?: string;
  previousAttorneyLegalStage?: string;
  __score__?: number;
  __bucket__?: Bucket;
  __ses__?: SESLabel;
};

export function computeScore(d: Debtor, w: Weights): { score: number; bucket: Bucket; ses: SESLabel } {
  let score = 0;

  const p1 = normalizePhone(d.cell1 || d.cell2 || d.home1);
  const phonePresent = p1.ok;
  const emailPresent = validateEmail(d.email1 || d.email2);
  const workPresent = Boolean(d.work1 || d.employer);
  const addressPresent = Boolean(d.streetLine1 || d.streetPostalCode || d.postalLine1);

  if (phonePresent) score += w.contact_cell;
  if (emailPresent) score += w.contact_email;
  if (workPresent) score += w.contact_work;
  if (addressPresent) score += w.contact_address;
  if (!phonePresent && !emailPresent && !workPresent && !addressPresent) score += w.contact_absent_penalty;

  const dayGap = daysSince(d.lastPaymentDate);
  if (dayGap !== null) {
    if (dayGap < 30) score += w.pay_last_lt30;
    else if (dayGap <= 90) score += w.pay_last_30_90;
  }
  const capital = normalizeNumberString(d.capitalOnDefault);
  const lastPay = normalizeNumberString(d.lastPaymentAmount);
  if (capital !== null && lastPay !== null) {
    const r = lastPay / (capital || 1);
    if (r >= 0.25) score += w.pay_amount_gte_25pct;
    else if (r >= 0.05) score += w.pay_amount_5_24pct;
  }

  if (capital !== null) {
    if (capital <= 5000) score += w.debt_cap_le_5k;
    else if (capital <= 50000) score += w.debt_cap_5k_50k;
  }
  const interest = normalizeNumberString(d.interestPortion) || 0;
  const legal = normalizeNumberString(d.legalFeePortion) || 0;
  const amount = normalizeNumberString(d.amount) || ((capital || 0) + interest + legal);
  if (amount && (interest + legal) > 0.5 * amount) score += w.debt_high_interest_fee_penalty;

  const ses = inferSES(d.streetLine1);
  if (ses === "Upmarket") score += w.ses_upmarket;
  else if (ses === "Mid-income") score += w.ses_mid;

  if ((d.occupation || "").match(/government|bank|accountant|teacher|nurse|engineer|technician|teller/i)) {
    score += w.stable_occupation;
  }

  const st = (d.previousAttorneyLegalStage || "").toLowerCase();
  if (!st) score += w.legal_none;
  else if (/(letter of demand|summons|judgment|warrant)/.test(st)) score += w.legal_inflight;
  else if (/(administration|sequestration|insolven)/.test(st)) score += w.legal_insolvency;

  let bucket: Bucket = "Low";
  if (score >= 70) bucket = "High";
  else if (score >= 40) bucket = "Medium";

  if (!phonePresent && !emailPresent && (addressPresent || workPresent)) bucket = "Trace Required";
  if (!phonePresent && !emailPresent && !workPresent && !addressPresent) bucket = "Trace Required";

  return { score, bucket, ses };
}
