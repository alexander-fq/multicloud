require('dotenv').config();
const app = require('./src/app');
const { getDatabaseService, getAuthService, getProvider } = require('./src/services/factory');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    console.log('🚀 Starting GovTech Cloud Migration Platform...');
    console.log(`☁️  Cloud Provider: ${getProvider().toUpperCase()}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Test database connection
    console.log('📊 Testing database connection...');
    const db = getDatabaseService();
    const dbConnected = await db.testConnection();

    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, but server will continue');
    } else {
      console.log('✅ Database connected successfully');
      const stats = await db.getPoolStats();
      console.log(`   Pool stats: ${stats.total} total, ${stats.idle} idle, ${stats.waiting} waiting`);
    }

    // Verify cloud credentials
    console.log('🔐 Verifying cloud credentials...');
    const auth = getAuthService();
    const credsValid = await auth.verifyCredentials();

    if (!credsValid) {
      console.warn('⚠️  Cloud credentials verification failed');
      console.warn('   Some features may not work correctly');
    } else {
      console.log('✅ Cloud credentials verified');
      const identity = await auth.getCurrentIdentity();
      console.log(`   Account: ${identity.account || identity.userId}`);
    }

    // Start server
    const server = app.listen(PORT, HOST, () => {
      console.log('');
      console.log('✅ Server is running!');
      console.log(`   URL: http://${HOST}:${PORT}`);
      console.log(`   Health: http://${HOST}:${PORT}/api/health`);
      console.log(`   Info: http://${HOST}:${PORT}/api/info`);
      console.log('');
      console.log('📚 Ready to handle requests...');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n🛑 SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        console.log('   Server closed');
        await db.close();
        console.log('   Database connections closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('\n🛑 SIGINT received, shutting down gracefully...');
      server.close(async () => {
        console.log('   Server closed');
        await db.close();
        console.log('   Database connections closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

startServer();
