// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const emailRoutes = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// CORS: localhost (dev) + your live domain(s) + optional api subdomain
const allowlist = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://realtorloop.com',
  'https://www.realtorloop.com',
  'https://api.realtorloop.com'
];

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowlist.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json({ limit: '1mb' }));

// Health check for Render
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Your email routes (POSTs to /api/email/...)
app.use('/api/email', emailRoutes);

// Unknown API
app.use('/api/*', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler (shows CORS or mail errors clearly)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
