const router = require('express').Router();
const pool = require('../db');
const { authAdmin } = require('../middleware/auth');

// GET /api/products
router.get('/', async (req, res) => {
  const { category } = req.query;
  try {
    const query = category
      ? 'SELECT * FROM products WHERE category = $1 ORDER BY id'
      : 'SELECT * FROM products ORDER BY id';
    const result = await pool.query(query, category ? [category] : []);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE slug = $1', [req.params.slug]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — admin: add product
router.post('/', authAdmin, async (req, res) => {
  const { slug, name, category, tag, emoji, short_desc, full_desc, spice, benefits, ingredients, prices, images } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (slug, name, category, tag, emoji, short_desc, full_desc, spice, benefits, ingredients, prices, images)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [slug, name, category, tag, emoji, short_desc, full_desc, spice, benefits, ingredients, JSON.stringify(prices), images]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id — admin: edit product
router.put('/:id', authAdmin, async (req, res) => {
  const { name, category, tag, emoji, short_desc, full_desc, spice, benefits, ingredients, prices, images, in_stock } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, category=$2, tag=$3, emoji=$4, short_desc=$5, full_desc=$6,
       spice=$7, benefits=$8, ingredients=$9, prices=$10, images=$11, in_stock=$12
       WHERE id=$13 RETURNING *`,
      [name, category, tag, emoji, short_desc, full_desc, spice, benefits, ingredients, JSON.stringify(prices), images, in_stock, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id — admin: delete product
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
