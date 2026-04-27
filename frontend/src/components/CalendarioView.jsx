import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import esES from 'date-fns/locale/es'
import axios from 'axios'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'es': esES,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

function CalendarioView({ token, turnos, onEditTurno }) {
  const [eventos, setEventos] = useState([])

  useEffect(() => {
    // Convertir turnos a eventos del calendario
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
        padding: '2px 4px',
        fontSize: '12px'
      }
    }
  }

  const handleSelectEvent = (event) => {
    if (onEditTurno) {
      onEditTurno(event.resource)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-8">
      <h3 className="text-lg font-semibold mb-4">📅 Calendario de Turnos</h3>
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
          onSelectEvent={handleSelectEvent}
          defaultView="week"
          views={['month', 'week', 'day']}
        />
      </div>
    </div>
  )
}

export default CalendarioView