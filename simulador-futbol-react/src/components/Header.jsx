import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-slate-900 text-white">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl flex items-center gap-2">
          <span>⚽</span> <span>SimFútbol</span>
        </Link>

        {/* Botón hamburguesa (solo móvil) */}
        <button
          className="md:hidden rounded-lg px-2 py-1 ring-1 ring-white/20"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          ☰
        </button>

        {/* Links Desktop */}
        <ul className="hidden md:flex gap-6">
          <li><NavLink to="/" className="hover:text-blue-300">Inicio</NavLink></li>
          <li><NavLink to="/simular" className="hover:text-blue-300">Simular</NavLink></li>
          <li><NavLink to="/stats" className="hover:text-blue-300">Resultados</NavLink></li>
        </ul>
      </nav>

      {/* Menú desplegable móvil */}
      <div className={`md:hidden transition-[max-height] duration-300 overflow-hidden ${open ? 'max-h-40' : 'max-h-0'}`}>
        <ul className="px-4 pb-3 space-y-2 bg-slate-900/95 border-t border-white/10">
          <li><NavLink onClick={()=>setOpen(false)} to="/" className="block py-1">Inicio</NavLink></li>
          <li><NavLink onClick={()=>setOpen(false)} to="/simular" className="block py-1">Simular</NavLink></li>
          <li><NavLink onClick={()=>setOpen(false)} to="/stats" className="block py-1">Resultados</NavLink></li>
        </ul>
      </div>
    </header>
  )
}
