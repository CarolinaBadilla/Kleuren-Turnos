import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './database.js';
import authRoutes from './routes/auth.js';
import appointmentsRoutes from './routes/appointments.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
	'https://kleuren.com.ar',
	'https://www.kleuren.com.ar',
	'http://localhost:5173',
	'http://localhost:3000',
  ],
  credentials: true
}));

app.use(express.json());

// Inicializar base de datos
await initializeDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);

// 2. Servir los archivos estáticos compilados del Frontend (React / Vite)
app.use(express.static(path.join(__dirname, 'public')));

// 3. Captura cualquier otra ruta web y devuelve el index.html de React (para React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
