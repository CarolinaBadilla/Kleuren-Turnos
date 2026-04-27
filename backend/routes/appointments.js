import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.use(authenticateToken);

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

// Función para verificar superposición de turnos (corregida)
async function verificarSuperposicion(db, manicurist_id, date, time, duration, excludeId = null) {
  const inicio = new Date(`${date}T${time}`);
  const fin = new Date(inicio.getTime() + duration * 60000);
  
  let query = `
    SELECT a.*
    FROM appointments a
    WHERE a.manicurist_id = $1 
    AND a.date = $2
    AND a.status NOT IN ('cancelado', 'no disponible', 'feriado')
  `;
  let params = [manicurist_id, date];
  
  if (excludeId) {
    query += ` AND a.id != $3`;
    params.push(excludeId);
  }
  
  const existing = await db.query(query, params);
  
  for (const turno of existing.rows) {
    const turnoInicio = new Date(`${turno.date}T${turno.time}`);
    const turnoFin = new Date(turnoInicio.getTime() + turno.duration * 60000);
    
    if ((inicio < turnoFin && fin > turnoInicio)) {
      return { conflicto: true, turnoExistente: turno };
    }
  }
  
  return { conflicto: false };
}

// Funciones auxiliares para obtener datos actuales
async function getManicuristId(db, id) {
  const result = await db.query('SELECT manicurist_id FROM appointments WHERE id = $1', [id]);
  return result.rows[0]?.manicurist_id;
}

async function getAppointmentDate(db, id) {
  const result = await db.query('SELECT date FROM appointments WHERE id = $1', [id]);
  return result.rows[0]?.date;
}

async function getAppointmentTime(db, id) {
  const result = await db.query('SELECT time FROM appointments WHERE id = $1', [id]);
  return result.rows[0]?.time;
}

async function getAppointmentDuration(db, id) {
  const result = await db.query('SELECT duration FROM appointments WHERE id = $1', [id]);
  return result.rows[0]?.duration;
}

