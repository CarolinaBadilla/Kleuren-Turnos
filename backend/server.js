import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database.js';
import authRoutes from './routes/auth.js';
import appointmentsRoutes from './routes/appointments.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS para aceptar peticiones del frontend en Render
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Inicializar base de datos
await initializeDatabase();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});