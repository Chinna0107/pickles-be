const router = require('express').Router();
const pool = require('../db');
const { authAdmin } = require('../middleware/auth');

// GET /api/reports — supports ?from=YYYY-MM&to=YYYY-MM OR ?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
router.get('/', authAdmin, async (req, res) => {
  try {
    const { from, to, fromDate, toDate } = req.query;

    let dateFilter = '';
    if (fromDate && toDate) {
      dateFilter = `AND created_at >= '${fromDate}' AND created_at < (DATE '${toDate}' + INTERVAL '1 day')`;
    } else if (from && to) {
      dateFilter = `AND created_at >= '${from}-01' AND created_at < (DATE '${to}-01' + INTERVAL '1 month')`;
    }

    const [
      salesByStatus,
      topProducts,
      dailySales,
      monthlySales,
      customerStats,
      ordersForExport,
    ] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) AS count, COALESCE(SUM(total), 0) AS revenue FROM orders WHERE 1=1 ${dateFilter} GROUP BY status`),
      pool.query(`SELECT p->>'name' AS product, SUM((p->>'qty')::int) AS qty_sold FROM orders, jsonb_array_elements(items) AS p WHERE 1=1 ${dateFilter} GROUP BY product ORDER BY qty_sold DESC LIMIT 5`),
      pool.query(`SELECT DATE(created_at) AS date, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue FROM orders WHERE 1=1 ${dateFilter || "AND created_at >= NOW() - INTERVAL '7 days'"} GROUP BY DATE(created_at) ORDER BY date`),
      pool.query(`SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue FROM orders WHERE 1=1 ${dateFilter} GROUP BY month ORDER BY month DESC LIMIT 12`),
      pool.query(`SELECT COUNT(DISTINCT mobile) AS total_customers, COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN mobile END) AS new_this_month FROM orders WHERE 1=1 ${dateFilter}`),
      pool.query(`SELECT id, name, email, mobile, total, status, coupon, address, created_at FROM orders WHERE 1=1 ${dateFilter} ORDER BY created_at DESC`),
    ]);

    res.json({
      salesByStatus: salesByStatus.rows,
      topProducts: topProducts.rows,
      dailySales: dailySales.rows,
      monthlySales: monthlySales.rows,
      customerStats: customerStats.rows[0],
      ordersForExport: ordersForExport.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
