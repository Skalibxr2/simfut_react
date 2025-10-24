

export function periodLabel(minNow, duration, hasET) {
  const mid = Math.floor(duration / 2);
  if (minNow < mid) return "1T";
  if (minNow < duration) return "2T";
  if (!hasET) return "FT";
  if (minNow < duration + 15) return "ET1";
  if (minNow < duration + 30) return "ET2";
  return "FT";
}
