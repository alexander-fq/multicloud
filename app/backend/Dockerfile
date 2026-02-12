# STAGE 1: Builder
# Usamos una imagen base de Node.js 20 en Alpine Linux (muy ligera, ~5MB)
FROM node:20-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos solo package.json y package-lock.json primero
# Esto permite cachear la instalacion de dependencias si no cambian
COPY package*.json ./

# Instalamos TODAS las dependencias (incluyendo devDependencies)
RUN npm ci

# Copiamos el resto del codigo fuente
COPY . .

# Si tuvieras un paso de build (TypeScript, etc.), iria aqui
# RUN npm run build


# STAGE 2: Production
# Creamos una nueva imagen mas pequena solo para produccion
FROM node:20-alpine

# Metadata sobre la imagen
LABEL maintainer="GovTech Team"
LABEL description="Backend API for Cloud Migration Platform"

# Creamos un usuario no-root por seguridad
# Nunca corras contenedores como root en produccion
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiamos solo package.json para instalar dependencias de produccion
COPY package*.json ./

# Instalamos SOLO dependencias de produccion (sin devDependencies)
RUN npm ci --only=production && \
    npm cache clean --force

# Copiamos el codigo desde el stage builder
COPY --from=builder /app/src ./src

# Cambiamos el owner de los archivos al usuario nodejs
RUN chown -R nodejs:nodejs /app

# Cambiamos al usuario no-root
USER nodejs

# Exponemos el puerto 3000 (documentacion, no abre el puerto realmente)
EXPOSE 3000

# Health check: Docker verificara cada 30s si la app esta viva
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando por defecto al iniciar el contenedor
CMD ["node", "src/server.js"]
