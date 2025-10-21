// src/pages/Stats.jsx
import { useEffect, useState } from 'react';

export default function Stats() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('sim-resultados') || '[]');
    setItems(data);
  }, []);

  function limpiar() {
    localStorage.removeItem('sim-resultados');
    setItems([]);
  }

  return (
    <section className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Resultados</h1>
        <button onClick={limpiar} className="text-sm px-3 py-2 rounded-lg border">
          Limpiar historial
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-600">Aún no hay resultados guardados.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r, i) => (
            <li key={i} className="p-4 rounded-xl border bg-white">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{r.marcador}</p>
                <time className="text-xs text-gray-500">
                  {new Date(r.fecha).toLocaleString()}
                </time>
              </div>
              <p className="text-sm text-gray-600">{r.home} vs {r.away} • {r.minutes}'</p>

              {r.events?.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">Ver eventos</summary>
                  <ul className="mt-1 text-sm list-disc ml-5">
                    {r.events.map((e, j) => (
                      <li key={j}>{e.minute}' — {e.text}</li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
