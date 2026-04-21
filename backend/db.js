// db.js — opens the SQLite database, creates tables, seeds one admin user.
// better-sqlite3 is a synchronous SQLite driver: db.prepare(sql).run() / .all().

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username       TEXT PRIMARY KEY,
    password_hash  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS movies (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    title   TEXT    NOT NULL,
    genre   TEXT    NOT NULL,
    year    INTEGER NOT NULL,
    watched INTEGER NOT NULL DEFAULT 0
  );
`);

// Seed one admin user on first run.
const existing = db.prepare('SELECT username FROM users WHERE username = ?').get('admin');
if (!existing) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('Seeded admin user: admin / admin123');
}

module.exports = db;
