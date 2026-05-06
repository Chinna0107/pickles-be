const router = require('express').Router();
const pool = require('../db');
const { authAdmin } = require('../middleware/auth');

// GET /api/reports — admin: full sales report
router.get('/', authAdmin, async (req, res) => {
  try {
    const [
      salesByStatus,
      topProducts,
      dailySales,
      monthlySales,
      customerStats,
    ] = await Promise.all([
      pool.query(`
        SELECT status, COUNT(*) AS count, COALESCE(SUM(total), 0) AS revenue
        FROM orders GROUP BY status
      `),
      pool.query(`
        SELECT p->>'name' AS product, SUM((p->>'qty')::int) AS qty_sold
        FROM orders, jsonb_array_elements(items) AS p
        GROUP BY product ORDER BY qty_sold DESC LIMIT 5
      `),
      pool.query(`
        SELECT DATE(created_at) AS date, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
        FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at) ORDER BY date
      `),
      pool.query(`
        SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
        FROM orders GROUP BY month ORDER BY month DESC LIMIT 6
      `),
      pool.query(`
        SELECT COUNT(DISTINCT mobile) AS total_customers,
          COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN mobile END) AS new_this_month
        FROM orders
      `),
    ]);

    res.json({
      salesByStatus: salesByStatus.rows,
      topProducts: topProducts.rows,
      dailySales: dailySales.rows,
      monthlySales: monthlySales.rows,
      customerStats: customerStats.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
