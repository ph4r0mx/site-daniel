require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Récupérer toutes les données nécessaires au fonctionnement actuel
async function readDB() {
  const [usersResult, formationsResult, ordersResult] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('formations').select('*'),
    supabase.from('orders').select('*')
  ]);

  if (usersResult.error) throw usersResult.error;
  if (formationsResult.error) throw formationsResult.error;
  if (ordersResult.error) throw ordersResult.error;

  return {
    users: usersResult.data,
    formations: formationsResult.data,
    orders: ordersResult.data
  };
}

module.exports = {
  supabase,
  readDB
};