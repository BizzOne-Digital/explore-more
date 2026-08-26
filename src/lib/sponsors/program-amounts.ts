/** Suggested sponsorship tiers in cents for program checkout UI. */
export function buildSuggestedAmounts(sponsorshipAmount?: number): number[] {
  const base =
    sponsorshipAmount && sponsorshipAmount > 0 ? Math.round(sponsorshipAmount * 100) : 2500;
  const amounts = [base, base * 2, base * 4, base * 10].filter(
    (v, i, arr) => v >= 100 && arr.indexOf(v) === i
  );
  return amounts.length ? amounts : [2500, 5000, 10000, 25000];
}
