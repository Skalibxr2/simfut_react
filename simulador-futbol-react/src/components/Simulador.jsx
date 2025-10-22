import { useState, useEffect, useMemo, useRef } from "react";
import { CLIMAS, simulateMatch, clamp } from "../lib/engine.js";
import genericShield from "../assets/teams/_generic.png";

// Attack and defense ratings for teams
const TEAM_STATS = {
  "Colo-Colo": { attack: 2.2, defense: 1.2 },
  "Universidad de Chile": { attack: 1.1, defense: 1.05 },
  "Universidad Católica": { attack: 1.15, defense: 1.1 },
  "Cobresal": { attack: 1.0, defense: 1.0 },
  "Huachipato": { attack: 1.0, defense: 1.05 },
  "Coquimbo Unido": { attack: 1.0, defense: 1.0 },
  "Unión Española": { attack: 0.95, defense: 0.95 },
  "Audax Italiano": { attack: 1.0, defense: 1.0 },
  "O'Higgins": { attack: 0.9, defense: 0.95 },
  "Palestino": { attack: 0.95, defense: 0.9 }
};

const TEAMS = [
  "Colo-Colo",
  "Universidad de Chile",
  "Universidad Católica",
  "Cobresal",
  "Huachipato",
  "Coquimbo Unido",
  "Unión Española",
  "Audax Italiano",
  "O'Higgins",
  "Palestino"
];

// Import all team logos from assets
const teamLogoMap = import.meta.glob("../assets/teams/*.png", { eager: true, as: "url" });

// Slugify function to map team names to file names
function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/\u00f1/g, "n")
    .replace(/['’]/g, "")
    .replace(/&/g, "y")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function logoFor(team) {
  if (!team) return genericShield;
  const target = `${slugify(team)}.png`;
  const hit = Object.entries(teamLogoMap).find(([path]) => path.endsWith(`/teams/${target}`));
  return hit?.[1] ?? genericShield;
}

// Speed presets (ms per simulated minute)
const SPEED_PRESETS = {
  "4x": 150,
  "2x": 300,
  "1x": 600,
  "0.5x": 1200,
};

// Durations available (regulation time)
const DURATIONS = [60, 90];

// Determine period label (1T, 2T, ET1, ET2, FT)
function periodLabel(minNow, duration, hasET) {
  const mid = Math.floor(duration / 2);
  if (minNow < mid) return "1T";
  if (minNow < duration) return "2T";
  if (!hasET) return "FT";
  if (minNow < duration + 15) return "ET1";
  if (minNow < duration + 30) return "ET2";
  return "FT";
}

// Count goals in events list
function tallyScore(events, homeName, awayName) {
  let h = 0, a = 0;
  for (const ev of events) {
    const t = (ev.text || "").toLowerCase();
    if (!t.includes("gol")) continue;
    if (t.includes((homeName || "").toLowerCase()) || t.includes("local")) h++;
    else if (t.includes((awayName || "").toLowerCase()) || t.includes("visita") || t.includes("visitante")) a++;
  }
  return [h, a];
}

// Simulate a phase of a match and offset event minutes
function simulatePhase(baseForm, minutes, offset) {
  const sim = simulateMatch({ ...baseForm, minutes });
  const events = sim.events.map(e => ({ ...e, minute: e.minute + offset }));
  return { events, goalsHome: sim.goalsHome, goalsAway: sim.goalsAway };
}

// Simulate penalty shootout; returns events and winner
function simulatePenalties(home, away, startMinute) {
  const pHome = 0.75, pAway = 0.75;
  let h = 0, a = 0;
  const evs = [];
  const take = (team, p) => (Math.random() < p ? "convierte" : "falla");
  for (let i = 1; i <= 5; i++) {
    const resH = take(home, pHome);
    evs.push({ minute: startMinute, text: `Penal ${i} ${home}: ${resH}` });
    if (resH === "convierte") h++;
    const resA = take(away, pAway);
    evs.push({ minute: startMinute, text: `Penal ${i} ${away}: ${resA}` });
    if (resA === "convierte") a++;
  }
  let i = 6;
  while (h === a) {
    const resH = take(home, pHome);
    evs.push({ minute: startMinute, text: `Muerte súbita ${i} ${home}: ${resH}` });
    if (resH === "convierte") h++;
    const resA = take(away, pAway);
    evs.push({ minute: startMinute, text: `Muerte súbita ${i} ${away}: ${resA}` });
    if (resA === "convierte") a++;
    i++;
    if (i > 20) break;
  }
  const winner = h > a ? "home" : (a > h ? "away" : "tie");
  evs.push({ minute: startMinute, text: `Penales: ${home} ${h} - ${a} ${away} → Gana ${winner === "home" ? home : away}` });
  return { events: evs, winner };
}

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-600 mt-0.5">{error}</p> : null}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded-xl px-3 py-2 focus:outline-none focus:ring w-full"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

function ClimateSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded-xl px-3 py-2 focus:outline-none focus:ring w-full"
    >
      {CLIMAS.map((c) => (
        <option key={c.id} value={c.id}>{c.label}</option>
      ))}
    </select>
  );
}

