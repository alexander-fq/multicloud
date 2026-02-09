# 🚀 Guía de Inicio Rápido - GovTech Trámites

## Método 1: Scripts Automatizados (Recomendado)

### Terminal 1 - Backend

```bash
cd "/mnt/c/Users/Daren/Documents/analyticsAPI/AWS Cloud"
./start-backend.sh
```

### Terminal 2 - Frontend

Abre una **nueva terminal** y ejecuta:

```bash
cd "/mnt/c/Users/Daren/Documents/analyticsAPI/AWS Cloud"
./start-frontend.sh
```

---

## Método 2: Comandos Manuales

### Terminal 1 - Backend

```bash
# Cargar NVM
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 20

# Ir al backend
cd "/mnt/c/Users/Daren/Documents/analyticsAPI/AWS Cloud/backend"

# Iniciar
npm run dev
```

### Terminal 2 - Frontend

```bash
# Cargar NVM
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 20

# Ir al frontend
cd "/mnt/c/Users/Daren/Documents/analyticsAPI/AWS Cloud/frontend"

# Instalar dependencias (solo primera vez)
npm install

# Iniciar
npm run dev
```

---

## ✅ Verificación

Una vez que ambos servicios estén corriendo:

**Backend (Terminal 1) debe mostrar:**
```
======================================================================
[Server] GovTech Tramites API
[Server] Environment: development
[Server] Server running on http://0.0.0.0:3000
======================================================================
```

**Frontend (Terminal 2) debe mostrar:**
```
VITE v5.1.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Probar en el navegador:**
- Abre: http://localhost:5173
- Deberías ver la aplicación GovTech

**Probar API:**
```bash
curl http://localhost:3000/api/v1/health
```
Debería responder: `{"success":true,"message":"API is healthy"}`

---

## 🛑 Detener Servicios

En cada terminal, presiona: **Ctrl + C**

---

## 🐛 Solución de Problemas

### Error: "npm: command not found"

```bash
# Cargar NVM manualmente
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 20
```

### Error: "Port 3000 already in use"

```bash
# Encontrar y matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9
```

### Error: "Port 5173 already in use"

```bash
# Encontrar y matar proceso en puerto 5173
lsof -ti:5173 | xargs kill -9
```

### Error: PostgreSQL no está corriendo

```bash
# Iniciar PostgreSQL
podman start tramites-postgres

# Verificar que esté corriendo
podman ps | grep tramites-postgres
```

### Error: "Cannot find module"

```bash
# En la carpeta con el error, reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## 📱 URLs Importantes

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:5173 | Aplicación web |
| Backend API | http://localhost:3000/api/v1 | API REST |
| Health Check | http://localhost:3000/api/v1/health | Estado del backend |
| API Info | http://localhost:3000/api/v1 | Información de la API |

---

## 💡 Tips

1. **Mantén ambas terminales abiertas** mientras trabajas
2. **Los cambios se recargan automáticamente** (Hot Reload)
3. **Revisa los logs** en las terminales si algo falla
4. **PostgreSQL debe estar corriendo** antes de iniciar el backend

---

¡Listo! Ahora puedes empezar a desarrollar 🎉