// ============================================================
// Obtener turnos
// ============================================================
router.get('/', async (req, res) => {
  const db = getDb();
  const user = req.user;

  try {
    let result;
    
    if (user.role === 'secretaria') {
      result = await db.query(`
        SELECT a.*, u.full_name as manicurista_nombre 
        FROM appointments a
        JOIN users u ON a.manicurist_id = u.id
        ORDER BY a.date ASC, a.time ASC
      `);
    } else {
      result = await db.query(`
        SELECT 
          a.id,
          a.client_name,
          a.service_type,
          a.duration,
          a.date,
          a.time,
          a.status,
          u.full_name as manicurista_nombre
        FROM appointments a
        JOIN users u ON a.manicurist_id = u.id
        WHERE a.manicurist_id = $1
        ORDER BY a.date ASC, a.time ASC
      `, [user.id]);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
});

// ============================================================
// Crear turno - CON VALIDACIÓN DE SUPERPOSICIÓN
// ============================================================
router.post('/',
  requireRole('secretaria'),
  [
    body('client_name').notEmpty().withMessage('Nombre requerido'),
    body('phone').notEmpty().withMessage('Teléfono requerido'),
    body('dni').notEmpty().withMessage('DNI requerido'),
    body('service_type').isIn(['Semipermanente', 'Capping', 'Esculpidas', 'Belleza de manos', 'Belleza de pies', 'Pies + semipermanente', 'Cejas', 'Depilación', 'Retiro', 'Feriado', 'No disponible']),
    body('manicurist_id').isInt(),
    body('duration').isInt({ min: 15 }),
    body('date').matches(/^\d{4}-\d{2}-\d{2}$/),
    body('time').matches(/^\d{2}:\d{2}$/),
    body('status').isIn(['confirmado', 'pedido', 'próximo', 'no disponible', 'feriado', 'reprogramar', 'ya atendido'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const {
      client_name,
      phone,
      dni,
      service_type,
      manicurist_id,
      is_reserved,
      duration,
      date,
      time,
      status,
      comment
    } = req.body;

    try {
      // VALIDACIÓN DE SUPERPOSICIÓN
      const superposicion = await verificarSuperposicion(db, manicurist_id, date, time, duration);
      if (superposicion.conflicto) {
        return res.status(409).json({ 
          error: 'La manicurista ya tiene un turno en ese horario',
          turnoConflicto: {
            id: superposicion.turnoExistente.id,
            client_name: superposicion.turnoExistente.client_name,
            time: superposicion.turnoExistente.time,
            duration: superposicion.turnoExistente.duration
          }
        });
      }

      const result = await db.query(
        `INSERT INTO appointments (
          client_name, phone, dni, service_type, manicurist_id, 
          is_reserved, duration, date, time, status, comment
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          client_name, phone, dni, service_type, manicurist_id,
          is_reserved ? 1 : 0, duration, date, time, status, comment || null
        ]
      );
      
      res.status(201).json({ id: result.rows[0].id, message: 'Turno creado' });
    } catch (error) {
      console.error('Error al crear turno:', error);
      res.status(500).json({ error: 'Error al crear turno' });
    }
  }
);

// ============================================================
// Editar turno - CON VALIDACIÓN DE SUPERPOSICIÓN
// ============================================================
router.put('/:id',
  requireRole('secretaria'),
  [
    body('client_name').optional().notEmpty(),
    body('phone').optional().notEmpty(),
    body('dni').optional().notEmpty(),
    body('service_type').optional().isIn(['Semipermanente', 'Capping', 'Esculpidas', 'Belleza de manos', 'Belleza de pies', 'Pies + semipermanente', 'Cejas', 'Depilación', 'Retiro', 'Feriado', 'No disponible']),
    body('manicurist_id').optional().isInt(),
    body('duration').optional().isInt({ min: 15 }),
    body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    body('time').optional().matches(/^\d{2}:\d{2}$/),
    body('status').optional().isIn(['confirmado', 'pedido', 'próximo', 'no disponible', 'feriado', 'reprogramar', 'ya atendido'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { id } = req.params;
    const updates = req.body;

    try {
      const currentManicuristId = updates.manicurist_id || await getManicuristId(db, id);
      const currentDate = updates.date || await getAppointmentDate(db, id);
      const currentTime = updates.time || await getAppointmentTime(db, id);
      const currentDuration = updates.duration || await getAppointmentDuration(db, id);

      const superposicion = await verificarSuperposicion(db, currentManicuristId, currentDate, currentTime, currentDuration, id);
      
      if (superposicion.conflicto) {
        return res.status(409).json({ 
          error: 'La manicurista ya tiene un turno en ese horario',
          turnoConflicto: {
            id: superposicion.turnoExistente.id,
            client_name: superposicion.turnoExistente.client_name,
            time: superposicion.turnoExistente.time,
            duration: superposicion.turnoExistente.duration
          }
        });
      }

      const fields = [];
      const values = [];
      let paramIndex = 1;
      
      const allowedFields = ['client_name', 'phone', 'dni', 'service_type', 'manicurist_id', 'is_reserved', 'duration', 'date', 'time', 'status', 'comment'];
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = $${paramIndex}`);
          if (key === 'is_reserved') {
            values.push(value ? 1 : 0);
          } else {
            values.push(value);
          }
          paramIndex++;
        }
      }
      
      if (fields.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }
      
      values.push(id);
      await db.query(`UPDATE appointments SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
      
      res.json({ message: 'Turno actualizado' });
    } catch (error) {
      console.error('Error al actualizar turno:', error);
      res.status(500).json({ error: 'Error al actualizar turno' });
    }
  }
);

// ============================================================
// Borrar turno
// ============================================================
router.delete('/:id', requireRole('secretaria'), async (req, res) => {
  const db = getDb();
  const { id } = req.params;

  try {
    await db.query('DELETE FROM appointments WHERE id = $1', [id]);
    res.json({ message: 'Turno eliminado' });
  } catch (error) {
    console.error('Error al eliminar turno:', error);
    res.status(500).json({ error: 'Error al eliminar turno' });
  }
});

// ============================================================
// Obtener manicuristas
// ============================================================
router.get('/manicuristas', requireRole('secretaria'), async (req, res) => {
  const db = getDb();
  
  try {
    const result = await db.query('SELECT id, full_name FROM users WHERE role = $1 ORDER BY full_name', ['manicurista']);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener manicuristas:', error);
    res.status(500).json({ error: 'Error al obtener manicuristas' });
  }
});

// ============================================================
// Estadísticas
// ============================================================
router.get('/estadisticas', requireRole('secretaria'), async (req, res) => {
  const db = getDb();
  
  let { mes, anio } = req.query;
  
  const fechaActual = new Date();
  const mesActual = mes ? parseInt(mes) : fechaActual.getMonth() + 1;
  const anioActual = anio ? parseInt(anio) : fechaActual.getFullYear();
  
  const fechaInicio = `${anioActual}-${String(mesActual).padStart(2, '0')}-01`;
  const fechaFin = `${anioActual}-${String(mesActual).padStart(2, '0')}-31`;
  
  try {
    const porManicurista = await db.query(`
      SELECT 
        u.full_name as manicurista,
        a.service_type,
        COUNT(*) as cantidad
      FROM appointments a
      JOIN users u ON a.manicurist_id = u.id
      WHERE u.role = 'manicurista'
        AND a.status = 'ya atendido'
        AND a.date BETWEEN $1 AND $2
      GROUP BY u.full_name, a.service_type
      ORDER BY u.full_name, a.service_type
    `, [fechaInicio, fechaFin]);
    
    const totalesPorServicio = await db.query(`
      SELECT 
        service_type,
        COUNT(*) as total
      FROM appointments
      WHERE status = 'ya atendido'
        AND date BETWEEN $1 AND $2
      GROUP BY service_type
      ORDER BY service_type
    `, [fechaInicio, fechaFin]);
    
    const totalesPorManicurista = await db.query(`
      SELECT 
        u.full_name as manicurista,
        COUNT(*) as total
      FROM appointments a
      JOIN users u ON a.manicurist_id = u.id
      WHERE u.role = 'manicurista'
        AND a.status = 'ya atendido'
        AND a.date BETWEEN $1 AND $2
      GROUP BY u.full_name
      ORDER BY u.full_name
    `, [fechaInicio, fechaFin]);
    
    const granTotal = await db.query(`
      SELECT COUNT(*) as total FROM appointments
      WHERE status = 'ya atendido'
        AND date BETWEEN $1 AND $2
    `, [fechaInicio, fechaFin]);
    
    const totalesPorMes = await db.query(`
      SELECT 
        TO_CHAR(TO_DATE(date, 'YYYY-MM-DD'), 'YYYY-MM') as mes,
        COUNT(*) as total
      FROM appointments
      WHERE status = 'ya atendido'
      GROUP BY TO_CHAR(TO_DATE(date, 'YYYY-MM-DD'), 'YYYY-MM')
      ORDER BY mes DESC
      LIMIT 12
    `);
    
    res.json({
      mesActual: mesActual,
      anioActual: anioActual,
      fechaInicio,
      fechaFin,
      porManicurista: porManicurista.rows,
      totalesPorServicio: totalesPorServicio.rows,
      totalesPorManicurista: totalesPorManicurista.rows,
      granTotal: granTotal.rows[0].total,
      totalesPorMes: totalesPorMes.rows
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas', detalle: error.message });
  }
});

export default router;