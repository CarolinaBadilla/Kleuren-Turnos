# -------------------------------------------------------------------
# ETAPA 1: Compilar el Frontend (Vite + React)
# -------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# -------------------------------------------------------------------
# ETAPA 2: Preparar dependencias del Backend
# -------------------------------------------------------------------
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./

# Copiar el resultado de Vite (dist) a la carpeta public del backend
COPY --from=frontend-builder /app/frontend/dist ./public

# -------------------------------------------------------------------
# ETAPA 3: Runtime de producción (Hardened & Non-Root)
# -------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar la aplicación backend lista con los estáticos en public
COPY --from=backend-builder /app/backend ./

# HARDENING: Ejecutar la app con el usuario 'node'
USER node

EXPOSE 3000

CMD ["node", "server.js"]
