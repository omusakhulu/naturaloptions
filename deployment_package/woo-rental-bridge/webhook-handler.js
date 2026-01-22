require('dotenv').config({ path: '.env' });
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const port = process.env.WEBHOOK_PORT || 3001;
const webhookSecret = process.env.WOO_WEBHOOK_SECRET || 'your-webhook-secret';

// Middleware to verify webhook signature
const verifyWebhook = (req, res, next) => {
  try {
    const signature = req.headers['x-wc-webhook-signature'];
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const calculatedSignature = hmac.update(JSON.stringify(req.body)).digest('base64');
    
    if (signature !== calculatedSignature) {
      console.error('⚠️ Webhook signature verification failed');
      return res.status(401).send('Invalid webhook signature');
    }
    next();
  } catch (error) {
    console.error('Error verifying webhook:', error);
    res.status(500).send('Error verifying webhook');
  }
};

app.use(bodyParser.json());

// Webhook endpoint
app.post('/api/webhook/orders', verifyWebhook, (req, res) => {
  const event = req.headers['x-wc-webhook-topic'];
  const data = req.body;
  
  console.log(`\n📦 Received webhook event: ${event}`);
  console.log('Webhook payload:', JSON.stringify(data, null, 2));
  
  // Handle different webhook events
  switch (event) {
    case 'order.created':
      console.log('🆕 New order created:', data.id);
      // Process new order
      break;
    case 'order.updated':
      console.log('🔄 Order updated:', data.id);
      // Process order update
      break;
    default:
      console.log(`ℹ️ Unhandled event type: ${event}`);
  }
  
  res.status(200).send('Webhook received');
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Webhook handler running on http://localhost:${port}`);
  console.log(`🔔 Listening for webhook events at http://localhost:${port}/api/webhook/orders`);
  console.log('Make sure this URL is accessible from the internet (use ngrok or similar for local testing)');
});

module.exports = app;
