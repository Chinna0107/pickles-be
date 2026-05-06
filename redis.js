const { createClient } = require('redis');

let client = null;

if (process.env.REDIS_URL) {
  client = createClient({ url: process.env.REDIS_URL });
  
  client.on('error', (err) => console.error('Redis error:', err.message));
  client.on('connect', () => console.log('✅ Redis connected'));
  
  client.connect().catch(err => {
    console.error('Redis connect failed:', err.message);
    client = null;
  });
} else {
  console.log('⚠️  Redis disabled (no REDIS_URL)');
}

module.exports = client;
