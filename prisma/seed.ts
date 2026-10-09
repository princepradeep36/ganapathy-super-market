import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// [name, slug, icon]
const categories: [string, string, string][] = [
  ['Rice & Grains', 'rice-grains', '🍚'],
  ['Atta & Flour', 'atta-flour', '🌾'],
  ['Dals & Lentils', 'dals-lentils', '🫘'],
  ['Fresh Vegetables', 'fresh-vegetables', '🥬'],
  ['Spices & Masala', 'spices', '🌶️'],
  ['Snacks & Sweets', 'snacks', '🥨'],
  ['Dairy & Frozen', 'dairy', '🧀'],
  ['Tea & Coffee', 'tea-coffee', '☕'],
  ['Oil & Ghee', 'oil-ghee', '🫙'],
  ['Pickles & Ready to Eat', 'ready-to-eat', '🍜'],
];

// [categorySlug, name, slug, unit, description, priceÖre, salePriceÖre|null, stock, emoji, featured]
const products: [string, string, string, string, string, number, number | null, number, string, boolean][] = [
  ['rice-grains', 'Ponni Boiled Rice', 'ponni-boiled-rice', '5 kg', 'Premium South Indian boiled rice — soft, fluffy and perfect for everyday meals.', 15900, 13900, 25, '🍚', true],
  ['rice-grains', 'India Gate Basmati Rice', 'basmati-rice', '5 kg', 'Long-grain aged basmati for biryani and pulao.', 24900, null, 14, '🍚', false],
  ['rice-grains', 'Idli Rice', 'idli-rice', '5 kg', 'Short-grain parboiled rice for soft idli and dosa batter.', 13900, null, 18, '🍚', false],
  ['atta-flour', 'Aashirvaad Whole Wheat Atta', 'aashirvaad-atta', '5 kg', 'Whole wheat flour for soft chapati and phulka.', 14900, null, 18, '🌾', true],
  ['atta-flour', 'Besan (Gram Flour)', 'besan', '1 kg', 'Fine gram flour for pakora, bajji and sweets.', 3900, 3400, 30, '🌾', false],
  ['atta-flour', 'Rava / Sooji', 'rava', '1 kg', 'Fine semolina for upma, kesari and rava dosa.', 2900, null, 22, '🌾', false],
  ['dals-lentils', 'Toor Dal', 'toor-dal', '1 kg', 'Protein-rich split pigeon peas for sambar and dal.', 5900, 5500, 40, '🫘', true],
  ['dals-lentils', 'Urad Dal (Whole White)', 'urad-dal', '1 kg', 'For idli, dosa and vada batter.', 5400, null, 26, '🫘', false],
  ['dals-lentils', 'Chana Dal', 'chana-dal', '1 kg', 'Split Bengal gram for dal, tadka and snacks.', 4500, null, 4, '🫘', false],
  ['fresh-vegetables', 'Indian Brinjal', 'indian-brinjal', '500 g', 'Small purple brinjal, selected for Indian cooking.', 3900, null, 15, '🍆', false],
  ['fresh-vegetables', 'Okra (Bhindi)', 'okra', '500 g', 'Tender lady’s finger, fresh this week.', 3500, 2900, 12, '🥬', true],
  ['fresh-vegetables', 'Curry Leaves', 'curry-leaves', '1 bunch', 'Fragrant fresh curry leaves.', 1500, null, 30, '🌿', false],
  ['fresh-vegetables', 'Green Chillies', 'green-chillies', '200 g', 'Hot and fresh Indian green chillies.', 1900, null, 3, '🌶️', false],
  ['fresh-vegetables', 'Alphonso Mangoes', 'alphonso-mangoes', '6 pcs', 'Sweet, aromatic king of mangoes (seasonal).', 14900, 12900, 8, '🥭', true],
  ['spices', 'Sambar Powder', 'sambar-powder', '200 g', 'Aromatic South Indian spice blend.', 3500, 2900, 35, '🌶️', false],
  ['spices', 'Garam Masala', 'garam-masala', '100 g', 'Warm spice mix for curries and biryani.', 3200, null, 28, '🧂', false],
  ['spices', 'Turmeric Powder', 'turmeric-powder', '200 g', 'Bright, pure haldi powder.', 2500, null, 40, '🧂', false],
  ['snacks', 'Murukku', 'murukku', '250 g', 'Crunchy traditional South Indian snack.', 2900, null, 30, '🥨', false],
  ['snacks', 'Haldiram’s Aloo Bhujia', 'aloo-bhujia', '400 g', 'Spicy potato noodle namkeen.', 4500, 3900, 24, '🥨', true],
  ['snacks', 'Parle-G Biscuits', 'parle-g', '800 g', 'The classic glucose biscuit — perfect with chai.', 3200, null, 0, '🍪', false],
  ['dairy', 'Fresh Paneer', 'paneer', '500 g', 'Soft cooking paneer for curries and tikka.', 6900, 6500, 12, '🧀', false],
  ['dairy', 'Frozen Malabar Parotta', 'malabar-parotta', '5 pcs', 'Flaky layered parotta — heat and serve.', 4900, null, 20, '🫓', false],
  ['tea-coffee', 'Filter Coffee Powder', 'filter-coffee', '500 g', 'South Indian filter coffee blend with chicory.', 8900, null, 20, '☕', true],
  ['tea-coffee', 'Red Label Tea', 'red-label-tea', '500 g', 'Strong CTC tea for masala chai.', 6900, 5900, 26, '🍵', false],
  ['oil-ghee', 'Pure Cow Ghee', 'cow-ghee', '1 L', 'Rich, aromatic ghee for cooking and sweets.', 18900, null, 10, '🫙', false],
  ['oil-ghee', 'Cold Pressed Sesame Oil', 'sesame-oil', '1 L', 'Traditional gingelly oil for South Indian cooking.', 11900, 9900, 9, '🫙', false],
  ['ready-to-eat', 'Mango Pickle', 'mango-pickle', '500 g', 'Tangy, spicy avakaya-style mango pickle.', 4900, null, 16, '🥭', false],
  ['ready-to-eat', 'MTR Ready Rasam', 'mtr-rasam', '300 g', 'Heat-and-eat rasam in 2 minutes.', 3900, null, 14, '🍜', false],
];

async function main() {
  const catIds = new Map<string, string>();
  for (const [i, [name, slug, icon]] of categories.entries()) {
    const c = await db.category.upsert({ where: { slug }, update: {}, create: { name, slug, icon, sortOrder: i + 1 } });
    // Give categories created by older versions an icon, without overwriting admin edits.
    if (c.icon === '🛒') await db.category.update({ where: { id: c.id }, data: { icon, sortOrder: c.sortOrder || i + 1 } });
    catIds.set(slug, c.id);
  }

  // Demo products are only added to an empty shop, so real catalogue edits are never touched.
  const existing = await db.product.count();
  if (existing > 0 && process.env.SEED_DEMO !== 'force') {
    console.log(`Seed: ${existing} products already exist — skipping demo catalogue.`);
    return;
  }
  for (const [cat, name, slug, unit, description, price, salePrice, stock, image, featured] of products) {
    await db.product.upsert({
      where: { slug },
      update: {},
      create: { name, slug, unit, description, price, salePrice, stock, image, featured, categoryId: catIds.get(cat)! },
    });
  }
  await db.coupon.upsert({
    where: { code: 'PONGAL10' },
    update: {},
    create: { code: 'PONGAL10', name: 'Pongal Special', type: 'PERCENT', value: 10, minOrder: 30000, maxDiscount: 10000, stackWithSales: true, active: true },
  });
  console.log('Seed: demo catalogue created.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
