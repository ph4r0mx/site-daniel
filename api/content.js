require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { readDB } = require('./db');
const router = express.Router();

function getUser(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    const db = readDB();
    return db.users.find(u => u.id === decoded.id) || null;
  } catch { return null; }
}

// Contenu d'un module spécifique
router.get('/:formationId/:moduleId', (req, res) => {
  const { formationId, moduleId } = req.params;
  const db = readDB();
  const formation = db.formations.find(f => f.id === formationId);
  if (!formation) return res.status(404).json({ error: 'Formation introuvable' });

  const module = formation.modules.find(m => m.id === parseInt(moduleId));
  if (!module) return res.status(404).json({ error: 'Module introuvable' });

  const user = getUser(req);
  const hasAccess = module.gratuit || 
    (user && (user.role === 'owner' || user.formations.includes(formationId)));

  if (!hasAccess) return res.status(403).json({ error: 'Accès refusé' });

  // Retourner le contenu complet du module
  const content = db.content?.[formationId]?.[moduleId];
  if (!content) return res.status(404).json({ error: 'Contenu non disponible' });

  res.json({ 
    formation: formation.titre,
    module: module.titre,
    duree: module.duree,
    contenu: content
  });
});

module.exports = router;
