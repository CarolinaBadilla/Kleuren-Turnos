import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './components/Login'
import SecretariaView from './components/SecretariaView'
import ManicuristaView from './components/ManicuristaView'

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogin = (userData, tokenData) => {
    setUser(userData)
    setToken(tokenData)
    localStorage.setItem('token', tokenData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-pink-50">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Sistema de Turnos</h1>
            <div className="flex items-center gap-4">
              <img 
        src="./public/kleuren-logo.png" 
        alt="Logo" 
        className="h-10 w-auto"
      />
              <span className="text-gray-600">
                {user.full_name} ({user.role === 'secretaria' ? 'Secretaria' : 'Manicurista'})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </nav>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          {user.role === 'secretaria' ? (
            <SecretariaView token={token} />
          ) : (
            <ManicuristaView token={token} userId={user.id} />
          )}
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App