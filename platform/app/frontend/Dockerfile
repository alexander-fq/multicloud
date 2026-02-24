# Stage 1: Build de React con Vite
# IMPORTANTE: el build context debe ser la raiz del proyecto (no app/frontend/)
# porque docsData.js importa archivos .md desde docs/, terraform/, kubernetes/, etc.
# Ver docker-compose.yml: context: . / dockerfile: app/frontend/Dockerfile

FROM node:20-slim AS builder
WORKDIR /workspace

# Copiar archivos de documentacion que necesita el build de Vite (?raw imports)
COPY docs/                       docs/
COPY INFRASTRUCTURE.md           INFRASTRUCTURE.md
COPY terraform/README.md         terraform/README.md
COPY kubernetes/README.md        kubernetes/README.md
COPY security/                   security/
COPY disaster-recovery/          disaster-recovery/

# Instalar dependencias del frontend
WORKDIR /workspace/app/frontend
COPY app/frontend/package*.json ./

# Fix: deshabilitar hardware AES (AES-NI) para evitar ERR_SSL_CIPHER_OPERATION_FAILED
# en entornos virtualizados (WSL2/Docker Desktop) donde la aceleracion de hardware
# puede no estar disponible correctamente
ENV OPENSSL_ia32cap=~0x200000200000000

RUN npm ci

# Copiar codigo fuente del frontend
COPY app/frontend/ .

# Build de produccion (Vite puede acceder a los .md de /workspace/docs/)
RUN npm run build
# Resultado en /workspace/app/frontend/dist/


# Stage 2: Servidor de produccion con Nginx
FROM nginx:alpine
LABEL maintainer="GovTech Cloud Platform"

# Copiar build de React al directorio de nginx
COPY --from=builder /workspace/app/frontend/dist /usr/share/nginx/html

# Configuracion de nginx para React Router y proxy al backend
COPY app/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
