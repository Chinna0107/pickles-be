require('dotenv').config();
const pool = require('./db');

async function sendNotification(order) {
  const res = await fetch(`https://graph.facebook.com/v25.0/${process.env.META_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: process.env.ADMIN_WHATSAPP,
      type: 'template',
      template: {
        name: 'new_order_alert',
        language: { code: 'en_US' },
        components: [{ type: 'body', parameters: [
          { type: 'text', text: String(order.id) },
          { type: 'text', text: String(order.total) },
          { type: 'text', text: String(order.mobile) }
        ]}]
      }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.messages?.[0]?.id;
}

async function main() {
  const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at ASC');
  console.log(`Found ${rows.length} orders. Sending notifications...`);
  for (const order of rows) {
    try {
      const msgId = await sendNotification(order);
      console.log(`✅ Order #${order.id} | ₹${order.total} | ${order.mobile} → ${msgId}`);
      await new Promise(r => setTimeout(r, 1000)); // 1s delay to avoid rate limit
    } catch (err) {
      console.error(`❌ Order #${order.id} failed:`, err.message);
    }
  }
  console.log('Done!');
  process.exit(0);
}

main();
