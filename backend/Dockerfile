# -------------------------------------------------------------------
# ETAPA 1: Compilar el Frontend (React / Vite)
# -------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copiar paquetes del frontend e instalar dependencias
COPY frontend/package*.json ./
RUN npm ci

# Copiar src/, index.html, public/ y todo el código del frontend
COPY frontend/ ./

# Generar la carpeta dist/ compilada
RUN npm run build

# -------------------------------------------------------------------
# ETAPA 2: Preparar dependencias del Backend
# -------------------------------------------------------------------
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./

# Copiar el resultado compilado del frontend a la carpeta public del backend
# (Nota: Si tu proyecto usa Vite la salida es 'dist'. Si usas Create React App es 'build')
COPY --from=frontend-builder /app/frontend/dist ./public

# -------------------------------------------------------------------
# ETAPA 3: Imagen Final de Producción (Hardened & Non-Root)
# -------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar la aplicación backend lista con los estáticos ya integrados
COPY --from=backend-builder /app/backend ./

# HARDENING: Ejecutar la app con el usuario 'node' (Non-Root)
USER node

EXPOSE 3000

CMD ["node", "server.js"]
