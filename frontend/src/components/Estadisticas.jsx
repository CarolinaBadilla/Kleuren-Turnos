import { useState, useEffect } from 'react'
import axios from 'axios'

function Estadisticas({ token }) {
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: { Authorization: `Bearer ${token}` }
  })

  const cargarEstadisticas = async () => {
    setLoading(true)
    try {
      let url = '/appointments/estadisticas'
      if (fechaInicio && fechaFin) {
        url += `?inicio=${fechaInicio}&fin=${fechaFin}`
      }
      const response = await api.get(url)
      setEstadisticas(response.data)
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
      alert('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const aplicarFiltro = (e) => {
    e.preventDefault()
    cargarEstadisticas()
  }

  const limpiarFiltro = () => {
    setFechaInicio('')
    setFechaFin('')
    setTimeout(() => cargarEstadisticas(), 100)
  }

  if (loading) {
    return <div className="text-center py-8">Cargando estadísticas...</div>
  }

  if (!estadisticas) {
    return <div className="text-center py-8">No hay datos disponibles</div>
  }

  // Agrupar datos por manicurista
  const datosPorManicurista = {}
  estadisticas.porManicurista.forEach(item => {
    if (!datosPorManicurista[item.manicurista]) {
      datosPorManicurista[item.manicurista] = {}
    }
    datosPorManicurista[item.manicurista][item.service_type] = item.cantidad
  })

  // Lista de todos los tipos de servicio
  const todosServicios = [...new Set(estadisticas.porManicurista.map(item => item.service_type))].sort()

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">📊 Estadísticas de Servicios</h3>
      
      {/* Filtro por fechas */}
      <form onSubmit={aplicarFiltro} className="mb-6 p-4 bg-gray-50 rounded flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="border rounded p-2"
          />
        </div>
        <button
          type="submit"
          className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
        >
          Filtrar
        </button>
        <button
          type="button"
          onClick={limpiarFiltro}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Limpiar
        </button>
      </form>
      
      {/* Tabla por manicurista */}
      <div className="overflow-x-auto mb-8">
        <h4 className="font-medium mb-2">📋 Servicios por Manicurista</h4>
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left border">Manicurista</th>
              {todosServicios.map(servicio => (
                <th key={servicio} className="px-3 py-2 text-left border">{servicio}</th>
              ))}
              <th className="px-3 py-2 text-left border font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(datosPorManicurista).map(manicurista => {
              const totalManicurista = estadisticas.totalesPorManicurista.find(
                t => t.manicurista === manicurista
              )?.total || 0
              
              return (
                <tr key={manicurista} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border font-medium">{manicurista}</td>
                  {todosServicios.map(servicio => (
                    <td key={servicio} className="px-3 py-2 border text-center">
                      {datosPorManicurista[manicurista][servicio] || '-'}
                    </td>
                  ))}
                  <td className="px-3 py-2 border text-center font-bold">
                    {totalManicurista}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-3 py-2 border font-bold">TOTALES</td>
              {todosServicios.map(servicio => {
                const totalServicio = estadisticas.totalesPorServicio.find(
                  t => t.service_type === servicio
                )?.total || 0
                return (
                  <td key={servicio} className="px-3 py-2 border text-center font-bold">
                    {totalServicio}
                  </td>
                )
              })}
              <td className="px-3 py-2 border text-center font-bold">
                {estadisticas.granTotal}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Resumen rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-pink-50 rounded p-3 text-center">
          <div className="text-2xl font-bold text-pink-600">{estadisticas.granTotal}</div>
          <div className="text-sm text-gray-600">Total servicios</div>
        </div>
        {estadisticas.totalesPorManicurista.map(m => (
          <div key={m.manicurista} className="bg-gray-50 rounded p-3 text-center">
            <div className="text-xl font-bold text-gray-700">{m.total}</div>
            <div className="text-sm text-gray-600">{m.manicurista}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Estadisticas