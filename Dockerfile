# -------------------------------------------------------------------
# ETAPA 1: Build de dependencias
# -------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalación de dependencias limpias de producción
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# -------------------------------------------------------------------
# ETAPA 2: Runtime de producción (Hardened & Non-Root)
# -------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar desde la etapa de compilación
COPY --from=builder /app ./

# HARDENING: Ejecutar la app con el usuario del sistema 'node' (Non-Root)
USER node

EXPOSE 3000

CMD ["node", "server.js"]