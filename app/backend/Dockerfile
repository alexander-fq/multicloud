# STAGE 1: Builder
# Usamos una imagen base de Node.js 20 en Alpine Linux (muy ligera, ~5MB)
FROM node:20-slim AS builder

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
FROM node:20-slim

# Metadata sobre la imagen
LABEL maintainer="GovTech Team"
LABEL description="Backend API for Cloud Migration Platform"

# Creamos un usuario no-root por seguridad
# Nunca corras contenedores como root en produccion
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh -m nodejs

# Crear directorio de trabajo y asignarlo al usuario nodejs
# Solo chown del directorio vacio (rapido, no recursivo)
RUN mkdir -p /app && chown nodejs:nodejs /app
WORKDIR /app

# Copiamos solo package.json para instalar dependencias de produccion
# --chown evita necesitar un 'RUN chown -R' posterior (que es muy lento en Docker)
COPY --chown=nodejs:nodejs package*.json ./

# Instalamos SOLO dependencias de produccion (sin devDependencies)
# Corremos como nodejs para que los archivos ya tengan el owner correcto
USER nodejs
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copiamos el codigo desde el stage builder con el owner correcto
COPY --chown=nodejs:nodejs --from=builder /app/server.js ./server.js
COPY --chown=nodejs:nodejs --from=builder /app/src ./src

# Exponemos el puerto 3000 (documentacion, no abre el puerto realmente)
EXPOSE 3000

# Health check: Docker verificara cada 30s si la app esta viva
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando por defecto al iniciar el contenedor
CMD ["node", "server.js"]
