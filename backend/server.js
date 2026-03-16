require('dotenv').config();
const express = require('express');
const cors = require('cors');
const agentRoutes = require('./routes/agentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'HelloAlex AI Backend Running 🚀',
    status: 'ok',
    api: '/api/test'
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Customer Support Agent API is running 🤖',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    model: 'gemini-2.5-flash',
  });
});

app.use('/api/agent', agentRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n🚀 AI Customer Support Agent Backend');
  console.log(`📡 Server running at: http://localhost:${PORT}`);
  console.log(`🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ MISSING — set GEMINI_API_KEY in .env'}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('─'.repeat(50) + '\n');
});

module.exports = app;
