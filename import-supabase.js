require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DB_PATH = path.join(__dirname, 'data', 'db.json');

async function importData() {
  try {
    console.log('📦 Lecture de db.json...');

    const db = JSON.parse(
      fs.readFileSync(DB_PATH, 'utf8')
    );

    console.log(`👤 Utilisateurs : ${db.users.length}`);
    console.log(`🎓 Formations : ${db.formations.length}`);
    console.log(`💳 Commandes : ${db.orders.length}`);

    // USERS
    if (db.users.length > 0) {
      const users = db.users.map(user => ({
        id: user.id,
        nom: user.nom,
        email: user.email,
        password: user.password,
        formations: user.formations || [],
        role: user.role || 'user',
        created_at: user.createdAt || new Date().toISOString()
      }));

      const { error } = await supabase
        .from('users')
        .upsert(users, { onConflict: 'id' });

      if (error) throw error;

      console.log('✅ Utilisateurs importés');
    }

    // FORMATIONS
    if (db.formations.length > 0) {
      const formations = db.formations.map(formation => ({
        id: formation.id,
        categorie: formation.categorie,
        titre: formation.titre,
        sous_titre: formation.sous_titre,
        prix: formation.prix,
        formule: formation.formule,
        badge: formation.badge,
        image: formation.image,
        description: formation.description,
        modules_gratuits: formation.modules_gratuits || 0,
        modules: formation.modules || []
      }));

      const { error } = await supabase
        .from('formations')
        .upsert(formations, { onConflict: 'id' });

      if (error) throw error;

      console.log('✅ Formations importées');
    }

    // ORDERS
    if (db.orders.length > 0) {
      const orders = db.orders.map(order => ({
        id: order.id,
        user_id: order.user_id,
        formation_id: order.formation_id,
        session_id: order.session_id,
        montant: order.montant,
        statut: order.statut,
        date: order.date
      }));

      const { error } = await supabase
        .from('orders')
        .upsert(orders, { onConflict: 'id' });

      if (error) throw error;

      console.log('✅ Commandes importées');
    }

    console.log('');
    console.log('🎉 IMPORT TERMINÉ !');

  } catch (error) {
    console.error('');
    console.error('❌ ERREUR IMPORT :');
    console.error(error.message);
    process.exit(1);
  }
}

importData();
