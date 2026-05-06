const router = require('express').Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authCustomer } = require('../middleware/auth');

// POST /api/customer/login — email + mobile
router.post('/login', async (req, res) => {
  const { email, mobile } = req.body;
  if (!email || !mobile)
    return res.status(400).json({ error: 'Email and mobile are required' });

  const token = jwt.sign(
    { email: email.toLowerCase(), mobile, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, email: email.toLowerCase(), mobile });
});

// GET /api/customer/dashboard — protected
router.get('/dashboard', authCustomer, async (req, res) => {
  try {
    const orders = await pool.query(
      'SELECT * FROM orders WHERE mobile = $1 ORDER BY created_at DESC',
      [req.customer.mobile]
    );
    res.json({ email: req.customer.email, mobile: req.customer.mobile, orders: orders.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
