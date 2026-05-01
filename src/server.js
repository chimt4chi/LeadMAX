require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./database/connection');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
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
