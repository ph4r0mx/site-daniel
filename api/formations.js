require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { readDB } = require('./db');

const router = express.Router();

function getUserFromToken(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
  } catch { return null; }
}

router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.formations.map(f => ({
    id: f.id, categorie: f.categorie, titre: f.titre,
    sous_titre: f.sous_titre, prix: f.prix, formule: f.formule,
    badge: f.badge, description: f.description, image: f.image,
    nb_modules: f.modules.length, modules_gratuits: f.modules_gratuits,
    apercu: f.modules.filter(m => m.gratuit).map(m => ({ id: m.id, titre: m.titre, duree: m.duree, contenu: m.contenu, gratuit: true }))
  })));
});

router.get('/:id', (req, res) => {
  const db = readDB();
  const formation = db.formations.find(f => f.id === req.params.id);
  if (!formation) return res.status(404).json({ error: 'Formation introuvable' });

  const decoded = getUserFromToken(req);
  let acces = false;
  if (decoded) {
    const user = db.users.find(u => u.id === decoded.id);
    if (user && (user.role === 'owner' || user.formations.includes(req.params.id))) acces = true;
  }

  const modules = formation.modules.map(m => ({
    id: m.id, titre: m.titre, duree: m.duree,
    contenu: (m.gratuit || acces) ? m.contenu : null,
    gratuit: m.gratuit, verrouille: !m.gratuit && !acces
  }));

  res.json({ ...formation, modules, acces });
});

module.exports = router;
