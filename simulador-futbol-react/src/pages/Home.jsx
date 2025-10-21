import { Link } from 'react-router-dom'
import estadio from '../assets/img/estadio.jpg'   // 👈 importa la imagen

export default function Home() {
  return (
    <section className="relative">
      {/* Capa 1: Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${estadio})` }}     // 👈 usa el import
        aria-hidden
      />

      {/* Capa 2: Overlay negro */}
      <div className="absolute inset-0 z-10 bg-black/60" aria-hidden />

      {/* Capa 3: Contenido */}
      <div className="relative z-20 mx-auto max-w-6xl px-4 py-16 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
          Simula partidos de fútbol en segundos
        </h1>
        <p className="text-white/90 max-w-2xl mx-auto mb-8">
          Define equipos, condiciones y obtén eventos y marcador. Guarda el historial y compártelo.
        </p>
        <Link
          to="/simular"
          className="inline-block mt-2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:bg-blue-700 active:scale-95 transition !opacity-100"
        >
          Comenzar simulación
        </Link>
      </div>

      {/* Tarjetas */}
      <div className="relative z-20 mx-auto max-w-6xl px-4 -mt-6 pb-10">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { t: "Simula tus partidos", d: "Selecciona equipos, minutos, clima y ratings." },
            { t: "Crear Liga (pronto)", d: "Gestión de fixture, tabla y simulaciones múltiples." },
            { t: "Más equipos", d: "Agregaremos nuevos equipos seleccionables." },
          ].map((c, i) => (
            <article key={i} className="bg-white rounded-2xl shadow p-5">
              <h2 className="font-semibold text-lg mb-2">{c.t}</h2>
              <p className="text-gray-600">{c.d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
