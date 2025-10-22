import { useState, useEffect, useMemo, useRef } from "react";
import { CLIMAS, simulateMatch, clamp } from "../lib/engine.js";
import genericShield from "../assets/teams/_generic.png";

// Attack and defense ratings for teams
const TEAM_STATS = {
  "Colo-Colo": { attack: 1.2, defense: 1.1 },
  "Universidad de Chile": { attack: 1.1, defense: 1.05 },
  "Universidad Católica": { attack: 1.15, defense: 1.1 },
  "Cobresal": { attack: 1.0, defense: 1.0 },
  "Huachipato": { attack: 1.0, defense: 1.05 },
  "Coquimbo Unido": { attack: 0.95, defense: 1.0 },
  "Unión Española": { attack: 1.05, defense: 0.95 },
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
  "Palestino",
];

// Import all team logos from assets
const teamLogoMap = import.meta.glob("../assets/teams/*.png", { eager: true, as: "url" });

// slugify function to map team names to file names
function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ñ/g, "n")
    .replace(/['’]/g, "")
    .replace(/&/g, "y")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// Return logo url for a team; fallback to generic shield
function logoFor(team) {
  if (!team) return genericShield;
  const target = `${slugify(team)}.png`;
  const entry = Object.entries(teamLogoMap).find(([path]) => path.endsWith(`/teams/${target}`));
  return entry?.[1] ?? genericShield;
}

// Reusable components for form
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
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

// Team badge with logo and name
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

// Main Simulador component with stats, logos and live events
export default function Simulador() {
  // Form state includes team selections and auto-filled stats
  const [form, setForm] = useState({
    home: "",
    away: "",
    minutes: 90,
    climate: "normal",
    homeAttack: 1.0,
    homeDefense: 1.0,
    awayAttack: 1.0,
    awayDefense: 1.0,
  });

  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [clock, setClock] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef(null);
  const nextEventIndexRef = useRef(0);

  const MS_PER_MIN = 600;

  // Read stored form on mount; persist on change
  useEffect(() => {
    const raw = localStorage.getItem("sim-react-form");
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        setForm((f) => ({ ...f, ...saved }));
      } catch { /* ignore */ }
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("sim-react-form", JSON.stringify(form));
  }, [form]);

  // Update attack/defense when home or away changes
  useEffect(() => {
    if (form.home && TEAM_STATS[form.home]) {
      const { attack, defense } = TEAM_STATS[form.home];
      setForm((prev) => ({
        ...prev,
        homeAttack: attack,
        homeDefense: defense,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        homeAttack: 1.0,
        homeDefense: 1.0,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.home]);
  useEffect(() => {
    if (form.away && TEAM_STATS[form.away]) {
      const { attack, defense } = TEAM_STATS[form.away];
      setForm((prev) => ({
        ...prev,
        awayAttack: attack,
        awayDefense: defense,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        awayAttack: 1.0,
        awayDefense: 1.0,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.away]);

  const climateLabel = useMemo(() => {
    const c = CLIMAS.find((c) => c.id === form.climate);
    return c ? c.label : "Normal";
  }, [form.climate]);

  function validate() {
    const e = {};
    if (!form.home) e.home = "Debe seleccionar un equipo local.";
    if (!form.away) e.away = "Debe seleccionar un equipo visitante.";
    if (form.home && form.away && form.home === form.away) {
      e.away = "Los equipos deben ser distintos.";
    }
    if (!Number.isFinite(form.minutes) || form.minutes < 30 || form.minutes > 120) {
      e.minutes = "Minutos entre 30 y 120.";
    }
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
    const sim = simulateMatch(form);
    setResult(sim);
    setLiveEvents([]);
    setClock(0);
    setFinished(false);
    nextEventIndexRef.current = 0;
    setRunning(true);
  }

  function stopClock() {
    setRunning(false);
  }

  function resumeClock() {
    if (result && !finished) {
      setRunning(true);
    }
  }

  function resetAll() {
    setRunning(false);
    clearInterval(timerRef.current);
    setResult(null);
    setLiveEvents([]);
    setClock(0);
    setFinished(false);
  }

  useEffect(() => {
    if (!running) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setClock((current) => {
        const total = clamp(form.minutes, 30, 120);
        const nextMinute = current + 1;
        if (result) {
          const events = result.events;
          let idx = nextEventIndexRef.current;
          const toAdd = [];
          while (idx < events.length && events[idx].minute <= nextMinute) {
            toAdd.push(events[idx]);
            idx++;
          }
          if (toAdd.length) {
            setLiveEvents((prev) => [...prev, ...toAdd]);
            nextEventIndexRef.current = idx;
          }
        }
        if (nextMinute >= total) {
          clearInterval(timerRef.current);
          setRunning(false);
          setFinished(true);
          if (result) {
            guardarResultado({
              marcador: `${form.home} ${result.goalsHome} - ${result.goalsAway} ${form.away}`,
              events: result.events,
              lambdaHome: result.lambdaHome,
              lambdaAway: result.lambdaAway,
              climate: result.climate,
              minutes: result.minutes,
            });
          }
        }
        return nextMinute;
      });
    }, MS_PER_MIN);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, result, form.minutes]);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* configuration panel */}
      <div className="md:col-span-1 p-4 rounded-2xl bg-white shadow">
        <h2 className="font-semibold mb-4 text-lg">Configuración del partido</h2>
        <div className="flex flex-col gap-3">
          <Field label="Equipo local" error={errors.home}>
            <Select
              value={form.home}
              onChange={(v) => setForm({ ...form, home: v })}
              options={TEAMS}
              placeholder="— Selecciona un equipo —"
            />
          </Field>
          <Field label="Equipo visitante" error={errors.away}>
            <Select
              value={form.away}
              onChange={(v) => setForm({ ...form, away: v })}
              options={TEAMS}
              placeholder="— Selecciona un equipo —"
            />
          </Field>
          <Field label={`Minutos (${form.minutes})`} error={errors.minutes}>
            <input
              type="range"
              min={30}
              max={120}
              step={5}
              value={form.minutes}
              onChange={(e) => setForm({ ...form, minutes: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
          <Field label="Clima">
            <ClimateSelect value={form.climate} onChange={(v) => setForm({ ...form, climate: v })} />
          </Field>
          {/* Stats display read-only */}
          <div className="grid grid-cols-2 gap-2 text-sm mt-4">
            <div className="border rounded-xl p-2">
              <h4 className="font-medium">{form.home || "Local"}</h4>
              <p>Ataque: {form.homeAttack.toFixed(2)}</p>
              <p>Defensa: {form.homeDefense.toFixed(2)}</p>
            </div>
            <div className="border rounded-xl p-2">
              <h4 className="font-medium">{form.away || "Visita"}</h4>
              <p>Ataque: {form.awayAttack.toFixed(2)}</p>
              <p>Defensa: {form.awayDefense.toFixed(2)}</p>
            </div>
          </div>
          {/* Buttons */}
          <div className="flex gap-2 mt-4">
            {!result || finished ? (
              <button
                onClick={startMatch}
                className="px-4 py-2 rounded-2xl bg-black text-white"
              >
                Simular (en vivo)
              </button>
            ) : running ? (
              <button onClick={stopClock} className="px-4 py-2 rounded-2xl border">
                Pausar
              </button>
            ) : (
              <button
                onClick={resumeClock}
                className="px-4 py-2 rounded-2xl bg-black text-white"
              >
                Reanudar
              </button>
            )}
            <button onClick={resetAll} className="px-4 py-2 rounded-2xl border">
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* result panel */}
      <div className="md:col-span-2 p-4 rounded-2xl bg-white shadow">
        <h2 className="font-semibold mb-4 text-lg">Resultado</h2>
        {/* Header with team badges and clock */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <TeamBadge name={form.home} />
            <div className="text-center">
              <p className="text-sm uppercase tracking-wide text-gray-500">
                {form.home || "Local"} vs {form.away || "Visita"}
              </p>
              <p className="text-2xl font-bold">
                {result ? `${result.goalsHome} - ${result.goalsAway}` : "— : —"}
              </p>
            </div>
            <TeamBadge name={form.away} />
          </div>
          <div className="text-right">
            <div className="font-mono text-xl tabular-nums">{clock}'</div>
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
                      <span className="inline-block w-10 text-right tabular-nums">
                        {ev.minute}'
                      </span>
                        <span>{ev.text}</span>
                    </li>
                  ))}
                </ol>
              )}
              {finished && (
                <p className="mt-3 text-sm text-gray-500">Partido finalizado.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
