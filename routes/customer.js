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

// GET /api/customer/profile — get customer profile from orders
router.get('/profile', authCustomer, async (req, res) => {
  try {
    // Get customer info and orders from orders table
    const orders = await pool.query(
      'SELECT * FROM orders WHERE email = $1 ORDER BY created_at DESC',
      [req.customer.email]
    );
    
    if (orders.rows.length === 0) {
      return res.json({
        email: req.customer.email,
        mobile: req.customer.mobile,
        orders: [],
        totalOrders: 0,
        totalSpent: 0,
        firstOrderDate: null,
        lastOrderDate: null,
        favoriteItems: []
      });
    }
    
    // Calculate customer statistics
    const totalOrders = orders.rows.length;
    const totalSpent = orders.rows.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
    const firstOrderDate = orders.rows[orders.rows.length - 1].created_at;
    const lastOrderDate = orders.rows[0].created_at;
    
    // Get most recent address from latest order
    const latestOrder = orders.rows.find(order => order.address);
    const recentAddress = latestOrder ? latestOrder.address : null;
    
    // Calculate favorite items (most ordered items)
    const itemCounts = {};
    orders.rows.forEach(order => {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      if (Array.isArray(items)) {
        items.forEach(item => {
          const key = `${item.name}-${item.selectedWeight}`;
          itemCounts[key] = (itemCounts[key] || 0) + item.qty;
        });
      }
    });
    
    const favoriteItems = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([item, count]) => ({ item, count }));
    
    res.json({
      email: req.customer.email,
      mobile: req.customer.mobile,
      orders: orders.rows,
      totalOrders,
      totalSpent,
      firstOrderDate,
      lastOrderDate,
      recentAddress,
      favoriteItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/customer/profile — update customer profile (not needed since we use orders table)
// This endpoint is kept for future use but currently returns read-only data
router.put('/profile', authCustomer, async (req, res) => {
  // Since customer data comes from orders, we return the current profile
  // In the future, this could update a separate customers table if needed
  try {
    const orders = await pool.query(
      'SELECT * FROM orders WHERE email = $1 ORDER BY created_at DESC',
      [req.customer.email]
    );
    
    const totalOrders = orders.rows.length;
    const totalSpent = orders.rows.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
    const firstOrderDate = orders.rows.length > 0 ? orders.rows[orders.rows.length - 1].created_at : null;
    const lastOrderDate = orders.rows.length > 0 ? orders.rows[0].created_at : null;
    const latestOrder = orders.rows.find(order => order.address);
    const recentAddress = latestOrder ? latestOrder.address : null;
    
    res.json({
      email: req.customer.email,
      mobile: req.customer.mobile,
      orders: orders.rows,
      totalOrders,
      totalSpent,
      firstOrderDate,
      lastOrderDate,
      recentAddress,
      message: 'Profile data is read-only and sourced from your orders'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
