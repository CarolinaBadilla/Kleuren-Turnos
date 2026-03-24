import { useState, useEffect } from 'react'
import axios from 'axios'
import Estadisticas from './Estadisticas'

function SecretariaView({ token }) {
  const [turnos, setTurnos] = useState([])
  const [manicuristas, setManicuristas] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    client_name: '',
    phone: '',
    dni: '',
    service_type: 'Semipermanente',
    manicurist_id: '',
    is_reserved: false,
    duration: 60,
    date: '',
    time: '',
    status: 'pedido',
    comment: ''
  })

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const api = axios.create({
    baseURL: `${apiUrl}/api`,
    headers: { Authorization: `Bearer ${token}` }
  })

  const cargarTurnos = async () => {
    try {
      const response = await api.get('/appointments')
      setTurnos(response.data)
    } catch (error) {
      console.error('Error al cargar turnos:', error)
    }
  }

  const cargarManicuristas = async () => {
    try {
      const response = await api.get('/appointments/manicuristas')
      setManicuristas(response.data)
    } catch (error) {
      console.error('Error al cargar manicuristas:', error)
    }
  }

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true)
      await Promise.all([cargarTurnos(), cargarManicuristas()])
      setLoading(false)
    }
    cargarDatos()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/appointments/${editingId}`, formData)
      } else {
        await api.post('/appointments', formData)
      }
      resetForm()
      cargarTurnos()
    } catch (error) {
      console.error('Error al guardar turno:', error)
      alert('Error al guardar el turno')
    }
  }

  const handleEdit = (turno) => {
    setEditingId(turno.id)
    setFormData({
      client_name: turno.client_name,
      phone: turno.phone,
      dni: turno.dni,
      service_type: turno.service_type,
      manicurist_id: turno.manicurist_id,
      is_reserved: turno.is_reserved === 1,
      duration: turno.duration,
      date: turno.date,
      time: turno.time,
      status: turno.status,
      comment: turno.comment || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (confirm('¿Estás segura de eliminar este turno?')) {
      try {
        await api.delete(`/appointments/${id}`)
        cargarTurnos()
      } catch (error) {
        console.error('Error al eliminar turno:', error)
        alert('Error al eliminar el turno')
      }
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      client_name: '',
      phone: '',
      dni: '',
      service_type: 'Semipermanente',
      manicurist_id: '',
      is_reserved: false,
      duration: 60,
      date: '',
      time: '',
      status: 'pedido',
      comment: ''
    })
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmado': return 'bg-green-100 text-green-800'
      case 'pedido': return 'bg-yellow-100 text-yellow-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gestión de Turnos</h2>
      
      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? 'Editar Turno' : 'Nuevo Turno'}
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la clienta *
            </label>
            <input
              type="text"
              placeholder="Ej: María González"
              value={formData.client_name}
              onChange={(e) => setFormData({...formData, client_name: e.target.value})}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              placeholder="Ej: 11 1234-5678"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DNI *
            </label>
            <input
              type="text"
              placeholder="Ej: 12.345.678"
              value={formData.dni}
              onChange={(e) => setFormData({...formData, dni: e.target.value})}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de servicio *
            </label>
            <select
              value={formData.service_type}
              onChange={(e) => setFormData({...formData, service_type: e.target.value})}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-pink-500">
              <option value="Semipermanente">Semipermanente</option>
              <option value="Capping">Capping</option>
              <option value="Esculpidas">Esculpidas</option>
              <option value="Belleza de manos">Belleza de manos</option>
              <option value="Belleza de pies">Belleza de pies</option>
              <option value="Pies + semipermanente">Pies + semipermanente</option>
              <option value="Cejas">Cejas</option>
              <option value="Depilación">Depilación</option>
              <option value="Retiro">Retiro</option>
              <option value="Feriado">Feriado</option>
              <option value="No disponible">No disponible</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manicurista *
            </label>
            <select
              value={formData.manicurist_id}
              onChange={(e) => setFormData({...formData, manicurist_id: parseInt(e.target.value)})}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-pink-500"
              required
            >
              <option value="">Seleccionar manicurista</option>
              {manicuristas.map(m => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_reserved}
                onChange={(e) => setFormData({...formData, is_reserved: e.target.checked})}
                className="w-4 h-4 text-pink-500 focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-700">Señado (pagó seña)</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración (minutos) *
            </label>
            <input
              type="number"
              placeholder="Ej: 60"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora *
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado del turno *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-pink-500"
            >
              <option value="pedido">Pedido (esperando confirmación)</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentarios (opcional)
            </label>
            <textarea
              placeholder="Ej: Cliente prefiere horario temprano, trae su propio esmalte..."
              value={formData.comment}
              onChange={(e) => setFormData({...formData, comment: e.target.value})}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-pink-500"
              rows="3"
            />
          </div>
          
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600 transition"
            >
              {editingId ? 'Actualizar Turno' : 'Guardar Turno'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Estadísticas */}
      <Estadisticas token={token} />
      
      {/* Lista de turnos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Fecha/Hora</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Teléfono</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Servicio</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Manicurista</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Seña</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {turnos.map(turno => (
                <tr key={turno.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {turno.date.split('-').reverse().join('/')} {turno.time}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{turno.client_name}</td>
                  <td className="px-4 py-3 text-sm">{turno.phone}</td>
                  <td className="px-4 py-3 text-sm">{turno.service_type}</td>
                  <td className="px-4 py-3 text-sm">{turno.manicurista_nombre}</td>
                  <td className="px-4 py-3 text-sm">
                    {turno.is_reserved ? '✓' : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(turno.status)}`}>
                      {turno.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(turno)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(turno.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {turnos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay turnos registrados
          </div>
        )}
      </div>
    </div>
  )
}

export default SecretariaView