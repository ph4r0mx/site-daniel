const express = require('express');
const serverless = require('serverless-http');

const app = express();

app.get('/api/formations', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Express + Netlify fonctionnent'
  });
});

module.exports.handler = serverless(app);