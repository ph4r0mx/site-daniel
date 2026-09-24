const express = require('express');

const app = express();

app.get('/formations', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Express fonctionne sur Netlify'
  });
});

exports.handler = require('serverless-http')(app);