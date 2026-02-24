const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PROVIDER = process.env.CLOUD_PROVIDER || 'aws';

// GET / - informacion de la plataforma
app.get('/', (req, res) => {
  res.json({
    name: 'Tu Plataforma - reemplaza este nombre',
    version: '1.0.0',
    provider: PROVIDER,
    message: 'Reemplaza este backend con tu aplicacion',
  });
});

// GET /api/health - health check (requerido por Kubernetes)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    provider: PROVIDER,
    uptime: process.uptime(),
  });
});

// GET /api/health/database - estado de la base de datos
app.get('/api/health/database', (req, res) => {
  // TODO: conectar a la base de datos real usando DatabaseService
  // const db = require('./services/factory').getDatabaseService()
  // const result = await db.ping()
  res.json({ status: 'healthy', provider: PROVIDER });
});

// GET /api/health/cloud - estado de las credenciales cloud
app.get('/api/health/cloud', (req, res) => {
  res.json({
    status: 'healthy',
    provider: PROVIDER,
    region: process.env.AWS_REGION || process.env.OCI_REGION || process.env.GCP_REGION || 'not-set',
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

module.exports = app;
