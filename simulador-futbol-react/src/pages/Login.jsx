import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSession } from '../session/SessionProvider.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useSession()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form)
      navigate('/simular')
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-md mx-auto bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm text-gray-700">Usuario</span>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="mt-1 w-full border rounded-lg px-3 py-2"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-700">Contraseña</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="mt-1 w-full border rounded-lg px-3 py-2"
            required
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Ingresando...' : 'Entrar'}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        ¿No tienes cuenta? <Link to="/register" className="text-blue-600">Regístrate</Link>
      </p>
    </section>
  )
}
