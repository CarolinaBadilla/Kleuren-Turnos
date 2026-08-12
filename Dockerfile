# ===================================================
# ETAPA 1: Compilar el Frontend de React con Vite
# ===================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copiar paquetes e instalar dependencias del frontend
COPY frontend/package*.json ./
RUN npm install

# Copiar el código del frontend y compilar
COPY frontend/ ./
RUN npm run build

# ===================================================
# ETAPA 2: Preparar el Backend de Node.js y Ejecutar
# ===================================================
FROM node:20-alpine
WORKDIR /app/backend

# Copiar paquetes e instalar dependencias de producción del backend
COPY backend/package*.json ./
RUN npm install --only=production

# Copiar el código fuente del backend
COPY backend/ ./

# Copiar el frontend compilado (dist) a la carpeta 'public' del backend
COPY --from=frontend-builder /app/frontend/dist ./public

# Exponer el puerto de la aplicación
EXPOSE 3000

# Variables de entorno por defecto
ENV PORT=3000
ENV NODE_ENV=production

# Comando para iniciar el servidor
CMD ["node", "server.js"]
