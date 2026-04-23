const fs = require('fs');
const https = require('https');
const path = require('path');
const express = require('express');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const requireAuth = require('./middleware/auth');
const { PORT } = require('./config');

const app = express();

// --- Global middleware ---
app.use(express.json());

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/movies', requireAuth, movieRoutes);

app.get('/', (req, res) => {
  res.send('Movie Watchlist API is running. Use an API client (curl / Postman) to call /api/...');
});

// --- Start HTTPS server ---
const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS server listening on https://localhost:${PORT}`);
});
