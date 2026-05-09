const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let qrImageUrl = null;
let isReady = false;

const wClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  }
});

wClient.on('qr', async qr => {
  qrImageUrl = await qrcode.toDataURL(qr);
  isReady = false;
  console.log('WhatsApp QR generated — visit /whatsapp-qr to scan');
});
wClient.on('ready', () => { isReady = true; qrImageUrl = null; console.log('WhatsApp client ready'); });
wClient.on('auth_failure', () => console.error('WhatsApp auth failed'));

wClient.initialize();

async function sendWhatsApp(mobile, message) {
  if (!isReady) throw new Error('WhatsApp client not ready');
  await wClient.sendMessage(`91${mobile}@c.us`, message);
}

module.exports = { sendWhatsApp, getQR: () => qrImageUrl, isReady: () => isReady };
