import { useState, useEffect } from 'react'
import axios from 'axios'

function ManicuristaView({ token, userId }) {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)

  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  })

  const cargarTurnos = async () => {
    try {
      const response = await api.get('/appointments')
      setTurnos(response.data)
    } catch (error) {
      console.error('Error al cargar turnos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarTurnos()
  }, [])

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmado': return 'bg-green-100 text-green-800'
      case 'pedido': return 'bg-yellow-100 text-yellow-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'confirmado': return 'Confirmado'
      case 'pedido': return 'Pedido'
      case 'cancelado': return 'Cancelado'
      default: return status
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando tus turnos...</div>
  }

  if (turnos.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <p className="text-gray-500 text-lg">No tenés turnos asignados</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Mis Turnos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {turnos.map(turno => (
          <div key={turno.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{turno.client_name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(turno.status)}`}>
                {getStatusText(turno.status)}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
              <span className="font-medium">📅 Fecha y hora:</span>
              {turno.date.split('-').reverse().join('/')} {turno.time}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">💅 Servicio:</span>
                {turno.service_type}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">⏱️ Duración:</span>
                {turno.duration} minutos
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ManicuristaView