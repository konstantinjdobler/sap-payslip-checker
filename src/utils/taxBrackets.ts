export const FED: TaxBracket[] = [
  { start: 0, end: 9525, rate: 0.1 },
  { start: 9525, end: 38700, rate: 0.12 },
  { start: 38700, end: 82500, rate: 0.22 },
];
export const CA: TaxBracket[] = [
  { start: 0, end: 8544, rate: 0.01 },
  { start: 8544, end: 20255, rate: 0.02 },
  { start: 20255, end: 31969, rate: 0.04 },
  { start: 31969, end: 44377, rate: 0.06 },
];

export type TaxBracket = {
  start: number;
  end: number;
  rate: number;
};
