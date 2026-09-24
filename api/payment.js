require('dotenv').config();
const express = require('express');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('./db');
const auth = require('../middleware/auth');

const router = express.Router();

function stripeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? new URLSearchParams(body).toString() : '';
    const options = {
      hostname: 'api.stripe.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Erreur Stripe')); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Créer une session de paiement Stripe
router.post('/create-checkout', auth, async (req, res) => {
  try {
    const { formation_id } = req.body;
    const db = readDB();
    const formation = db.formations.find(f => f.id === formation_id);
    if (!formation) return res.status(404).json({ error: 'Formation introuvable' });

    const user = db.users.find(u => u.id === req.user.id);
    if (user && user.formations.includes(formation_id))
      return res.status(409).json({ error: 'Formation déjà achetée' });

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const session = await stripeRequest('POST', '/v1/checkout/sessions', {
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][product_data][name]': formation.titre,
      'line_items[0][price_data][product_data][description]': formation.description,
      'line_items[0][price_data][unit_amount]': formation.prix * 100,
      'line_items[0][quantity]': '1',
      'mode': 'payment',
      'success_url': `${baseUrl}/dashboard?success=true&formation=${formation_id}&session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${baseUrl}/formations.html?cancelled=true`,
      'metadata[user_id]': req.user.id,
      'metadata[formation_id]': formation_id,
      'customer_email': req.user.email
    });

    if (session.error) return res.status(400).json({ error: session.error.message });
    res.json({ url: session.url, session_id: session.id });

  } catch (e) {
    console.error('STRIPE ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Vérifier et valider le paiement après retour
router.post('/verify', auth, async (req, res) => {
  try {
    const { session_id, formation_id } = req.body;

    const session = await stripeRequest('GET', `/v1/checkout/sessions/${session_id}`, '');

    if (session.payment_status === 'paid') {
      const db = readDB();
      const idx = db.users.findIndex(u => u.id === req.user.id);
      if (idx !== -1 && !db.users[idx].formations.includes(formation_id)) {
        db.users[idx].formations.push(formation_id);
      }
      db.orders.push({
        id: uuidv4(),
        user_id: req.user.id,
        formation_id,
        session_id,
        montant: session.amount_total / 100,
        statut: 'completed',
        date: new Date().toISOString()
      });
      writeDB(db);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Paiement non complété' });
    }
  } catch (e) {
    console.error('VERIFY ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