function TeamBadge({ name }) {
  const src = logoFor(name);
  return (
    <div className="flex items-center gap-2">
      <img
        src={src}
        alt={name || "Escudo"}
        className="w-12 h-12 object-contain select-none"
        draggable={false}
      />
      <span className="hidden sm:inline text-sm font-medium">{name || "—"}</span>
    </div>
  );
}

export default function Simulador() {
  const [form, setForm] = useState({
    home: "",
    away: "",
    duration: 90,
    extraTime: false,
    penalties: false,
    climate: "normal",
    homeAttack: 1.1,
    homeDefense: 1.0,
    awayAttack: 1.0,
    awayDefense: 1.05,
  });
  const [errors, setErrors] = useState({});
  const [speedKey, setSpeedKey] = useState("2x");
  const [result, setResult] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [clock, setClock] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [totalMinutes, setTotalMinutes] = useState(form.duration);

  const timerRef = useRef(null);
  const nextEventIndexRef = useRef(0);

  // Update team stats when selection changes
  useEffect(() => {
    if (form.home && TEAM_STATS[form.home]) {
      setForm((prev) => ({
        ...prev,
        homeAttack: TEAM_STATS[form.home].attack,
        homeDefense: TEAM_STATS[form.home].defense,
      }));
    }
  }, [form.home]);

  useEffect(() => {
    if (form.away && TEAM_STATS[form.away]) {
      setForm((prev) => ({
        ...prev,
        awayAttack: TEAM_STATS[form.away].attack,
        awayDefense: TEAM_STATS[form.away].defense,
      }));
    }
  }, [form.away]);

  // Persist form state
  useEffect(() => {
    const raw = localStorage.getItem("sim-react-form");
    if (raw) setForm((prev) => ({ ...prev, ...JSON.parse(raw) }));
  }, []);
  useEffect(() => {
    localStorage.setItem("sim-react-form", JSON.stringify(form));
  }, [form]);

  const climateLabel = useMemo(() => {
    return CLIMAS.find((c) => c.id === form.climate)?.label ?? "Normal";
  }, [form.climate]);

  function validate() {
    const e = {};
    if (!form.home) e.home = "Debe seleccionar un equipo local.";
    if (!form.away) e.away = "Debe seleccionar un equipo visitante.";
    if (form.home && form.away && form.home === form.away) e.away = "Los equipos deben ser distintos.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function guardarResultado(payload) {
    const prev = JSON.parse(localStorage.getItem("sim-resultados") || "[]");
    const nuevo = {
      fecha: new Date().toISOString(),
      home: form.home,
      away: form.away,
      ...payload,
    };
    localStorage.setItem("sim-resultados", JSON.stringify([nuevo, ...prev].slice(0, 200)));
  }

  function startMatch() {
    if (!validate()) return;
    const base = { ...form };
    const T = form.duration;
    const sim1 = simulatePhase(base, T, 0);
    let eventsAll = [...sim1.events];
    let [h, a] = tallyScore(eventsAll, form.home, form.away);
    let finalMinutes = T;
    if (h === a && form.extraTime) {
      const simET = simulatePhase(base, 30, T);
      eventsAll = eventsAll.concat(simET.events);
      [h, a] = tallyScore(eventsAll, form.home, form.away);
      finalMinutes = T + 30;
    }
    if (h === a && form.penalties) {
      const pens = simulatePenalties(form.home, form.away, finalMinutes);
      eventsAll = eventsAll.concat(pens.events);
    }
    const payload = {
      events: eventsAll,
      lambdaHome: 0,
      lambdaAway: 0,
      climate: base.climate,
      minutes: finalMinutes,
    };
    setResult(payload);
    setLiveEvents([]);
    setClock(0);
    setFinished(false);
    nextEventIndexRef.current = 0;
    setTotalMinutes(finalMinutes);
    setRunning(true);
  }

  function stopClock() {
    setRunning(false);
  }

  function resumeClock() {
    if (result && !finished) setRunning(true);
  }

  function resetAll() {
    setRunning(false);
    setResult(null);
    setLiveEvents([]);
    setClock(0);
    setFinished(false);
    setTotalMinutes(form.duration);
  }

  useEffect(() => {
    if (!running) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setClock((m) => {
        const total = clamp(totalMinutes, 30, 120);
        const next = m + 1;
        if (result) {
          const evs = result.events;
          let idx = nextEventIndexRef.current;
          const toAdd = [];
          while (idx < evs.length && evs[idx].minute <= next) {
            toAdd.push(evs[idx]);
            idx++;
          }
          if (toAdd.length) {
            setLiveEvents((prev) => [...prev, ...toAdd]);
            nextEventIndexRef.current = idx;
          }
        }
        if (next >= total) {
          clearInterval(timerRef.current);
          setRunning(false);
          setFinished(true);
          if (result) {
            const [hLive, aLive] = tallyScore(result.events, form.home, form.away);
            guardarResultado({
              marcador: `${form.home} ${hLive} - ${aLive} ${form.away}`,
              events: result.events,
              climate: result.climate,
              minutes: total,
            });
          }
        }
        return next;
      });
    }, SPEED_PRESETS[speedKey] ?? 600);
    return () => clearInterval(timerRef.current);
  }, [running, result, totalMinutes, speedKey]);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-1 p-4 rounded-2xl bg-white shadow">
        <h2 className="font-semibold mb-4 text-lg">Configuración del partido</h2>
        <div className="flex flex-col gap-3">
          <Field label="Equipo local" error={errors.home}>
            <Select value={form.home} onChange={(v) => setForm({ ...form, home: v })} options={TEAMS} placeholder="— Selecciona un equipo —" />
          </Field>
          <Field label="Equipo visitante" error={errors.away}>
            <Select value={form.away} onChange={(v) => setForm({ ...form, away: v })} options={TEAMS} placeholder="— Selecciona un equipo —" />
          </Field>
          <Field label="Duración">
            <select
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              className="border rounded-xl px-3 py-2 focus:outline-none focus:ring w-full"
            >
              {DURATIONS.map((d) => <option key={d} value={d}>{d} minutos</option>)}
            </select>
          </Field>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.extraTime}
                onChange={(e) => setForm({ ...form, extraTime: e.target.checked })}
              />
              Alargue (si empatan)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.penalties}
                onChange={(e) => setForm({ ...form, penalties: e.target.checked })}
                disabled={!form.extraTime}
              />
              Penales si persiste el empate
            </label>
          </div>
          <Field label="Clima">
            <ClimateSelect value={form.climate} onChange={(v) => setForm({ ...form, climate: v })} />
          </Field>
          <Field label="Velocidad">
            <select
              value={speedKey}
              onChange={(e) => setSpeedKey(e.target.value)}
              className="border rounded-xl px-3 py-2 focus:outline-none focus:ring w-full"
            >
              {Object.keys(SPEED_PRESETS).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
          {(form.home || form.away) && (
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div className="border rounded-xl p-2">
                <div className="font-medium mb-1">{form.home || "Local"}</div>
                <div>Ataque: {form.homeAttack.toFixed(2)}</div>
                <div>Defensa: {form.homeDefense.toFixed(2)}</div>
              </div>
              <div className="border rounded-xl p-2">
                <div className="font-medium mb-1">{form.away || "Visita"}</div>
                <div>Ataque: {form.awayAttack.toFixed(2)}</div>
                <div>Defensa: {form.awayDefense.toFixed(2)}</div>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4 flex-wrap">
            {!result || finished ? (
              <button onClick={startMatch} className="px-4 py-2 rounded-2xl bg-black text-white">Simular (en vivo)</button>
            ) : running ? (
              <button onClick={stopClock} className="px-4 py-2 rounded-2xl border">Pausar</button>
            ) : (
              <button onClick={resumeClock} className="px-4 py-2 rounded-2xl bg-black text-white">Reanudar</button>
            )}
            {result && (
              <button
                onClick={() => {
                  setRunning(false);
                  setLiveEvents(result.events);
                  setClock(totalMinutes);
                  setFinished(true);
                }}
                className="px-4 py-2 rounded-2xl border"
              >
                Adelantar
              </button>
            )}
            <button onClick={resetAll} className="px-4 py-2 rounded-2xl border">Limpiar</button>
          </div>
        </div>
      </div>
      <div className="md:col-span-2 p-4 rounded-2xl bg-white shadow">
        <h2 className="font-semibold mb-4 text-lg">Resultado</h2>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <TeamBadge name={form.home} />
            <div className="text-center">
              <p className="text-sm uppercase tracking-wide text-gray-500">
                {(form.home || "Local").toUpperCase()} vs {(form.away || "Visita").toUpperCase()}
              </p>
              {(() => {
                let h = 0, a = 0;
                for (const ev of liveEvents) {
                  const t = (ev.text || "").toLowerCase();
                  if (!t.includes("gol")) continue;
                  if (t.includes((form.home || "").toLowerCase()) || t.includes("local")) h++;
                  else if (t.includes((form.away || "").toLowerCase()) || t.includes("visita") || t.includes("visitante")) a++;
                }
                return <p className="text-2xl font-bold">{result ? `${h} - ${a}` : "— : —"}</p>;
              })()}
            </div>
            <TeamBadge name={form.away} />
          </div>
          <div className="text-right">
            <div className="font-mono text-xl tabular-nums">
              Min {clock}' — {periodLabel(clock, form.duration, form.extraTime)}
            </div>
            {result && (
              <div className="text-xs text-gray-600">
                <p>λ L: {result.lambdaHome}</p>
                <p>λ V: {result.lambdaAway}</p>
                <p>Clima: {climateLabel}</p>
              </div>
            )}
          </div>
        </div>
        {!result ? (
          <p className="text-sm text-gray-600">
            Configura el partido y presiona <strong>Simular (en vivo)</strong>.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-medium mb-2">Eventos</h3>
              {liveEvents.length === 0 ? (
                <p className="text-sm text-gray-600">Esperando eventos…</p>
              ) : (
                <ol className="space-y-1 text-sm">
                  {liveEvents.map((ev, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="inline-block w-12 text-right tabular-nums">{ev.minute}'</span>
                      <span>{ev.text}</span>
                    </li>
                  ))}
                </ol>
              )}
              {finished && <p className="mt-3 text-sm text-gray-500">Partido finalizado.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
