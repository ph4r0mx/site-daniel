const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const auth = require('../../api/auth');
const formations = require('../../api/formations');
const payment = require('../../api/payment');
const content = require('../../api/content');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', auth);
app.use('/api/formations', formations);
app.use('/api/payment', payment);
app.use('/api/content', content);

module.exports.handler = serverless(app);