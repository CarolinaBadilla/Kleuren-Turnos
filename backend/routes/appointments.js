import express from 'express';
import { getDb } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Middleware para todos los endpoints de turnos
router.use(authenticateToken);

// Obtener turnos (según rol)
router.get('/', async (req, res) => {
  const db = getDb();
  const user = req.user;

  try {
    let result;
    
    if (user.role === 'secretaria') {
      // Secretaria ve todos los turnos con datos completos
      result = await db.query(`
        SELECT a.*, u.full_name as manicurista_nombre 
        FROM appointments a
        JOIN users u ON a.manicurist_id = u.id
        ORDER BY a.date ASC, a.time ASC
      `);
    } else {
      // Manicurista solo ve sus turnos y campos limitados
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
    
    // Devolver result.rows (el array de datos)
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
});

// Crear turno (solo secretaria)
router.post('/',
  requireRole('secretaria'),
  [
    body('client_name').notEmpty().withMessage('Nombre requerido'),
    body('phone').notEmpty().withMessage('Teléfono requerido'),
    body('dni').notEmpty().withMessage('DNI requerido'),
    body('service_type').isIn(['esmaltado', 'semipermanente', 'capping', 'pedicura', 'depilacion']),
    body('manicurist_id').isInt(),
    body('duration').isInt({ min: 15 }),
    body('date').matches(/^\d{4}-\d{2}-\d{2}$/),
    body('time').matches(/^\d{2}:\d{2}$/),
    body('status').isIn(['confirmado', 'pedido', 'cancelado'])
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

// Editar turno (solo secretaria)
router.put('/:id',
  requireRole('secretaria'),
  [
    body('client_name').optional().notEmpty(),
    body('phone').optional().notEmpty(),
    body('dni').optional().notEmpty(),
    body('service_type').optional().isIn(['esmaltado', 'semipermanente', 'capping', 'pedicura', 'depilacion']),
    body('manicurist_id').optional().isInt(),
    body('duration').optional().isInt({ min: 15 }),
    body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    body('time').optional().matches(/^\d{2}:\d{2}$/),
    body('status').optional().isIn(['confirmado', 'pedido', 'cancelado'])
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

// Borrar turno (solo secretaria)
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

// Obtener manicuristas (para selector)
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

export default router;