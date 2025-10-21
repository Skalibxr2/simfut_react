import { useEffect, useMemo, useRef, useState } from "react";
import { CLIMAS, simulateMatch, clamp } from "../lib/engine.js";

// Generic shield as Data URI (gray square)
const genericShield = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' fill='%23ddd'/%3E%3C/svg%3E";

// Stats per team: attack and defense values (read-only)
const TEAM_STATS = {
  "Colo-Colo": { attack: 1.2, defense: 1.1 },
  "Universidad de Chile": { attack: 1.15, defense: 1.05 },
  "Universidad Católica": { attack: 1.1, defense: 1.1 },
  "Cobresal": { attack: 1.05, defense: 1.0 },
  "Huachipato": { attack: 1.05, defense: 1.0 },
  "Coquimbo Unido": { attack: 1.0, defense: 1.0 },
  "Unión Española": { attack: 1.05, defense: 1.0 },
  "Audax Italiano": { attack: 1.0, defense: 1.0 },
  "O'Higgins": { attack: 0.95, defense: 0.95 },
  "Palestino": { attack: 1.0, defense: 1.0 },
};

// List of team names for the selects
const TEAMS = Object.keys(TEAM_STATS);

// Auto-import logos from assets/teams folder (slugified names)
const teamLogoMap = import.meta.glob("../assets/teams/*.png", {
  eager: true,
  as: "url",
});

// Helper to slugify team names to file names
function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/\u00f1/g, "n")
    .replace(/[\'’]/g, "")
    .replace(/&/g, "y")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// Return logo URL for a team or the generic shield
function logoFor(team) {
  if (!team) return genericShield;
  const target = `${slugify(team)}.png`;
  const hit = Object.entries(teamLogoMap).find(([path]) =>
    path.endsWith(`/teams/${target}`)
  );
  return hit?.[1] ?? genericShield;
}

// Generic form field wrapper
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-600 mt-0.5">{error}</p> : null}
    </div>
  );
}

// Generic select component
function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded-xl px-3 py-2 focus:outline-none focus:ring w-full"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

// Climate select
function ClimateSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded-xl px-3 py-2 focus:outline-none focus:ring w-full"
    >
      {CLIMAS.map((c) => (
        <option key={c.id} value={c.id}>
          {c.label}
        </option>
      ))}
    </select>
  );
}

// Component to display team shield + name
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
      <span className="hidden sm:inline text-sm font-medium">
        {name || "—"}
      </span>
    </div>
  );
}

export default function Simulador() {
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

  // Update stats when team selection changes
  useEffect(() => {
    const stats = TEAM_STATS[form.home];
    if (stats) {
      if (stats.attack !== form.homeAttack || stats.defense !== form.homeDefense) {
        setForm((f) => ({
          ...f,
          homeAttack: stats.attack,
          homeDefense: stats.defense,
        }));
      }
    }
  }, [form.home]);

  useEffect(() => {
    const stats = TEAM_STATS[form.away];
    if (stats) {
      if (stats.attack !== form.awayAttack || stats.defense !== form.awayDefense) {
        setForm((f) => ({
          ...f,
          awayAttack: stats.attack,
          awayDefense: stats.defense,
        }));
      }
    }
  }, [form.away]);

  // Load saved form
  useEffect(() => {
    const raw = localStorage.getItem("sim-react-form");
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        setForm((f) => ({ ...f, ...saved }));
      } catch (e) {
        /* ignore */
      }
    }
  }, []);

  // Save form state
  useEffect(() => {
    localStorage.setItem("sim-react-form", JSON.stringify(form));
  }, [form]);

  const climateLabel = useMemo(
    () => CLIMAS.find((c) => c.id === form.climate)?.label ?? "Normal",
    [form.climate]
  );

  function validate() {
    const e = {};
    if (!form.home) e.home = "Debe seleccionar un equipo local.";
    if (!form.away) e.away = "Debe seleccionar un equipo visitante.";
    if (form.home && form.away && form.home === form.away)
      e.away = "Los equipos deben ser distintos.";
    if (
      !Number.isFinite(Number(form.minutes)) ||
      form.minutes < 30 ||
      form.minutes > 120
    )
      e.minutes = "Minutos entre 30 y 120.";
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
    localStorage.setItem(
      "sim-resultados",
      JSON.stringify([nuevo, ...prev].slice(0, 200))
    );
  }

  // Start simulation
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
    if (result && !finished) setRunning(true);
  }
  function resetAll() {
    setRunning(false);
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
      setClock((m) => {
        const total = clamp(form.minutes, 30, 120);
        const next = m + 1;
        // Add events up to next minute
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
          // Save result
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
        return next;
      });
    }, MS_PER_MIN);
    return () => clearInterval(timerRef.current);
  }, [running, result, form.minutes]);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Config panel */}
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
              onChange={(e) =>
                setForm({ ...form, minutes: Number(e.target.value) })
              }
              className="w-full"
            />
          </Field>
          <Field label="Clima">
            <ClimateSelect
              value={form.climate}
              onChange={(v) => setForm({ ...form, climate: v })}
            />
          </Field>
          {/* Stats display */}
          <div className="grid grid-cols-2 gap-2 text-sm mt-4">
            <div className="border rounded-xl p-2">
              <h4 className="font-medium">
                {form.home || "Local"}
              </h4>
              <p>Ataque: {form.homeAttack.toFixed(2)}</p>
              <p>Defensa: {form.homeDefense.toFixed(2)}</p>
            </div>
            <div className="border rounded-xl p-2">
              <h4 className="font-medium">
                {form.away || "Visita"}
              </h4>
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
              <button
                onClick={stopClock}
                className="px-4 py-2 rounded-2xl border"
              >
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
            <button
              onClick={resetAll}
              className="px-4 py-2 rounded-2xl border"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
      {/* Result panel */}
      <div className="md:col-span-2 p-4 rounded-2xl bg-white shadow">
        <h2 className="font-semibold mb-4 text-lg">Resultado</h2>
        {/* Header with teams and clock */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <TeamBadge name={form.home} />
            <div className="text-center">
              <p className="text-sm uppercase tracking-wide text-gray-500">
                {form.home || "Local"} vs {form.away || "Visita"}
              </p>
              <p className="text-2xl font-bold">
                {result
                  ? `${result.goalsHome} - ${result.goalsAway}`
                  : "— : —"}
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
            Configura el partido y presiona{" "}
            <strong>Simular (en vivo)</strong>.
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
                <p className="mt-3 text-sm text-gray-500">
                  Partido finalizado.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
