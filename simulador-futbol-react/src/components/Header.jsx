import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useSession } from '../session/SessionProvider.jsx'

export default function Header() {
    const [open, setOpen] = useState(false)
    const { isAuthenticated, user, logout } = useSession()

    const linkBase =
        "px-2 py-1 rounded-md transition focus:outline-none focus:ring-2 focus:ring-white/40"
    const linkClass = ({ isActive }) =>
        isActive
            // Estilo cuando la ruta está activa (seleccionada)
            ? `${linkBase} text-blue-300 bg-white/10`
            // Estilo normal + HOVER (resalta al pasar el mouse)
            : `${linkBase} text-white/90 hover:text-white hover:bg-white/10`

    return (
        <header className="bg-slate-900 text-white">
            <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                <Link to="/" className="font-bold text-xl flex items-center gap-2">
                    <span>⚽</span> <span>SimFútbol</span>
                </Link>

                {/* Botón hamburguesa (móvil) */}
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
                    <li><NavLink to="/" className={linkClass}>Inicio</NavLink></li>
                    <li><NavLink to="/simular" className={linkClass}>Simular</NavLink></li>
                    <li><NavLink to="/stats" className={linkClass}>Resultados</NavLink></li>
                    {!isAuthenticated && (
                        <li><NavLink to="/login" className={linkClass}>Entrar</NavLink></li>
                    )}
                    {isAuthenticated && (
                        <li className="flex items-center gap-2 text-white/80">
                            <span className="text-sm">{user?.username} ({user?.role})</span>
                            <button onClick={logout} className="text-sm px-2 py-1 bg-white/10 rounded hover:bg-white/20">Salir</button>
                        </li>
                    )}
                </ul>
            </nav>

            {/* Menú móvil */}
            <div className={`md:hidden transition-[max-height] duration-300 overflow-hidden ${open ? 'max-h-40' : 'max-h-0'}`}>
                <ul className="px-4 pb-3 space-y-2 bg-slate-900/95 border-t border-white/10">
                    <li><NavLink onClick={() => setOpen(false)} to="/" className={linkClass}>Inicio</NavLink></li>
                    <li><NavLink onClick={() => setOpen(false)} to="/simular" className={linkClass}>Simular</NavLink></li>
                    <li><NavLink onClick={() => setOpen(false)} to="/stats" className={linkClass}>Resultados</NavLink></li>
                    {!isAuthenticated && (
                        <li><NavLink onClick={() => setOpen(false)} to="/login" className={linkClass}>Entrar</NavLink></li>
                    )}
                    {isAuthenticated && (
                        <li className="flex items-center gap-2 text-white/80">
                            <span className="text-sm">{user?.username} ({user?.role})</span>
                            <button onClick={() => { logout(); setOpen(false) }} className="text-sm px-2 py-1 bg-white/10 rounded hover:bg-white/20">Salir</button>
                        </li>
                    )}
                </ul>
            </div>
        </header>
    )
}
