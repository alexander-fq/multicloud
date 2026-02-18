# Stage 1: Build de React con Vite
# Node para compilar la aplicacion React
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias primero (cache layer)
COPY package*.json ./
RUN npm ci

# Copiar codigo y compilar para produccion
COPY . .
RUN npm run build
# Resultado en /app/dist/


# Stage 2: Servidor de produccion con Nginx
# Nginx sirve archivos estaticos mucho mas rapido que Node.js
FROM nginx:alpine
LABEL maintainer="GovTech Cloud Platform"

# Copiar build de React al directorio de nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuracion de nginx para React Router y proxy al backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
