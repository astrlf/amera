export function ticks(min: number, max: number, minStep: number) {
  const raw = (max - min || 1) / 3;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;

  const step = Math.max(
    minStep,
    (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow,
  );

  const lo = Math.floor(min / step);
  const hi = Math.max(Math.ceil(max / step), lo + 1);

  return Array.from({ length: hi - lo + 1 }, (_, i) =>
    Number(((lo + i) * step).toFixed(10)),
  );
}
