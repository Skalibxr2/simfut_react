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

// Lista de equipos
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
  const hit = Object.entries(teamLogoMap).find(([path]) =>
    path.endsWith(`/teams/${target}`),
  );
  return hit?.[1] ?? genericShield;
}

// --- Eventos fijos del partido (neutrales, centrados) ---
function addFixedMilestones({ events, duration, extraTime, penalties, finalMinutes }) {
  const mid = Math.floor(duration / 2);
  const out = events.slice();

  // Tiempo reglamentario
  const fixed = [
    { minute: 0, text: "Inicio del partido" },
    { minute: mid, text: "Fin del primer tiempo" },
    { minute: mid, text: "Entretiempo" },
    { minute: mid, text: "Inicio del segundo tiempo" },
  ];

  // Si hay alargue (ET)
  if (extraTime && finalMinutes > duration) {
    fixed.push(
      { minute: duration, text: "Fin del tiempo reglamentario" },
      { minute: duration, text: "Inicio del alargue (ET1)" },
      { minute: duration + 15, text: "Fin del ET1" },
      { minute: duration + 15, text: "Inicio del ET2" },
    );
  }

  // Si hay penales (solo cuando termina empatado)
  if (penalties && finalMinutes >= duration) {
    // Lo colocamos al minuto final; si no hubo ET, finalMinutes === duration
    fixed.push({ minute: finalMinutes, text: "Comienzan los penales" });
  }

  // Fin del partido (siempre)
  fixed.push({ minute: finalMinutes, text: "Fin del partido" });

  // Evitar duplicados exactos (mismo texto y minuto)
  const seen = new Set();
  for (const e of out) seen.add(`${e.minute}__${e.text}`);

  for (const f of fixed) {
    const key = `${f.minute}__${f.text}`;
    if (!seen.has(key)) out.push(f);
  }

  out.sort((a, b) => a.minute - b.minute);
  return out;
}



// Speed presets (ms per simulated minute)
const SPEED_PRESETS = {
  "4x": 50,
  "2x": 100,
  "1x": 200,
  "0.5x": 400,
};

// Durations available (regulation time)
const DURATIONS = [30, 60, 90];

// --- Clasificador de eventos (lado, tipo, icono) ---

function normalize(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/ñ/g, "n");
}

const K = {
  goal: ["gol", "anota", "marca"],
  yellow: ["amarilla"],
  red: ["roja", "expulsion", "expulsado"],
  injury: ["lesion", "lesionado", "sale por lesion"],
  start: ["inicio", "comienza", "arranca"],
  break: ["entretiempo", "descanso", "fin del primer tiempo", "termina el primer tiempo"],
  secondStart: ["inicio del segundo tiempo", "arranca el segundo tiempo"],
  end: ["final", "termina el partido", "fin del partido"],
  pen: ["penal"],
};

function detectType(t) {
  const text = normalize(t);
  const hit = (arr) => arr.some((w) => text.includes(w));
  if (hit(K.goal)) return "goal";
  if (hit(K.red)) return "red";
  if (hit(K.yellow)) return "yellow";
  if (hit(K.injury)) return "injury";
  if (hit(K.secondStart)) return "secondStart";
  if (hit(K.break)) return "break";
  if (hit(K.start)) return "start";
  if (hit(K.end)) return "end";
  if (hit(K.pen)) return "pen";
  return "other";
}

// iconos simples;
function iconFor(type) {
  switch (type) {
    case "goal": 
      return "⚽";
    case "yellow":   
      return "🟨";
    case "red":
      return "🟥";   
    case "injury":    
      return "🏥";
    case "pen":
      return "🧤";    
    case "start":    
      return "🟢";
      
      case "break":    
      return "⏸️";
    case "secondStart":    
      return "▶️";
    case "end":
      return "🏁";    
    default:
      return "•";
  }
}

