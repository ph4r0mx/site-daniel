require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./api/auth'));
app.use('/api/formations', require('./api/formations'));
app.use('/api/payment', require('./api/payment'));
app.use('/api/content', require('./api/content'));

app.get('*', (req, res) => {
  const pages = ['formations', 'login', 'dashboard', 'module'];
  const page = pages.find(p => req.path.includes(p));
  res.sendFile(path.join(__dirname, 'public', page ? page + '.html' : 'index.html'));
});

app.listen(PORT, () => {
  console.log('\n🚀 NEXUS démarré sur http://localhost:' + PORT);
  console.log('💡 Première fois ? Lance: node setup.js\n');
});
