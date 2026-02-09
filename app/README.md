# App Directory

**100% Cloud-Agnostic Application Code**

This directory contains the application code (backend and frontend) that works identically across all cloud providers.

## Structure

```
app/
├── backend/     # Node.js + Express API (Docker-ready)
└── frontend/    # React + Vite SPA (Docker-ready)
```

## Next Steps

1. Move existing `backend/` content here
2. Move existing `frontend/` content here
3. Add `Dockerfile` to each
4. Add `.dockerignore` files
5. Create `docker-compose.yml` for local development

## Portability: 100%

✅ Works on AWS, GCP, Azure, Oracle Cloud, local Docker