/**
 * Determina a quién pertenece: 'home' | 'away' | 'neutral'
 * Reglas:
 *  - Si el texto trae el nombre del equipo (normalizado) → lado correspondiente
 *  - Palabras guía: 'local', 'visita/visitante'
 *  - Eventos estructurales (inicio/descanso/fin) → neutral
 */
function detectSide(text, homeName, awayName) {
  const t = normalize(text);
  const h = normalize(homeName);
  const a = normalize(awayName);

  const type = detectType(t);
  if (
    ["start", "break", "secondStart", "end"].includes(type)

  )
    return { side: "neutral", type };
  // nombre explícito
  if (h && t.includes(h)) return { side: "home", type };
  if (a && t.includes(a)) return { side: "away", type };

  if (t.includes("local")) return { side: "home", type };
  if (t.includes("visita") || t.includes("visitante"))

    return { side: "away", type };
  // si dice "gol" sin equipo, preferimos neutral para no confundir
  return { side: "neutral", type };
}

// --- Card helpers ---
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function clamp01(x) {
  // Determine period label (1T, 2T, ET1, ET2, FT)
  return Math.max(0, Math.min(1, x));
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/**
 * Generates disciplinary events (yellow/red cards) and merges them with existing events.
 */
function addDisciplinaryEvents({
  events,
  homeName,
  awayName,
  totalMinutes,
  basePer90 = 4.8,
  redRatio = 0.14,
  etMultiplier = 0.4,
  intensity = 1,
}) {
  const out = events.slice();
  if (!homeName || !awayName || totalMinutes <= 0) return out;
  const isET = totalMinutes > 90;
  const dur90 = Math.min(90, totalMinutes);
  const extraDur = Math.max(0, totalMinutes - dur90);
  const expectedYellows =
    basePer90 * (dur90 / 90) * intensity;
  const expectedYellowsET = isET
    ? basePer90 *
    etMultiplier *
    (extraDur / 30) *
    intensity
    : 0;
  const totalYellows = Math.max(
    0,
    Math.round(expectedYellows + expectedYellowsET),
  );
  const pDouble = clamp01(redRatio * 0.6);
  const pDirect = clamp01(redRatio * 0.4);
  let homeY = 0;
  let awayY = 0;
  for (let i = 0; i < totalYellows; i++) {
    if (Math.random() < 0.5) homeY++;
    else awayY++;
  }
  const randomMinutes = (count) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const m = randInt(
        1,
        Math.max(1, totalMinutes - 1),
      );
      arr.push(m);
    }
    return arr.sort((a, b) => a - b);
  };
  const homeMinutes = randomMinutes(homeY);
  const awayMinutes = randomMinutes(awayY);
  const mkPlayer = () => randInt(2, 11);
  const homeCards = homeMinutes.map((minute) => ({
    minute,
    type: "yellow",
    team: homeName,
    text: `Tarjeta amarilla para ${homeName} (Jugador ${mkPlayer()})`,
  }));
  const awayCards = awayMinutes.map((minute) => ({
    minute,
    type: "yellow",
    team: awayName,
    text: `Tarjeta amarilla para ${awayName} (Jugador ${mkPlayer()})`,
  }));
  function promoteToSecondYellow(cards, team) {
    const promoted = [];
    for (const c of cards) {
      if (Math.random() < pDouble) {
        const later =
          clamp01(Math.random()) * 0.6 + 0.2;
        const min2 = Math.min(
          totalMinutes - 1,
          Math.max(
            c.minute + 1,
            Math.round(totalMinutes * later),
          ),
        );
        promoted.push({
          minute: min2,
          type: "red",
          team,
          text: `Doble amarilla: ${team} (expulsado)`,
        });
      }
    }
    return promoted;
  }
  function directReds(team, countHint) {
    const reds = [];
    const tries = Math.max(
      0,
      Math.round(countHint * pDirect),
    );
    for (let i = 0; i < tries; i++) {
      reds.push({
        minute: randInt(
          1,
          Math.max(1, totalMinutes - 1),
        ),
        type: "red",
        team,
        text: `Tarjeta roja directa para ${team}`,
      });
    }
    return reds;
  }
  let cards = [...homeCards, ...awayCards];
  cards = cards.concat(
    promoteToSecondYellow(homeCards, homeName),
    promoteToSecondYellow(awayCards, awayName),
    directReds(homeName, homeCards.length),
    directReds(awayName, awayCards.length),
  );
  cards = shuffle(cards).sort((a, b) => a.minute - b.minute);
  const cardEvents = cards.map((c) => ({
    minute: c.minute,
    text: c.text,
  }));
  const merged = out
    .concat(cardEvents)
    .sort((a, b) => a.minute - b.minute);
  return merged;
}
// Helper functions for phases and penalties
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
  let h = 0,
    a = 0;
  for (const ev of events) {
    const t = (ev.text || "").toLowerCase();
    if (!t.includes("gol")) continue;
    if (
      t.includes(
        (homeName || "").toLowerCase(),
      ) ||
      t.includes("local")
    )
      h++;
    else if (
      t.includes(
        (awayName || "").toLowerCase(),
      ) ||
      t.includes("visita") ||
      t.includes("visitante")
    )
      a++;
  }
  return [h, a];
}


