const pool = require('./db');

async function verifyProducts() {
  try {
    // Get all products
    const result = await pool.query('SELECT slug, name, category, rating, reviews FROM products ORDER BY category, name');
    
    console.log('📦 Products in Database:');
    console.log('========================');
    
    let currentCategory = '';
    result.rows.forEach(product => {
      if (product.category !== currentCategory) {
        currentCategory = product.category;
        console.log(`\n🏷️  ${currentCategory.toUpperCase()} CATEGORY:`);
      }
      console.log(`   ✅ ${product.name} (${product.rating}⭐ • ${product.reviews} reviews)`);
    });
    
    console.log(`\n📊 Total Products: ${result.rows.length}`);
    
    // Check categories
    const categories = await pool.query('SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY category');
    console.log('\n📋 Products by Category:');
    categories.rows.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.count} products`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification error:', err.message);
    process.exit(1);
  }
}

verifyProducts();