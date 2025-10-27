import { create } from "zustand";
import { DEFAULT_WEIGHTS, Weights, Debtor, computeScore } from "../lib/fnb/scoring";

export type ColumnMap = Partial<Record<keyof Debtor, string>>;

interface FNBState {
  rawRows: Record<string, any>[];
  rows: Debtor[];
  weights: Weights;
  columnMap: ColumnMap;
  setRawRows: (r: Record<string, any>[]) => void;
  setWeights: (w: Weights) => void;
  setColumnMap: (m: ColumnMap) => void;
  rescore: () => void;
}

const loadWeights = (): Weights => {
  try {
    const stored = localStorage.getItem("fnb_weights");
    return stored ? JSON.parse(stored) : DEFAULT_WEIGHTS;
  } catch {
    return DEFAULT_WEIGHTS;
  }
};

const loadColumnMap = (): ColumnMap => {
  try {
    const stored = localStorage.getItem("fnb_colmap");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const useFNBStore = create<FNBState>((set, get) => ({
  rawRows: [],
  rows: [],
  weights: loadWeights(),
  columnMap: loadColumnMap(),

  setRawRows: (raw) => {
    set({ rawRows: raw });
    get().rescore();
  },

  setWeights: (w) => {
    localStorage.setItem("fnb_weights", JSON.stringify(w));
    set({ weights: w });
    get().rescore();
  },

  setColumnMap: (m) => {
    localStorage.setItem("fnb_colmap", JSON.stringify(m));
    set({ columnMap: m });
    get().rescore();
  },

  rescore: () => {
    const { rawRows, columnMap, weights } = get();

    const mapRow = (r: Record<string, any>): Debtor => {
      const pick = (key: keyof Debtor) => columnMap[key] ? r[columnMap[key] as string] : undefined;

      const d: Debtor = {
        clientRef: pick("clientRef"),
        amount: pick("amount"),
        capitalOnDefault: pick("capitalOnDefault"),
        interestPortion: pick("interestPortion"),
        legalFeePortion: pick("legalFeePortion"),
        interestRate: pick("interestRate"),
        interestDate: pick("interestDate"),
        dateOfDefault: pick("dateOfDefault"),
        lastPaymentDate: pick("lastPaymentDate"),
        lastPaymentAmount: pick("lastPaymentAmount"),
        debtorFirstName: pick("debtorFirstName"),
        debtorSecondName: pick("debtorSecondName"),
        debtorSurname: pick("debtorSurname"),
        debtorID: pick("debtorID"),
        email1: pick("email1"),
        email2: pick("email2"),
        cell1: pick("cell1"),
        cell2: pick("cell2"),
        home1: pick("home1"),
        work1: pick("work1"),
        streetLine1: pick("streetLine1"),
        streetLine2: pick("streetLine2"),
        streetPostalCode: pick("streetPostalCode"),
        postalLine1: pick("postalLine1"),
        postalLine2: pick("postalLine2"),
        postalPostalCode: pick("postalPostalCode"),
        occupation: pick("occupation"),
        employer: pick("employer"),
        employerAddress: pick("employerAddress"),
        previousAttorneyLegalStage: pick("previousAttorneyLegalStage"),
      };

      const { score, bucket, ses } = computeScore(d, weights);
      d.__score__ = score;
      d.__bucket__ = bucket;
      d.__ses__ = ses;

      return d;
    };

    set({ rows: rawRows.map(mapRow) });
  },
}));
