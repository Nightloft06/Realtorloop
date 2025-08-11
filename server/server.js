// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const emailRoutes = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// CORS: localhost (dev) + live domains + Render URL
const allowlist = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://realtorloop.com',
  'https://www.realtorloop.com',
  'https://api.realtorloop.com',
  'https://realtorloop-api.onrender.com' // for direct testing
];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowlist.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Root (simple info)
app.get('/', (_req, res) => res.send('Realtorloop API running'));

// Health check for Render
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Email routes
app.use('/api/email', emailRoutes);

// Unknown API (Express 5 safe: prefix catch-all)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
