export interface ParseOptions {
  decimal?: boolean;
  negative?: boolean;
}

const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

export const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export const shortDateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

export const fmt = (n: number) => number.format(n);

export const signed = (n: number) => `${n > 0 ? "+" : ""}${fmt(n)}`;

export const round2 = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;

export function parseNumber(
  text: string,
  { decimal, negative }: ParseOptions = {},
) {
  if (text.trim() === "") return 0;

  const n = Number(text.replace(",", "."));
  if (!Number.isFinite(n)) return Number.NaN;

  const value = decimal ? round2(n) : Math.floor(n);
  return negative ? value : Math.max(0, value);
}
