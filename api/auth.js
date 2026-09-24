require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('./db');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    if (!nom || !email || !password)
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    const db = readDB();
    if (db.users.find(u => u.email === email))
      return res.status(409).json({ error: 'Email déjà utilisé' });
    const hash = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), nom, email, password: hash, formations: [], role: 'user', createdAt: new Date().toISOString() };
    db.users.push(user);
    writeDB(db);
    const token = jwt.sign({ id: user.id, email, nom }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, nom, email, formations: [], role: 'user' } });
  } catch (e) {
    console.error('REGISTER ERROR:', e.message);
    res.status(500).json({ error: 'Erreur serveur: ' + e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'Email introuvable' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Mot de passe incorrect' });
    const token = jwt.sign({ id: user.id, email: user.email, nom: user.nom }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, nom: user.nom, email: user.email, formations: user.formations, role: user.role } });
  } catch (e) {
    console.error('LOGIN ERROR:', e.message);
    res.status(500).json({ error: 'Erreur serveur: ' + e.message });
  }
});

router.get('/me', require('../middleware/auth'), (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Introuvable' });
  res.json({ id: user.id, nom: user.nom, email: user.email, formations: user.formations, role: user.role });
});

module.exports = router;
