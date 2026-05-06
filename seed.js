const pool = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const products = [
  { slug: 'mango-avakaya', name: 'Mango Avakaya', category: 'veg', tag: 'Bestseller', emoji: '🥭', short_desc: 'Traditional Andhra raw mango pickle with mustard & red chilli', spice: 5, prices: [{ weight: '250g', price: 180, originalPrice: 220 }, { weight: '500g', price: 320, originalPrice: 380 }, { weight: '1kg', price: 580, originalPrice: 680 }] },
  { slug: 'gongura-pachadi', name: 'Gongura Pachadi', category: 'veg', tag: 'Popular', emoji: '🌿', short_desc: "Tangy sorrel leaves pickle — Andhra's pride", spice: 4, prices: [{ weight: '250g', price: 160, originalPrice: 200 }, { weight: '500g', price: 290, originalPrice: 360 }, { weight: '1kg', price: 540, originalPrice: 660 }] },
  { slug: 'tomato-pickle', name: 'Tomato Pickle', category: 'veg', tag: 'New', emoji: '🍅', short_desc: 'Sun-dried tomato pickle with aromatic spices', spice: 3, prices: [{ weight: '250g', price: 140, originalPrice: 170 }, { weight: '500g', price: 260, originalPrice: 320 }, { weight: '1kg', price: 480, originalPrice: 600 }] },
  { slug: 'lemon-pickle', name: 'Lemon Pickle', category: 'veg', tag: 'Classic', emoji: '🍋', short_desc: 'Zesty lemon pickle aged to perfection', spice: 3, prices: [{ weight: '250g', price: 150, originalPrice: 185 }, { weight: '500g', price: 280, originalPrice: 350 }, { weight: '1kg', price: 520, originalPrice: 640 }] },
  { slug: 'garlic-pickle', name: 'Garlic Pickle', category: 'veg', tag: 'Hot', emoji: '🧄', short_desc: 'Bold garlic pickle with fiery Guntur chillies', spice: 5, prices: [{ weight: '250g', price: 170, originalPrice: 210 }, { weight: '500g', price: 310, originalPrice: 390 }, { weight: '1kg', price: 580, originalPrice: 710 }] },
  { slug: 'amla-pickle', name: 'Amla Pickle', category: 'veg', tag: 'Healthy', emoji: '🫐', short_desc: 'Vitamin-rich gooseberry pickle with mild spices', spice: 2, prices: [{ weight: '250g', price: 130, originalPrice: 160 }, { weight: '500g', price: 240, originalPrice: 300 }, { weight: '1kg', price: 450, originalPrice: 560 }] },
  { slug: 'chicken-pickle', name: 'Chicken Pickle', category: 'nonveg', tag: 'Bestseller', emoji: '🍗', short_desc: 'Tender chicken pieces marinated in Andhra spice blend', spice: 5, prices: [{ weight: '250g', price: 320, originalPrice: 380 }, { weight: '500g', price: 580, originalPrice: 700 }, { weight: '1kg', price: 1050, originalPrice: 1280 }] },
  { slug: 'mutton-pickle', name: 'Mutton Pickle', category: 'nonveg', tag: 'Premium', emoji: '🥩', short_desc: 'Slow-cooked mutton pickle with rich masala', spice: 4, prices: [{ weight: '250g', price: 380, originalPrice: 450 }, { weight: '500g', price: 690, originalPrice: 850 }, { weight: '1kg', price: 1250, originalPrice: 1550 }] },
  { slug: 'prawn-pickle', name: 'Prawn Pickle', category: 'nonveg', tag: 'Seafood', emoji: '🦐', short_desc: 'Fresh prawns pickled in coastal Andhra style', spice: 4, prices: [{ weight: '250g', price: 350, originalPrice: 420 }, { weight: '500g', price: 640, originalPrice: 800 }, { weight: '1kg', price: 1150, originalPrice: 1480 }] },
  { slug: 'fish-pickle', name: 'Fish Pickle', category: 'nonveg', tag: 'Popular', emoji: '🐟', short_desc: 'Boneless fish pickle with tangy tamarind base', spice: 4, prices: [{ weight: '250g', price: 300, originalPrice: 360 }, { weight: '500g', price: 550, originalPrice: 680 }, { weight: '1kg', price: 1000, originalPrice: 1280 }] },
  { slug: 'egg-pickle', name: 'Egg Pickle', category: 'nonveg', tag: 'Unique', emoji: '🥚', short_desc: 'Boiled eggs pickled in spicy masala gravy', spice: 3, prices: [{ weight: '250g', price: 220, originalPrice: 260 }, { weight: '500g', price: 410, originalPrice: 490 }, { weight: '1kg', price: 760, originalPrice: 920 }] },
  { slug: 'crab-pickle', name: 'Crab Pickle', category: 'nonveg', tag: 'Special', emoji: '🦀', short_desc: 'Coastal crab pickle — a rare delicacy', spice: 5, prices: [{ weight: '250g', price: 420, originalPrice: 500 }, { weight: '500g', price: 780, originalPrice: 950 }, { weight: '1kg', price: 1420, originalPrice: 1750 }] },
  { slug: 'kandi-podi', name: 'Kandi Podi', category: 'karam', tag: 'Bestseller', emoji: '🌶️', short_desc: 'Roasted lentil powder — perfect with rice & ghee', spice: 3, prices: [{ weight: '200g', price: 120, originalPrice: 150 }, { weight: '400g', price: 220, originalPrice: 280 }, { weight: '800g', price: 410, originalPrice: 520 }] },
  { slug: 'nuvvula-podi', name: 'Nuvvula Podi', category: 'karam', tag: 'Nutty', emoji: '🫘', short_desc: 'Sesame seed powder with aromatic spices', spice: 2, prices: [{ weight: '200g', price: 110, originalPrice: 140 }, { weight: '400g', price: 200, originalPrice: 260 }, { weight: '800g', price: 370, originalPrice: 480 }] },
  { slug: 'palli-podi', name: 'Palli Podi', category: 'karam', tag: 'Classic', emoji: '🥜', short_desc: 'Roasted groundnut powder with curry leaves', spice: 3, prices: [{ weight: '200g', price: 100, originalPrice: 130 }, { weight: '400g', price: 185, originalPrice: 240 }, { weight: '800g', price: 345, originalPrice: 450 }] },
  { slug: 'kobbari-podi', name: 'Kobbari Podi', category: 'karam', tag: 'Coconut', emoji: '🥥', short_desc: 'Dry coconut powder with red chilli & garlic', spice: 3, prices: [{ weight: '200g', price: 115, originalPrice: 145 }, { weight: '400g', price: 210, originalPrice: 270 }, { weight: '800g', price: 390, originalPrice: 500 }] },
  { slug: 'karivepaku-podi', name: 'Karivepaku Podi', category: 'karam', tag: 'Aromatic', emoji: '🌿', short_desc: 'Curry leaf powder — fragrant & flavorful', spice: 2, prices: [{ weight: '200g', price: 105, originalPrice: 135 }, { weight: '400g', price: 195, originalPrice: 250 }, { weight: '800g', price: 360, originalPrice: 470 }] },
  { slug: 'mirchi-karam', name: 'Mirchi Karam', category: 'karam', tag: 'Spicy', emoji: '🌶️', short_desc: 'Pure Guntur chilli powder blend — extra hot', spice: 5, prices: [{ weight: '200g', price: 130, originalPrice: 160 }, { weight: '400g', price: 240, originalPrice: 310 }, { weight: '800g', price: 450, originalPrice: 580 }] },
];

async function seed() {
  // Create admin
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  await pool.query(
    'INSERT INTO admins (email, password) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
    [process.env.ADMIN_EMAIL || 'admin@ompickles.com', hash]
  );
  console.log('✅ Admin created');

  // Seed products
  for (const p of products) {
    await pool.query(
      `INSERT INTO products (slug, name, category, tag, emoji, short_desc, spice, prices)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (slug) DO NOTHING`,
      [p.slug, p.name, p.category, p.tag, p.emoji, p.short_desc, p.spice, JSON.stringify(p.prices)]
    );
  }
  console.log('✅ Products seeded');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err.message);
  process.exit(1);
});
