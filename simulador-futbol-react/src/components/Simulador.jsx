// src/components/Simulador.jsx
import { useEffect, useMemo, useState } from "react";
import { CLIMAS, simulateMatch } from "../lib/Engine.js";

const TEAMS = [
  "Colo-Colo","Universidad de Chile","Universidad Católica","Cobresal",
  "Huachipato","Coquimbo Unido","Unión Española","Audax Italiano","O'Higgins","Palestino",
];

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

export default function Simulador() {
  const [form, setForm] = useState({
    home: "",
    away: "",
    minutes: 90,
    climate: "normal",
    homeAttack: 1.1, homeDefense: 1.0,
    awayAttack: 1.0, awayDefense: 1.05,
  });
  const [errors, setErrors] = useState({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  // Restaurar última config
  useEffect(() => {
    const raw = localStorage.getItem("sim-react-form");
    if (raw) setForm((f) => ({ ...f, ...JSON.parse(raw) }));
  }, []);
  // Guardar config
  useEffect(() => {
    localStorage.setItem("sim-react-form", JSON.stringify(form));
  }, [form]);

  const climateLabel = useMemo(
    () => CLIMAS.find(c => c.id === form.climate)?.label ?? "Normal",
    [form.climate]
  );

  function validate() {
    const e = {};
    if (!form.home) e.home = "Debe seleccionar un equipo local.";
    if (!form.away) e.away = "Debe seleccionar un equipo visitante.";
    if (form.home && form.away && form.home === form.away) e.away = "Los equipos deben ser distintos.";
    if (!Number.isFinite(Number(form.minutes)) || form.minutes < 30 || form.minutes > 120)
      e.minutes = "Minutos entre 30 y 120.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function guardarResultado(payload) {
    const prev = JSON.parse(localStorage.getItem("sim-resultados") || "[]");
    const nuevo = {
      fecha: new Date().toISOString(),
      home: form.home, away: form.away,
      ...payload,
    };
    localStorage.setItem("sim-resultados", JSON.stringify([nuevo, ...prev].slice(0, 200)));
  }

  function simulate() {
    if (!validate()) return;
    setRunning(true);
    const sim = simulateMatch(form);
    setResult(sim);
    guardarResultado({
      marcador: `${form.home} ${sim.goalsHome} - ${sim.goalsAway} ${form.away}`,
      events: sim.events,
      lambdaHome: sim.lambdaHome, lambdaAway: sim.lambdaAway,
      climate: sim.climate, minutes: sim.minutes,
    });
    setRunning(false);
  }

  function resetAll() { setResult(null); }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Panel izquierdo: configuración */}
      <div className="md:col-span-1 p-4 rounded-2xl bg-white shadow">
        <h2 className="font-semibold mb-4 text-lg">Configuración del partido</h2>

        <div className="flex flex-col gap-3">
          <Field label="Equipo local" error={errors.home}>
            <Select value={form.home} onChange={(v)=>setForm({...form, home: v})}
              options={TEAMS} placeholder="— Selecciona un equipo —" />
          </Field>

          <Field label="Equipo visitante" error={errors.away}>
            <Select value={form.away} onChange={(v)=>setForm({...form, away: v})}
              options={TEAMS} placeholder="— Selecciona un equipo —" />
          </Field>

          <Field label={`Minutos (${form.minutes})`} error={errors.minutes}>
            <input type="range" min={30} max={120} step={5}
              value={form.minutes}
              onChange={(e)=>setForm({...form, minutes: Number(e.target.value)})}
              className="w-full" />
          </Field>

          <Field label="Clima">
            <ClimateSelect value={form.climate} onChange={(v)=>setForm({...form, climate: v})} />
          </Field>

          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-gray-700">Avanzado: ratings (0.5–1.5)</summary>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <label className="flex items-center gap-2">Atk L
                <input type="number" step="0.01" min="0.5" max="1.5"
                  value={form.homeAttack}
                  onChange={(e)=>setForm({...form, homeAttack: Number(e.target.value)})}
                  className="border rounded px-2 py-1 w-full" />
              </label>
              <label className="flex items-center gap-2">Def L
                <input type="number" step="0.01" min="0.5" max="1.5"
                  value={form.homeDefense}
                  onChange={(e)=>setForm({...form, homeDefense: Number(e.target.value)})}
                  className="border rounded px-2 py-1 w-full" />
              </label>
              <label className="flex items-center gap-2">Atk V
                <input type="number" step="0.01" min="0.5" max="1.5"
                  value={form.awayAttack}
                  onChange={(e)=>setForm({...form, awayAttack: Number(e.target.value)})}
                  className="border rounded px-2 py-1 w-full" />
              </label>
              <label className="flex items-center gap-2">Def V
                <input type="number" step="0.01" min="0.5" max="1.5"
                  value={form.awayDefense}
                  onChange={(e)=>setForm({...form, awayDefense: Number(e.target.value)})}
                  className="border rounded px-2 py-1 w-full" />
              </label>
            </div>
          </details>

          <div className="flex gap-2 mt-4">
            <button onClick={simulate} disabled={running}
              className="px-4 py-2 rounded-2xl bg-black text-white disabled:opacity-60">
              {running ? "Simulando…" : "Simular"}
            </button>
            <button onClick={resetAll} className="px-4 py-2 rounded-2xl border">Limpiar</button>
          </div>
        </div>
      </div>

      {/* Panel derecho: resultado */}
      <div className="md:col-span-2 p-4 rounded-2xl bg-white shadow">
        <h2 className="font-semibold mb-4 text-lg">Resultado</h2>
        {!result ? (
          <p className="text-sm text-gray-600">Configura el partido y presiona <strong>Simular</strong>.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500">{form.home} vs {form.away}</p>
                <p className="text-2xl font-bold">{result.score}</p>
              </div>
              <div className="text-xs text-gray-600">
                <p>λ Local: {result.lambdaHome}</p>
                <p>λ Visita: {result.lambdaAway}</p>
                <p>Clima: {climateLabel}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Eventos</h3>
              {result.events.length === 0 ? (
                <p className="text-sm text-gray-600">Sin eventos registrados.</p>
              ) : (
                <ol className="space-y-1 text-sm">
                  {result.events.map((ev, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="inline-block w-10 text-right tabular-nums">{ev.minute}'</span>
                      <span>{ev.text}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
