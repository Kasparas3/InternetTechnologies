const express = require('express');
const db = require('../db');

const router = express.Router();

// Helper: validate the body of create/update requests.
function validateMovie(body) {
  if (!body || typeof body !== 'object') return 'Body must be a JSON object';
  if (typeof body.title !== 'string' || body.title.trim() === '') return 'title must be a non-empty string';
  if (typeof body.genre !== 'string' || body.genre.trim() === '') return 'genre must be a non-empty string';
  if (!Number.isInteger(body.year) || body.year < 1880 || body.year > 2100) return 'year must be an integer between 1880 and 2100';
  return null;
}

// 1) GET /api/movies  — list all movies.
//    Optional query param: ?status=watched  or  ?status=to-watch
router.get('/', (req, res) => {
  const { status } = req.query;
  let rows;
  if (status === 'watched') {
    rows = db.prepare('SELECT * FROM movies WHERE watched = 1 ORDER BY id DESC').all();
  } else if (status === 'to-watch') {
    rows = db.prepare('SELECT * FROM movies WHERE watched = 0 ORDER BY id DESC').all();
  } else if (status === undefined) {
    rows = db.prepare('SELECT * FROM movies ORDER BY id DESC').all();
  } else {
    return res.status(400).json({ error: "status must be 'watched' or 'to-watch'" });
  }
  res.json(rows);
});

// 2) GET /api/movies/:id  — get one movie
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id must be an integer' });

  const row = db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Movie not found' });
  res.json(row);
});

// 3) POST /api/movies  — add a movie
router.post('/', (req, res) => {
  const err = validateMovie(req.body);
  if (err) return res.status(400).json({ error: err });

  const { title, genre, year } = req.body;
  const info = db
    .prepare('INSERT INTO movies (title, genre, year, watched) VALUES (?, ?, ?, 0)')
    .run(title.trim(), genre.trim(), year);

  const created = db.prepare('SELECT * FROM movies WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// 4) PUT /api/movies/:id  — replace a movie
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id must be an integer' });

  const err = validateMovie(req.body);
  if (err) return res.status(400).json({ error: err });

  const existing = db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Movie not found' });

  const { title, genre, year } = req.body;
  db.prepare('UPDATE movies SET title = ?, genre = ?, year = ? WHERE id = ?')
    .run(title.trim(), genre.trim(), year, id);

  const updated = db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
  res.json(updated);
});

// 5) PATCH /api/movies/:id/status  — flip the watched flag
router.patch('/:id/status', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id must be an integer' });

  if (!req.body || typeof req.body.watched !== 'boolean') {
    return res.status(400).json({ error: 'body must be { "watched": true | false }' });
  }

  const existing = db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Movie not found' });

  db.prepare('UPDATE movies SET watched = ? WHERE id = ?').run(req.body.watched ? 1 : 0, id);

  const updated = db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
  res.json(updated);
});

// 6) DELETE /api/movies/:id
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id must be an integer' });

  const info = db.prepare('DELETE FROM movies WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Movie not found' });

  res.status(204).end();
});

module.exports = router;
