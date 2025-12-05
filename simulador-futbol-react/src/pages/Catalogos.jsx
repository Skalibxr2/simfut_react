import { useEffect, useMemo, useState } from 'react'
import { createEquipo, createJugador, deleteEquipo, deleteJugador, fetchEquipos, fetchJugadores, updateEquipo, updateJugador } from '../api/index.js'
import { useSession } from '../session/SessionProvider.jsx'

function useAsyncResource(loader) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await loader()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar la información')
    } finally {
      setLoading(false)
    }
  }

  return { items, setItems, loading, error, load }
}

export default function Catalogos() {
  const { user } = useSession()
  const canManageCatalogos = user?.role === 'ADMIN'
  const equiposResource = useAsyncResource(() => fetchEquipos())
  const jugadoresResource = useAsyncResource(() => fetchJugadores())

  const [equipoForm, setEquipoForm] = useState({ nombre: '', ciudad: '' })
  const [jugadorForm, setJugadorForm] = useState({ nombre: '', posicion: 'DEL', numeroCamiseta: '', equipoId: '' })
  const [editingEquipoId, setEditingEquipoId] = useState(null)
  const [editingJugadorId, setEditingJugadorId] = useState(null)
  const [savingEquipo, setSavingEquipo] = useState(false)
  const [savingJugador, setSavingJugador] = useState(false)
  const [jugadorError, setJugadorError] = useState('')
  const [equipoError, setEquipoError] = useState('')

  useEffect(() => {
    equiposResource.load()
    jugadoresResource.load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const equipoOptions = useMemo(() => (
    equiposResource.items.map((eq) => ({ value: eq.id, label: eq.nombre }))
  ), [equiposResource.items])

  const resetEquipoForm = () => {
    setEquipoForm({ nombre: '', ciudad: '' })
    setEditingEquipoId(null)
  }

  const resetJugadorForm = () => {
    setJugadorForm({ nombre: '', posicion: 'DEL', numeroCamiseta: '', equipoId: '' })
    setEditingJugadorId(null)
  }

  const handleEquipoSubmit = async (event) => {
    event.preventDefault()
    if (!canManageCatalogos) {
      setEquipoError('No tienes permisos para gestionar equipos')
      return
    }
    setSavingEquipo(true)
    setEquipoError('')
    try {
      if (editingEquipoId) {
        const updated = await updateEquipo(editingEquipoId, equipoForm)
        equiposResource.setItems((prev) => prev.map((eq) => eq.id === editingEquipoId ? updated : eq))
      } else {
        const created = await createEquipo(equipoForm)
        equiposResource.setItems((prev) => [...prev, created])
      }
      resetEquipoForm()
    } catch (err) {
      setEquipoError(err.message || 'No se pudo guardar el equipo')
    } finally {
      setSavingEquipo(false)
    }
  }

  const handleJugadorSubmit = async (event) => {
    event.preventDefault()
    if (!canManageCatalogos) {
      setJugadorError('No tienes permisos para gestionar jugadores')
      return
    }
    setSavingJugador(true)
    setJugadorError('')
    try {
      const payload = {
        ...jugadorForm,
        numeroCamiseta: jugadorForm.numeroCamiseta ? Number(jugadorForm.numeroCamiseta) : null,
        equipoId: jugadorForm.equipoId || null,
      }
      if (editingJugadorId) {
        const updated = await updateJugador(editingJugadorId, payload)
        jugadoresResource.setItems((prev) => prev.map((j) => j.id === editingJugadorId ? updated : j))
      } else {
        const created = await createJugador(payload)
        jugadoresResource.setItems((prev) => [...prev, created])
      }
      resetJugadorForm()
    } catch (err) {
      setJugadorError(err.message || 'No se pudo guardar el jugador')
    } finally {
      setSavingJugador(false)
    }
  }

  const removeEquipo = async (id) => {
    if (!canManageCatalogos) {
      setEquipoError('No tienes permisos para gestionar equipos')
      return
    }
    setEquipoError('')
    try {
      await deleteEquipo(id)
      equiposResource.setItems((prev) => prev.filter((eq) => eq.id !== id))
    } catch (err) {
      setEquipoError(err.message || 'No se pudo eliminar el equipo')
    }
  }

  const removeJugador = async (id) => {
    if (!canManageCatalogos) {
      setJugadorError('No tienes permisos para gestionar jugadores')
      return
    }
    setJugadorError('')
    try {
      await deleteJugador(id)
      jugadoresResource.setItems((prev) => prev.filter((j) => j.id !== id))
    } catch (err) {
      setJugadorError(err.message || 'No se pudo eliminar el jugador')
    }
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-gray-500">Autenticado como {user?.username} ({user?.role})</p>
        <h1 className="text-3xl font-bold">Catálogos del simulador</h1>
        <p className="text-gray-600">Gestiona equipos y jugadores consumiendo el backend con estados de carga y errores.</p>
        {!canManageCatalogos && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Solo los administradores pueden modificar estos catálogos. Tu sesión actual no tiene permisos de edición.
          </p>
        )}
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <article className="bg-white rounded-2xl shadow p-5 border">
          <header className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase text-gray-500">Equipos</p>
              <h2 className="text-xl font-semibold">Gestión de equipos</h2>
            </div>
            {equiposResource.loading && <span className="text-sm text-blue-600">Cargando...</span>}
          </header>

          <form className="space-y-3" onSubmit={handleEquipoSubmit}>
            <div>
              <label className="block text-sm text-gray-700">Nombre</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={equipoForm.nombre}
                onChange={(e) => setEquipoForm({ ...equipoForm, nombre: e.target.value })}
                disabled={!canManageCatalogos}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Ciudad</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={equipoForm.ciudad}
                onChange={(e) => setEquipoForm({ ...equipoForm, ciudad: e.target.value })}
                disabled={!canManageCatalogos}
              />
            </div>
            {equipoError && <p className="text-sm text-red-600">{equipoError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!canManageCatalogos || savingEquipo}
              >
                {savingEquipo ? 'Guardando...' : editingEquipoId ? 'Actualizar equipo' : 'Crear equipo'}
              </button>
              {editingEquipoId && (
                <button type="button" onClick={resetEquipoForm} className="px-3 py-2 text-sm border rounded-lg">
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="mt-5 space-y-2">
            {equiposResource.error && <p className="text-sm text-red-600">{equiposResource.error}</p>}
            {equiposResource.items.map((eq) => (
              <div key={eq.id} className="border rounded-lg px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{eq.nombre}</p>
                  {eq.ciudad && <p className="text-sm text-gray-600">{eq.ciudad}</p>}
                </div>
                <div className="flex gap-2 text-sm">
                  <button
                    className="px-2 py-1 rounded bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!canManageCatalogos}
                    onClick={() => { setEditingEquipoId(eq.id); setEquipoForm({ nombre: eq.nombre || '', ciudad: eq.ciudad || '' }) }}
                  >
                    Editar
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-red-50 text-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!canManageCatalogos}
                    onClick={() => removeEquipo(eq.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            {!equiposResource.loading && equiposResource.items.length === 0 && (
              <p className="text-sm text-gray-500">No hay equipos cargados todavía.</p>
            )}
          </div>
        </article>

        <article className="bg-white rounded-2xl shadow p-5 border">
          <header className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase text-gray-500">Jugadores</p>
              <h2 className="text-xl font-semibold">Gestión de jugadores</h2>
            </div>
            {jugadoresResource.loading && <span className="text-sm text-blue-600">Cargando...</span>}
          </header>

          <form className="space-y-3" onSubmit={handleJugadorSubmit}>
            <div>
              <label className="block text-sm text-gray-700">Nombre</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={jugadorForm.nombre}
                onChange={(e) => setJugadorForm({ ...jugadorForm, nombre: e.target.value })}
                disabled={!canManageCatalogos}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Posición</label>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={jugadorForm.posicion}
                onChange={(e) => setJugadorForm({ ...jugadorForm, posicion: e.target.value })}
                disabled={!canManageCatalogos}
              >
                <option value="DEL">DEL</option>
                <option value="MED">MED</option>
                <option value="DEF">DEF</option>
                <option value="ARQ">ARQ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700">Número de camiseta</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                type="number"
                min="1"
                max="99"
                value={jugadorForm.numeroCamiseta}
                onChange={(e) => setJugadorForm({ ...jugadorForm, numeroCamiseta: e.target.value })}
                disabled={!canManageCatalogos}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Equipo</label>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={jugadorForm.equipoId}
                onChange={(e) => setJugadorForm({ ...jugadorForm, equipoId: e.target.value })}
                disabled={!canManageCatalogos}
              >
                <option value="">Sin equipo asignado</option>
                {equipoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {jugadorError && <p className="text-sm text-red-600">{jugadorError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!canManageCatalogos || savingJugador}
              >
                {savingJugador ? 'Guardando...' : editingJugadorId ? 'Actualizar jugador' : 'Crear jugador'}
              </button>
              {editingJugadorId && (
                <button type="button" onClick={resetJugadorForm} className="px-3 py-2 text-sm border rounded-lg">
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="mt-5 space-y-2">
            {jugadoresResource.error && <p className="text-sm text-red-600">{jugadoresResource.error}</p>}
            {jugadoresResource.items.map((jug) => {
              const teamLabel = equipoOptions.find((opt) => String(opt.value) === String(jug.equipoId))?.label
              return (
                <div key={jug.id} className="border rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{jug.nombre}</p>
                    <p className="text-sm text-gray-600">#{jug.numeroCamiseta} · {jug.posicion} {teamLabel ? `• ${teamLabel}` : ''}</p>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <button
                      className="px-2 py-1 rounded bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!canManageCatalogos}
                      onClick={() => {
                        setEditingJugadorId(jug.id)
                        setJugadorForm({
                          nombre: jug.nombre || '',
                          posicion: jug.posicion || 'DEL',
                          numeroCamiseta: jug.numeroCamiseta || '',
                          equipoId: jug.equipoId || '',
                        })
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-red-50 text-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!canManageCatalogos}
                      onClick={() => removeJugador(jug.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
            {!jugadoresResource.loading && jugadoresResource.items.length === 0 && (
              <p className="text-sm text-gray-500">No hay jugadores cargados todavía.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
