const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authAdmin } = require('../middleware/auth');

// POST /api/admin/login — email + password
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid credentials' });

    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/dashboard — stats overview
router.get('/dashboard', authAdmin, async (req, res) => {
  try {
    const [totalOrders, uniqueCustomers, totalProducts, revenue, recentOrders] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query('SELECT COUNT(DISTINCT mobile) FROM orders'),
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query("SELECT COALESCE(SUM(total), 0) AS revenue FROM orders WHERE status != 'cancelled'"),
      pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5'),
    ]);

    res.json({
      stats: {
        totalOrders: parseInt(totalOrders.rows[0].count),
        totalCustomers: parseInt(uniqueCustomers.rows[0].count),
        totalProducts: parseInt(totalProducts.rows[0].count),
        revenue: parseFloat(revenue.rows[0].revenue),
      },
      recentOrders: recentOrders.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
