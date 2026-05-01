const express = require('express');
const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'LeadMax Payment System API',
    version: '1.0.0',
    docs: '/api/v1',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const userRoutes       = require('./routes/user.routes');
const authRoutes       = require('./routes/auth.routes');
const bankRoutes       = require('./routes/bank.routes');
const paymentRoutes    = require('./routes/payment.routes');

app.use('/api/v1/users',        userRoutes);
app.use('/api/v1/auth',         authRoutes);
app.use('/api/v1/bank-accounts', bankRoutes);
app.use('/api/v1/payments',     paymentRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── JSON Body Parse Error Handler ───────────────────────────────────────────
// Catches malformed JSON bodies (e.g. trailing commas, missing quotes)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON body. Please check your request body for syntax errors (e.g. trailing commas).',
    });
  }
  next(err);
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
