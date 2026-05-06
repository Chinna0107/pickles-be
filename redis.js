const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('Redis error:', err.message));
client.on('connect', () => console.log('✅ Redis connected'));

client.connect().catch(err => console.error('Redis connect failed:', err.message));

module.exports = client;
