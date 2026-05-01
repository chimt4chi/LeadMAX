require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const app  = require('./app');
const { connectDB } = require('./database/connection');

const PORT   = process.env.PORT || 3000;
const dbPath = path.resolve(process.env.DB_PATH || './src/database/leadmax.sqlite');

async function startServer() {
  try {
    const isNewDb = !fs.existsSync(dbPath);

    await connectDB();

    // Auto-seed on fresh DB (e.g. after Render cold start wipes /tmp)
    if (isNewDb) {
      console.log('🌱 Fresh database detected — running seed...');
      const { seed } = require('./database/seed');
      await seed();
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 LeadMax Payment System API is running`);
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`📚 API Base: http://localhost:${PORT}/api/v1`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
