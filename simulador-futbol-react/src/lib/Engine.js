
export const CLIMAS = [
  { id: "normal", label: "Normal", factor: 1.0 },
  { id: "lluvia", label: "Lluvia", factor: 0.9 },
  { id: "viento", label: "Viento", factor: 0.95 },
  { id: "calor", label: "Calor", factor: 0.92 },
];

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Poisson (Knuth)
export function poisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

export function expectedGoals({ minutes }, attack, defense, climateFactor) {
  const base = 1.3; // g/equipo por partido (ajustable)
  const minutesFactor = clamp(minutes, 30, 120) / 90;
  return base * (attack / defense) * minutesFactor * climateFactor;
}

export function randomMinute(totalMinutes) {
  return Math.floor(Math.random() * totalMinutes) + 1;
}

export function simulateMatch(form) {
  const climate = CLIMAS.find(c => c.id === form.climate) ?? CLIMAS[0];
  const totalMinutes = clamp(form.minutes, 30, 120);

  const lambdaHome = expectedGoals(form, form.homeAttack, form.awayDefense, climate.factor);
  const lambdaAway = expectedGoals(form, form.awayAttack, form.homeDefense, climate.factor);

  const goalsHome = poisson(lambdaHome);
  const goalsAway = poisson(lambdaAway);

  const events = [];
  for (let i = 0; i < goalsHome; i++)
    events.push({ minute: randomMinute(totalMinutes), text: `⚽ Gol de ${form.home}` });
  for (let i = 0; i < goalsAway; i++)
    events.push({ minute: randomMinute(totalMinutes), text: `⚽ Gol de ${form.away}` });

  events.sort((a, b) => a.minute - b.minute);

  return {
    goalsHome,
    goalsAway,
    score: `${goalsHome} - ${goalsAway}`,
    climate: climate.id,
    lambdaHome: +lambdaHome.toFixed(2),
    lambdaAway: +lambdaAway.toFixed(2),
    events,
    minutes: totalMinutes,
  };
}
