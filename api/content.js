require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const { supabase } = require('./db');

const router = express.Router();

async function getUser(req) {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith('Bearer ')) return null;

    const decoded = jwt.verify(
      auth.split(' ')[1],
      process.env.JWT_SECRET
    );

    const { data: user, error } = await supabase
      .from('users')
      .select('id, nom, email, formations, role')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error) throw error;

    return user || null;
  } catch {
    return null;
  }
}

// Contenu d'un module spécifique
router.get('/:formationId/:moduleId', async (req, res) => {
  try {
    const { formationId, moduleId } = req.params;

    const { data: formation, error } = await supabase
      .from('formations')
      .select('*')
      .eq('id', formationId)
      .maybeSingle();

    if (error) throw error;

    if (!formation) {
      return res.status(404).json({
        error: 'Formation introuvable'
      });
    }

    const module = (formation.modules || []).find(
      m => String(m.id) === String(moduleId)
    );

    if (!module) {
      return res.status(404).json({
        error: 'Module introuvable'
      });
    }

    const user = await getUser(req);

    const hasAccess =
      module.gratuit ||
      (
        user &&
        (
          user.role === 'owner' ||
          (user.formations || []).includes(formationId)
        )
      );

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Accès refusé'
      });
    }

    // Le contenu est maintenant stocké directement
    // dans le module de la colonne JSONB "modules".
    const content = module.contenu;

    if (!content) {
      return res.status(404).json({
        error: 'Contenu non disponible'
      });
    }

    res.json({
      formation: formation.titre,
      module: module.titre,
      duree: module.duree,
      contenu: content
    });

  } catch (e) {
    console.error('CONTENT ERROR:', e.message);

    res.status(500).json({
      error: 'Erreur serveur: ' + e.message
    });
  }
});

module.exports = router;