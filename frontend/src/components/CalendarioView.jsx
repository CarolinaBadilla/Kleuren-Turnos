import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import esES from 'date-fns/locale/es'
import axios from 'axios'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { 'es': esES }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

// Componente personalizado para mostrar cada evento
const CustomEvent = ({ event }) => {
  return (
    <div style={{ 
      padding: '2px', 
      height: '100%',
      overflow: 'hidden',
      fontSize: '12px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
        {event.resource.client_name}
      </div>
      <div style={{ fontSize: '9px', opacity: 0.9 }}>
        💅 {event.resource.service_type}
      </div>
      <div style={{ fontSize: '9px', opacity: 0.8 }}>
        👩 {event.resource.manicurista_nombre || event.resource.manicurista}
      </div>
    </div>
  )
}

// Tooltip al pasar el mouse
const CustomTooltip = ({ event }) => (
  <div style={{ 
    backgroundColor: 'white', 
    border: '1px solid #ccc', 
    borderRadius: '4px', 
    padding: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    fontSize: '12px',
    maxWidth: '250px'
  }}>
    <div><strong>Cliente:</strong> {event.resource.client_name}</div>
    <div><strong>Servicio:</strong> {event.resource.service_type}</div>
    <div><strong>Manicurista:</strong> {event.resource.manicurista_nombre || event.resource.manicurista}</div>
    <div><strong>Duración:</strong> {event.resource.duration} min</div>
    <div><strong>Estado:</strong> {event.resource.status}</div>
    <div><strong>Teléfono:</strong> {event.resource.phone || 'No registrado'}</div>
  </div>
)

function CalendarioView({ token, turnos, onEditTurno }) {
  const [eventos, setEventos] = useState([])

  useEffect(() => {
    const eventosCalendario = turnos.map(turno => {
      const fechaHora = new Date(`${turno.date}T${turno.time}`)
      const duracionMinutos = turno.duration || 60
      const fechaFin = new Date(fechaHora.getTime() + duracionMinutos * 60000)
      
      // Colores por estado
      let color = '#3788d8' // azul por defecto
      switch(turno.status) {
        case 'confirmado': color = '#10b981'; break // verde
        case 'pedido': color = '#f59e0b'; break // amarillo
        case 'ya atendido': color = '#6b7280'; break // gris
        case 'reprogramar': color = '#ec4899'; break // rosa
        case 'no disponible': color = '#ef4444'; break // rojo
        case 'feriado': color = '#f97316'; break // naranja
        default: color = '#3788d8'
      }
      
      return {
        id: turno.id,
        title: `${turno.client_name} - ${turno.service_type}`,
        start: fechaHora,
        end: fechaFin,
        resource: turno,
        color: color,
        status: turno.status
      }
    })
    setEventos(eventosCalendario)
  }, [turnos])

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        padding: '2px',
        fontSize: '11px',
        cursor: 'pointer',
        overflow: 'hidden'
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-8">
      <h3 className="text-lg font-semibold mb-4">📅 Calendario de Turnos</h3>
      
      {/* Leyenda de colores */}
      <div className="flex flex-wrap gap-4 mb-4 pb-3 border-b">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs">Confirmado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-xs">Pedido</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span className="text-xs">Ya atendido</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-pink-500"></div>
          <span className="text-xs">Reprogramar</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs">No disponible</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-xs">Feriado</span>
        </div>
      </div>
      
      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día"
          }}
          culture="es"
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => onEditTurno && onEditTurno(event.resource)}
          defaultView="week"
          views={['month', 'week', 'day']}
          components={{
            event: CustomEvent
          }}
        />
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        💡 Hacé clic en cualquier turno para editarlo
      </div>
    </div>
  )
}

export default CalendarioView