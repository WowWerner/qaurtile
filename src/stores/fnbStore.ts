import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_WEIGHTS, Weights, Debtor, computeScore } from "../lib/fnb/scoring";

export type ColumnMap = Partial<Record<keyof Debtor, string>>;

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

export function useFNBStore() {
  const [rawRows, setRawRowsState] = useState<Record<string, any>[]>([]);
  const [rows, setRows] = useState<Debtor[]>([]);
  const [weights, setWeightsState] = useState<Weights>(loadWeights());
  const [columnMap, setColumnMapState] = useState<ColumnMap>(loadColumnMap());

  const rescore = useCallback(() => {
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

    setRows(rawRows.map(mapRow));
  }, [rawRows, columnMap, weights]);

  useEffect(() => {
    if (rawRows.length > 0) {
      rescore();
    }
  }, [rawRows, columnMap, weights, rescore]);

  const setRawRows = useCallback((raw: Record<string, any>[]) => {
    setRawRowsState(raw);
  }, []);

  const setWeights = useCallback((w: Weights) => {
    localStorage.setItem("fnb_weights", JSON.stringify(w));
    setWeightsState(w);
  }, []);

  const setColumnMap = useCallback((m: ColumnMap) => {
    localStorage.setItem("fnb_colmap", JSON.stringify(m));
    setColumnMapState(m);
  }, []);

  return {
    rawRows,
    rows,
    weights,
    columnMap,
    setRawRows,
    setWeights,
    setColumnMap,
    rescore,
  };
}
