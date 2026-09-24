require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('./db');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { nom, email, password } = req.body;

    if (!nom || !email || !password) {
      return res.status(400).json({
        error: 'Tous les champs sont requis'
      });
    }

    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (findError) throw findError;

    if (existingUser) {
      return res.status(409).json({
        error: 'Email déjà utilisé'
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = {
      id: uuidv4(),
      nom,
      email,
      password: hash,
      formations: [],
      role: 'user',
      created_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert(user);

    if (insertError) throw insertError;

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nom: user.nom
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        formations: [],
        role: 'user'
      }
    });

  } catch (e) {
    console.error('REGISTER ERROR:', e.message);
    res.status(500).json({
      error: 'Erreur serveur: ' + e.message
    });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({
        error: 'Email introuvable'
      });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(401).json({
        error: 'Mot de passe incorrect'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nom: user.nom
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        formations: user.formations || [],
        role: user.role
      }
    });

  } catch (e) {
    console.error('LOGIN ERROR:', e.message);
    res.status(500).json({
      error: 'Erreur serveur: ' + e.message
    });
  }
});


router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nom, email, formations, role')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({
        error: 'Introuvable'
      });
    }

    res.json(user);

  } catch (e) {
    console.error('ME ERROR:', e.message);
    res.status(500).json({
      error: 'Erreur serveur: ' + e.message
    });
  }
});


module.exports = router;