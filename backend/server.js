import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
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
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// -------------------------------------------------------------------
// 1. CONFIGURACIÓN DE CABECERAS CSP Y SEGURIDAD (AL INICIO)
// -------------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; " +
    "script-src-elem 'self' 'unsafe-inline' https://static.cloudflareinsights.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "imgSrc 'self' data: blob: https:; " +
    "connect-src 'self' https://static.cloudflareinsights.com wss: https:;"
  );
  next();
});

// -------------------------------------------------------------------
// 2. CONEXIÓN CON REDIS
// -------------------------------------------------------------------
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('connect', () => console.log('✅ Conectado a Redis exitosamente'));
redisClient.on('error', (err) => console.error('❌ Error de conexión con Redis:', err));

// -------------------------------------------------------------------
// 3. MIDDLEWARES DE RATE LIMITING (Fase 2)
// -------------------------------------------------------------------
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
// 4. MIDDLEWARES GENERALES Y CORS
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
// 5. RUTAS Y RATE LIMITING DE LA API
// -------------------------------------------------------------------
app.use('/api/', limitadorGeneral);
app.use('/api/auth/login', limitadorAutenticacion);

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);

// -------------------------------------------------------------------
// 6. SERVIR ARCHIVOS ESTÁTICOS Y CAPTURA SPA (Vite / React Router)
// -------------------------------------------------------------------
const publicPath = path.join(__dirname, 'public');

// Servir la carpeta de estáticos compilada
app.use(express.static(publicPath));

// Fallback SPA
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <h2>Error 404: No se encontró la interfaz del Frontend</h2>
      <p>Express buscó el archivo en: <code>${indexPath}</code></p>
      <p>Verifica que la compilación de Vite haya generado los archivos en public/.</p>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`📂 Carpeta pública mapeada en: ${publicPath}`);
});
