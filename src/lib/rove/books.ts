export const BOOKS_AS_OF = "September 28, 2026";

export type PoliticalGift = {
  who: string;
  amount: number;
  date: string;
  why: string;
};

/** Add a row here when money is actually given. The books page totals this list. */
export const POLITICAL_GIFTS: PoliticalGift[] = [];

export const BOOKS = {
  /** Fares that reached drivers. Not a projection. */
  driverProceeds: 0,
  /** Wages and bonuses for everyone on payroll, including the c-suite. */
  employeePay: 0,
  /** The c-suite portion of employee pay. Also counted in employeePay. */
  cSuiteSalary: 0,
  nonprofitGifts: 0,
  /** What remains after the costs of running the company. Not a sum of the lines above. */
  profit: 0,
};

export function politicalTotal(gifts: PoliticalGift[] = POLITICAL_GIFTS): number {
  return gifts.reduce((sum, gift) => sum + gift.amount, 0);
}
