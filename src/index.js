require('dotenv').config();

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { handleWebhook } = require('./line/webhook');
const { startScheduler } = require('./sns/scheduler');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const app = express();

// LINE signature verification middleware
function verifySignature(req, res, buf) {
  const signature = req.headers['x-line-signature'];
  if (!signature) return;

  const hmac = crypto.createHmac('SHA256', process.env.LINE_CHANNEL_SECRET);
  const digest = hmac.update(buf).digest('base64');

  if (signature !== digest) {
    throw new Error('Invalid signature');
  }
}

app.use('/webhook', express.json({ verify: verifySignature }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'AI Secretary LINE Bot' });
});

// LINE webhook endpoint
app.post('/webhook', async (req, res) => {
  // Respond immediately to LINE
  res.sendStatus(200);

  const events = req.body.events || [];

  for (const event of events) {
    try {
      await handleWebhook(event);
    } catch (error) {
      console.error('Webhook handler error:', error);
    }
  }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AI Secretary running on port ${PORT}`);

  // Start SNS scheduler
  startScheduler();
});
