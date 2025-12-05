// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Simular from './pages/Simular.jsx'
import Stats from './pages/Stats.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ProtectedRoute from './session/ProtectedRoute.jsx'
import Catalogos from './pages/Catalogos.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 container mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simular" element={<ProtectedRoute><Simular /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute roles={['ADMIN']}><Stats /></ProtectedRoute>} />
          <Route path="/catalogos" element={<ProtectedRoute roles={['ADMIN']}><Catalogos /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
