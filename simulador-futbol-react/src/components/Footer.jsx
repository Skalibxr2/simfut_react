import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600 mt-8">
      <p>© 2025 SimFútbol</p>
      <div className="mt-2 flex justify-center gap-4">
        <Link className="text-blue-600 hover:underline" to="/stats">Ver resultados</Link>
        <Link className="text-blue-600 hover:underline" to="/simular">Nueva simulación</Link>
      </div>
    </footer>
  )
}
