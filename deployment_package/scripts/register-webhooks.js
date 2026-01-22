require('dotenv').config();
const { registerWebhooks } = require('../src/lib/woocommerce');

async function run() {
  console.log('Registering webhooks...');
  const result = await registerWebhooks();
  console.log('Result:', result);
  process.exit(0);
}

run().catch(error => {
  console.error('Error registering webhooks:', error);
  process.exit(1);
});
