require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { supabase } = require('./db');

const router = express.Router();

function getUserFromToken(req) {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {
      return null;
    }

    return jwt.verify(
      auth.split(' ')[1],
      process.env.JWT_SECRET
    );
  } catch {
    return null;
  }
}


// Toutes les formations
router.get('/', async (req, res) => {
  try {
    const { data: formations, error } = await supabase
      .from('formations')
      .select('*');

    if (error) throw error;

    res.json(
      formations.map(f => ({
        id: f.id,
        categorie: f.categorie,
        titre: f.titre,
        sous_titre: f.sous_titre,
        prix: f.prix,
        formule: f.formule,
        badge: f.badge,
        description: f.description,
        image: f.image,
        nb_modules: (f.modules || []).length,
        modules_gratuits: f.modules_gratuits,
        apercu: (f.modules || [])
          .filter(m => m.gratuit)
          .map(m => ({
            id: m.id,
            titre: m.titre,
            duree: m.duree,
            contenu: m.contenu,
            gratuit: true
          }))
      }))
    );

  } catch (e) {
    console.error('FORMATIONS ERROR:', e.message);
    res.status(500).json({
      error: 'Erreur serveur: ' + e.message
    });
  }
});


// Une formation
router.get('/:id', async (req, res) => {
  try {
    const { data: formation, error } = await supabase
      .from('formations')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;

    if (!formation) {
      return res.status(404).json({
        error: 'Formation introuvable'
      });
    }

    const decoded = getUserFromToken(req);

    let acces = false;

    if (decoded) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, formations, role')
        .eq('id', decoded.id)
        .maybeSingle();

      if (userError) throw userError;

      if (
        user &&
        (
          user.role === 'owner' ||
          (user.formations || []).includes(req.params.id)
        )
      ) {
        acces = true;
      }
    }

    const modules = (formation.modules || []).map(m => ({
      id: m.id,
      titre: m.titre,
      duree: m.duree,
      contenu: (m.gratuit || acces) ? m.contenu : null,
      gratuit: m.gratuit,
      verrouille: !m.gratuit && !acces
    }));

    res.json({
      ...formation,
      modules,
      acces
    });

  } catch (e) {
    console.error('FORMATION ERROR:', e.message);
    res.status(500).json({
      error: 'Erreur serveur: ' + e.message
    });
  }
});


module.exports = router;