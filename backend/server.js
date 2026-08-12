import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';

import { initializeDatabase } from './database.js';
import authRoutes from './routes/auth.js';
import appointmentsRoutes from './routes/appointments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------------------------------------------------
// CONEXIÓN CON REDIS
// -------------------------------------------------------------------
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('connect', () => console.log('✅ Conectado a Redis exitosamente'));
redisClient.on('error', (err) => console.error('❌ Error de conexión con Redis:', err));

// -------------------------------------------------------------------
// MIDDLEWARES DE RATE LIMITING (Fase 2)
// -------------------------------------------------------------------
// 1. Limitador general para todas las peticiones API (100 req / 15 min)
const limitadorGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas peticiones desde esta IP. Por favor reintenta en 15 minutos.'
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// 2. Limitador estricto para inicio de sesión / Auth (5 req / 15 min - Fuerza Bruta)
const limitadorAutenticacion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de inicio de sesión. Por seguridad intenta nuevamente en 15 minutos.'
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// -------------------------------------------------------------------
// CONFIGURACIÓN DE MIDDLEWARES Y CORS
// -------------------------------------------------------------------
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

// Inicializar base de datos PostgreSQL
await initializeDatabase();

// -------------------------------------------------------------------
// APLICAR RATE LIMITING A LAS RUTAS
// -------------------------------------------------------------------
// Proteger la ruta de autenticación con el limitador estricto
app.use('/api/auth/login', limitadorAutenticacion);

// Proteger todas las rutas globales de la API con el limitador general
app.use('/api/', limitadorGeneral);

// Rutas de la aplicación
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);

// -------------------------------------------------------------------
// SERVIR ARCHIVOS ESTÁTICOS Y SPA ROUTER
// -------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
