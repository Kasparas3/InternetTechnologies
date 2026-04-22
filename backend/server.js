// server.js — entry point. Starts an HTTPS server and mounts the API routes.

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
// Parses "Content-Type: application/json" request bodies into req.body.
app.use(express.json());

// --- API routes ---
// Login does NOT require authentication (you have no token yet at login time).
app.use('/api/auth', authRoutes);
// Every /api/movies/* endpoint requires a valid JWT.
app.use('/api/movies', requireAuth, movieRoutes);

// Root health-check so hitting https://localhost:3000/ in a browser
// confirms the server is running.
app.get('/', (req, res) => {
  res.send('Movie Watchlist API is running. Use an API client (curl / Postman) to call /api/...');
});

// --- Start HTTPS server ---
// We load a self-signed certificate from ./certs/ (see README for how to generate).
const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS server listening on https://localhost:${PORT}`);
});
