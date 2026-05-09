const router = require('express').Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const pool = require('../db');
const { authCustomer, authAdmin } = require('../middleware/auth');
const { sendWhatsApp } = require('../whatsapp');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/orders/create-razorpay-order
router.post('/create-razorpay-order', async (req, res) => {
  const { total } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/verify-payment
router.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature)
    return res.status(400).json({ error: 'Payment verification failed' });

  const { mobile, email, items, subtotal, discount, total, coupon, address } = orderData;
  try {
    const result = await pool.query(
      `INSERT INTO orders (mobile, email, items, subtotal, discount, delivery, total, coupon, address, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed') RETURNING *`,
      [mobile, email, JSON.stringify(items), subtotal, discount || 0, 0, total, coupon || null, address]
    );
    sendWhatsApp(process.env.ADMIN_MOBILE, `🛒 New Order Received!\nOrder #${result.rows[0].id} | ₹${result.rows[0].total}\nCustomer: ${result.rows[0].mobile}`).catch(err => console.error('WhatsApp notify failed:', err.message));
    res.status(201).json({ order: result.rows[0], paymentId: razorpay_payment_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/my — customer: own orders
router.get('/my', authCustomer, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE mobile = $1 ORDER BY created_at DESC',
      [req.customer.mobile]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders — admin: all orders
router.get('/', authAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status
      ? 'SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC'
      : 'SELECT * FROM orders ORDER BY created_at DESC';
    const result = await pool.query(query, status ? [status] : []);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/status — admin: update order status
router.put('/:id/status', authAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/tracking — admin: update tracking info
router.put('/:id/tracking', authAdmin, async (req, res) => {
  const { trackingId, trackingLink } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE orders SET tracking_id = $1, tracking_link = $2 WHERE id = $3 RETURNING *',
      [trackingId || null, trackingLink || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