// Simulate a phase of a match and offset event minutes
function simulatePhase(baseForm, minutes, offset) {
  const sim = simulateMatch({
    ...baseForm,
    minutes,
  });
  const events = sim.events.map((e) => ({
    ...e,
    minute: e.minute + offset,
  }));
  return {
    events,
    goalsHome: sim.goalsHome,
    goalsAway: sim.goalsAway,
  };
}

// Simulate penalty shootout; returns events and winner
function simulatePenalties(
  home,
  away,
  startMinute,
) {
  const pHome = 0.75,
    pAway = 0.75;
  let h = 0,
    a = 0;
  const evs = [];
  const take = (team, p) =>
    Math.random() < p ? "convierte" : "falla";
  for (let i = 1; i <= 5; i++) {
    const resH = take(home, pHome);
    evs.push({
      minute: startMinute,
      text: `Penal ${i} ${home}: ${resH}`,
    });
    if (resH === "convierte") h++;
    const resA = take(away, pAway);
    evs.push({
      minute: startMinute,
      text: `Penal ${i} ${away}: ${resA}`,
    });
    if (resA === "convierte") a++;
  }
  let i = 6;
  while (h === a) {
    const resH = take(home, pHome);
    evs.push({
      minute: startMinute,
      text: `Muerte súbita ${i} ${home}: ${resH}`,
    });
    if (resH === "convierte") h++;
    const resA = take(away, pAway);
    evs.push({
      minute: startMinute,
      text: `Muerte súbita ${i} ${away}: ${resA}`,
    });
    if (resA === "convierte") a++;
    i++;
    if (i > 20) break;
  }
  const winner =
    h > a ? "home" : a > h ? "away" : "tie";
  evs.push({
    minute: startMinute,
    text: `Penales: ${home} ${h} - ${a} ${away} → Gana ${winner === "home" ? home : away
      }`,
  });
  return { events: evs, winner };
}

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600 mt-0.5">
          {error}
        </p>
      ) : null}
    </div>
  );
}


function ClimateSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}

      className="border rounded-xl px-3 py-2 focus:outline-none focus:ring w-full"
      disabled={disabled}
      
    >
      {CLIMAS.map((c) => (
        <option key={c.id} value={c.id}>
          {c.label}
        </option>
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
      <span className="hidden sm:inline text-sm font-medium">
        {name || "—"}
      </span>
    </div>
  );
}


// Alto fijo para alinear filas aunque un lado esté vacío
const ROW_HEIGHT = 50; // px, ajusta si quieres más compacto

function EventTimeline({ events, homeName, awayName, autoScroll = true }) {
  // Convertimos a filas en el orden exacto recibido
  const rows = useMemo(() => {
    return events.map((ev) => {
      const { side, type } = detectSide(ev.text, homeName, awayName);
      return { ...ev, side, type };
    });
  }, [events, homeName, awayName]);

  // contenedor con scroll y autoscroll al llegar nuevos eventos
  const wrapRef = useRef(null);
  useEffect(() => {
    if (!autoScroll || !wrapRef.current) return;
    wrapRef.current.scrollTop = wrapRef.current.scrollHeight;
  }, [rows.length, autoScroll]);

  return (
    <div
      ref={wrapRef}
      className="max-h-80 overflow-auto pr-2"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Header opcional de columnas */}
      <div className="grid grid-cols-5 text-xs text-gray-500 mb-2">
        <div className="col-span-2">
          {homeName || "Local"}
        </div>
        <div className="col-span-1 flex justify-center">
          —
        </div>
        <div className="col-span-2 text-right">
          {awayName || "Visitante"}
        </div>
      </div>

      {/* Filas */}
      <div className="grid grid-cols-5 gap-y-2">
        {rows.map((row, i) => {
          if (row.side === "neutral") {
            return (
              <div key={`n-${i}`} className="col-span-5">
                <EventNeutral minute={row.minute} text={row.text} type={row.type} />
              </div>
            );
          }

          // Fila “simétrica”: home | línea | away
          return (
            <div key={`r-${i}`} className="contents">
              {/* Home (2 cols) */}
              <div className="col-span-2">
                {row.side === "home" ? (
                  <EventBubble
                    minute={row.minute}
                    text={row.text}
                    type={row.type}
                    align="left"
                  />
                ) : (
                  // placeholder para que la fila mantenga altura
                  <div style={{ height: ROW_HEIGHT }} />
                )}
              </div>

              {/* Línea central */}
              <div className="col-span-1 flex justify-center">
                <div className="w-0.5 bg-gray-200" style={{ height: ROW_HEIGHT }} />
              </div>

              {/* Away (2 cols) */}
              <div className="col-span-2">
                {row.side === "away" ? (
                  <EventBubble
                    minute={row.minute}
                    text={row.text}
                    type={row.type}
                    align="right"
                  />
                ) : (
                  <div style={{ height: ROW_HEIGHT }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventBubble({ minute, text, type, align }) {
  const base =
    "rounded-2xl px-3 py-2 text-sm shadow border bg-white max-w-[95%]";
  const sideCls = align === "right" ? "ml-auto text-right" : "mr-auto text-left";
  return (
    <div className={`${base} ${sideCls}`} style={{ minHeight: ROW_HEIGHT - 12 }}>
      <div className="flex items-center gap-2">
        <span className="shrink-0">{iconFor(type)}</span>
        <p className="break-words">{text}</p>
      </div>
      <div className="text-xs text-gray-500 mt-1 tabular-nums">{minute}'</div>
    </div>
  );
}

function EventNeutral({ minute, text, type }) {
  return (
    <div
      className="mx-auto bg-gray-50 border text-gray-700 rounded-xl px-3 py-1 text-sm w-fit"
      style={{ minHeight: ROW_HEIGHT - 16 }}
    >
      <span className="mr-2">{iconFor(type)}</span>
      <span>{text}</span>
      <span className="ml-2 text-xs text-gray-500 tabular-nums">{minute}'</span>
    </div>
  );
}





export default function Simulador() {

  // snapshot de la config usada al iniciar el partido
  const [configSnap, setConfigSnap] = useState(null);

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
  const [speedKey, setSpeedKey] = useState("1x");
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
      home:
        configSnap?.homeName ?? form.home,
      away:
        configSnap?.awayName ?? form.away,
      ...payload,
    };
    localStorage.setItem(
      "sim-resultados",
      JSON.stringify(
        [nuevo, ...prev].slice(0, 200),
      ),
    );
  }

  // limpiar vista para una nueva simulación
  function resetMatchView(nextDuration = form.duration) {
    setRunning(false);
    setFinished(false);
    setResult(null);
    setLiveEvents([]);
    setClock(0);
    setTotalMinutes(nextDuration);
    nextEventIndexRef.current = 0;
    setConfigSnap(null);
  }

  // cambios de equipo solo cuando NO está corriendo
  function onTeamChange(side, value) {
    if (running) return;    // ignorar si corre
    resetMatchView();       // limpiar si estaba finalizado/pausado
    setForm(prev => ({ ...prev, [side]: value }));
  }

  function startMatch() {
    if (!validate()) return;

    // Congelar config en snapshot
    setConfigSnap({
      homeName: form.home,
      awayName: form.away,
      duration: form.duration,
      extraTime: form.extraTime,
      penalties: form.penalties,
    });

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

    // penales
    if (h === a && form.penalties) {
      const pens = simulatePenalties(form.home, form.away, finalMinutes);
      eventsAll = eventsAll.concat(pens.events);
    }

    eventsAll = addFixedMilestones({
    events: eventsAll,
    duration: T,
    extraTime: form.extraTime,
    penalties: form.penalties,
    finalMinutes,
  });

  // tarjetas
  eventsAll = addDisciplinaryEvents({
    events: eventsAll,
    homeName: form.home,
    awayName: form.away,
    totalMinutes: finalMinutes,
    basePer90: 4.8,
    redRatio: 0.14,
    etMultiplier: 0.4,
    intensity: 1,
  });

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
    setConfigSnap(null);
    nextEventIndexRef.current = 0;
  }
		
  // timer effect
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
            const [hLive, aLive] = tallyScore(
              result.events,
              configSnap?.homeName ??
                form.home,
              configSnap?.awayName ??
                form.away,
            );
             guardarResultado({
              marcador: `${configSnap?.homeName ??
                form.home} ${hLive} - ${aLive} ${configSnap?.awayName ??
                form.away}`,
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

  /*const snap = {
    homeName: form.home,
    awayName: form.away,
    duration: form.duration,
    extraTime: form.extraTime,
    penalties: form.penalties,
  };*/

  //setConfigSnap(snap);

  const homeName =
    configSnap?.homeName || form.home;
  const awayName =
    configSnap?.awayName || form.away;


 return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-1 p-4 rounded-2xl bg-white shadow">
        <h2 className="font-semibold mb-4 text-lg">
          Configuración del partido
        </h2>
        <div className="flex flex-col gap-3">
          {/* Equipo local */}
          <Field label="Equipo local">
            <select
              value={form.home}
              onChange={(e) =>
                onTeamChange(
                  "home",
                  e.target.value,
                )
              }
              disabled={running}
              className="border rounded-xl px-3 py-2 focus:outline-none focus:ring w-full"
            >
              <option value="">
                — Selecciona —
              </option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          {/* Equipo visitante */}
          <Field label="Equipo visitante">
            <select
              value={form.away}
              onChange={(e) =>
                onTeamChange(
                  "away",
                  e.target.value,
                )
              }
              disabled={running}
              className="border rounded-xl px-3 py-2 focus:outline-none focus:ring w-full"
            >
              <option value="">
                — Selecciona —
              </option>
              {TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          {/* Duración */}
          <Field label="Duración">
            <select
              value={form.duration}
              onChange={(e) => {
                if (running) return;
                const next = Number(
                  e.target.value,
                );
                resetMatchView(next);
                setForm((prev) => ({
                  ...prev,
                  duration: next,
                }));
              }}
              disabled={running}
              className="border rounded-xl px-3 py-2 focus:outline-none focus:ring w-full"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} minutos
                </option>
              ))}
            </select>
          </Field>

          {/* Alargue / Penales */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.extraTime}
                onChange={(e) => {
                  if (running) return;
                  const v =
                    e.target.checked;
                  setForm((prev) => ({
                    ...prev,
                    extraTime: v,
                    penalties: v
                      ? prev.penalties
                      : false,
                  }));
                  resetMatchView();
                }}
                disabled={running}
              />
              Alargue (si empatan)
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.penalties}
                onChange={(e) => {
                  if (running) return;
                  setForm((prev) => ({
                    ...prev,
                    penalties:
                      e.target.checked,
                  }));
                  resetMatchView();
                }}
                disabled={
                  !form.extraTime || running
                }
              />
              Penales si persiste el empate
            </label>
          </div>

          {/* Clima */}
          <Field label="Clima">
            <ClimateSelect
              value={form.climate}
              onChange={(v) => {
                if (running) return;
                setForm({
                  ...form,
                  climate: v,
                });
              }}
              disabled={running}
            />
          </Field>

          {/* Velocidad */}
          <Field label="Velocidad">
            <select
              disabled={running}
              value={speedKey}
              onChange={(e) =>
                setSpeedKey(
                  e.target.value,
                )
              }
              className="border rounded-xl px-3 py-2 focus:outline-none focus:ring w-full"
            >
              {Object.keys(
                SPEED_PRESETS,
              ).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>

          {/* Stats solo lectura */}
          {(form.home ||
            form.away) && (
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div className="border rounded-xl p-2">
                <div className="font-medium mb-1">
                  {form.home || "Local"}
                </div>
                <div>
                  Ataque:{" "}
                  {form.homeAttack.toFixed(2)}
                </div>
                <div>
                  Defensa:{" "}
                  {form.homeDefense.toFixed(2)}
                </div>
              </div>
              <div className="border rounded-xl p-2">
                <div className="font-medium mb-1">
                  {form.away || "Visita"}
                </div>
                <div>
                  Ataque:{" "}
                  {form.awayAttack.toFixed(2)}
                </div>
                <div>
                  Defensa:{" "}
                  {form.awayDefense.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4 flex-wrap">
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
            {result && (
              <button
                onClick={() => {
                  setRunning(false);
                  setLiveEvents(
                    result.events,
                  );
                  setClock(totalMinutes);
                  setFinished(true);
                }}
                className="px-4 py-2 rounded-2xl border"
              >
                Adelantar
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
      <div className="md:col-span-2 p-4 rounded-2xl bg-white shadow">
        <h2 className="font-semibold mb-4 text-lg">
          Resultado
        </h2>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <TeamBadge name={homeName} />
            <div className="text-center">
              <p className="text-sm uppercase tracking-wide text-gray-500">
                {(
                  homeName ||
                  "Local"
                ).toUpperCase()}{" "}
                vs{" "}
                {(
                  awayName ||
                  "Visita"
                ).toUpperCase()}
              </p>
              {(() => {
                let hScore = 0,
                  aScore = 0;
                for (const ev of liveEvents) {
                  const t =
                    (ev.text || "").toLowerCase();
                  if (!t.includes("gol"))
                    continue;
                  if (
                    t.includes(
                      (homeName || "").toLowerCase(),
                    ) ||
                    t.includes("local")
                  )
                    hScore++;
                  else if (
                    t.includes(
                      (awayName || "").toLowerCase(),
                    ) ||
                    t.includes("visita") ||
                    t.includes("visitante")
                  )
                    aScore++;
                }
                return (
                  <p className="text-2xl font-bold">
                    {result
                      ? `${hScore} - ${aScore}`
                      : "— : —"}
                  </p>
                );
              })()}
            </div>
            <TeamBadge name={awayName} />
          </div>
          <div className="text-right">
            <div className="font-mono text-xl tabular-nums">
              Min {clock}'
              {" — "}
              {periodLabel(
                clock,
                form.duration,
                form.extraTime,
              )}
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
            Configura el partido y presiona{" "}
            <strong>Simular</strong>.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-medium mb-2">
                Eventos
              </h3>
              {liveEvents.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Esperando eventos…
                </p>
              ) : (
                <EventTimeline
                  events={liveEvents}
                  homeName={homeName}
                  awayName={awayName}
                />
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
