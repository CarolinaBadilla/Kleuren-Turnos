import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database.js';
import authRoutes from './routes/auth.js';
import appointmentsRoutes from './routes/appointments.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'https://kleuren-turnos-2.onrender.com'],
  credentials: true
}));

app.use(express.json());

// Inicializar base de datos
await initializeDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});