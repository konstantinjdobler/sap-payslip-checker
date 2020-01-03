const federal2019: TaxBracket[] = [
  { start: 0, end: 9525, rate: 0.1 },
  { start: 9525, end: 38700, rate: 0.12 },
  { start: 38700, end: 82500, rate: 0.22 },
];

const federal2020: TaxBracket[] = [
  { start: 0, end: 9875, rate: 0.1 },
  { start: 9875, end: 40125, rate: 0.12 },
  { start: 40125, end: 85525, rate: 0.22 },
];
const CA: TaxBracket[] = [
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

export function federalTaxBrackets(year: number) {
  switch (year) {
    case 2019:
      return federal2019;
    case 2020:
      return federal2020;
    default:
      throw Error(`No tax brackets for year ${year}`);
  }
}

export function californiaTaxBrackets(year: number) {
  switch (year) {
    case 2019:
      return CA;
    case 2020:
      return CA;
    default:
      throw Error(`No tax brackets for year ${year}`);
  }
}
