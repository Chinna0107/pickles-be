const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { getQR, isReady } = require('./whatsapp');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/customer', require('./routes/customer'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/upload', require('./routes/upload'));

app.get('/', (req, res) => res.json({ message: '🫙 OM Pickles API is running' }));

app.get('/whatsapp-qr', (req, res) => {
  if (isReady()) return res.send('<h2>✅ WhatsApp is connected!</h2>');
  const qr = getQR();
  if (!qr) return res.send('<h2>⏳ Generating QR... refresh in 5 seconds</h2>');
  res.send(`<h2>Scan QR to connect WhatsApp</h2><img src="${qr}" />`);
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
