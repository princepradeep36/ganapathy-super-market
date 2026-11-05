// Product brands, worked out from the start of the product name (the shop has no brand field).
// Each entry is the brand's display name and the name beginnings that belong to it.
// To add a brand: add a line here. Longer beginnings are tried first, so "Swetha Telugu"
// wins over "Telugu Foods", and plain words such as "Fresh" or "Indian" are never brands.
const LIST: [string, ...string[]][] = [
  ['A-1 Chips', 'A-1 '],
  ['A2B', 'A2B '],
  ['Aachi', 'Aachi '],
  ['Aashirvaad', 'Aashirvaad '],
  ['Ahmed', 'Ahmed '],
  ['Aiva', 'Aiva '],
  ['Ajinomoto', 'Ajinomoto'],
  ['Akash', 'Akash '],
  ['AliBaba', 'AliBaba '],
  ['Amul', 'Amul '],
  ['Anil', 'Anil '],
  ['Annam', 'Annam '],
  ['AppnaBaba', 'AppnaBaba '],
  ['Aroy-D', 'Aroy-D '],
  ['Ashoka', 'Ashoka '],
  ['Bambino', 'Bambino '],
  ['Bigen', 'Bigen '],
  ['Bikano', 'Bikano '],
  ['BK', 'BK '],
  ['Britannia', 'Britannia '],
  ['Brooke Bond', 'Brooke Bond '],
  ['Bru', 'Bru '],
  ['Chakra', 'Chakra '],
  ['Chaokoh', 'Chaokoh '],
  ['Chin Chin', 'Chin Chin '],
  ["Ching's", "Ching's ", 'Ching’s '],
  ['Coca-Cola', 'Coca-Cola'],
  ['Cochin', 'Cochin '],
  ['Corny', 'Corny '],
  ['Cycle', 'Cycle '],
  ['Daawat', 'Daawat '],
  ['Dabur', 'Dabur '],
  ['Dan Sukker', 'Dan Sukker '],
  ['Deepam', 'Deepam '],
  ['Delmege', 'Delmege '],
  ['Double Horse', 'Double Horse '],
  ['Eastern', 'Eastern '],
  ['Everest', 'Everest '],
  ['Fitne', 'Fitne '],
  ['Foco', 'Foco '],
  ['Fortune', 'Fortune '],
  ['Frooti', 'Frooti'],
  ['Fresh Way', 'Fresh Way '],
  ['Fun Light', 'Fun Light '],
  ['Fur Fur', 'Fur Fur '],
  ['Garam', 'Garam '],
  ['GRB', 'GRB '],
  ["Haldiram's", "Haldiram's ", 'Haldiram’s ', 'Haldirams '],
  ['Hamdard', 'Hamdard '],
  ['Harischandra', 'Harischandra '],
  ['Heera', 'Heera '],
  ['Herbul', 'Herbul '],
  ['Himalaya', 'Himalaya '],
  ['Horlicks', 'Horlicks'],
  ['Idhayam', 'Idhayam '],
  ['India Gate', 'India Gate '],
  ['Kaalar', 'Kaalar '],
  ['Karishmaa', 'Karishmaa '],
  ['Khanum', 'Khanum '],
  ["King's Crown", "King's Crown ", 'King’s Crown '],
  ['Kings', 'Kings '],
  ['Kissan', 'Kissan '],
  ['KTC', 'KTC '],
  ['Laziza', 'Laziza '],
  ['LG', 'LG '],
  ['Lifebuoy', 'Lifebuoy '],
  ['Link', 'Link Samahan'],
  ['Maekrua', 'Maekrua '],
  ['Maggi', 'Maggi '],
  ['Maliban', 'Maliban '],
  ['Manna', 'Manna '],
  ['MD', 'MD '],
  ['MDH', 'MDH '],
  ['MDK', 'MDK '],
  ['Medimix', 'Medimix '],
  ['MM', 'MM '],
  ['MR', 'MR '],
  ['MTR', 'MTR '],
  ['Mysore Sandal', 'Mysore Sandal '],
  ['Narasu’s', "Narasu's ", 'Narasu’s '],
  ['National', 'National '],
  ['Native Food Store', 'Native Food '],
  ['Nature Power', 'Nature Power '],
  ['Nestlé', 'Nestle ', 'Nestlé '],
  ['NFS', 'NFS '],
  ['Nur Jahan', 'Nur Jahan '],
  ['Nutrapoorna', 'Nutrapoorna '],
  ['P.A.N.', 'P.A.N. '],
  ['Pantai', 'Pantai '],
  ['Parle', 'Parle-G', 'Parle '],
  ["Patak's", "Patak's ", 'Patak’s '],
  ['Patanjali', 'Patanjali '],
  ['Pavithram', 'Pavithram '],
  ['Pears', 'Pears '],
  ['PG Tips', 'PG Tips '],
  ['Pillsbury', 'Pillsbury '],
  ['Pooja Gold', 'Pooja Gold '],
  ['Poorna', 'Poorna '],
  ['Priya', 'Priya '],
  ['Rin', 'Rin '],
  ['Sakthi', 'Sakthi '],
  ['Shan', 'Shan '],
  ['Shezan', 'Shezan '],
  ['Squid', 'Squid '],
  ['Subh', 'Subh '],
  ['Sunfeast', 'Sunfeast '],
  ['Suryaa', 'Suryaa '],
  ['Swetha', 'Swetha '],
  ['Tapal', 'Tapal '],
  ['Tasty Nibbles', 'Tasty Nibbles '],
  ['Tata', 'Tata '],
  ['Telugu Foods', 'Telugu Foods ', 'Telugu '],
  ['Tilda', 'Tilda '],
  ['TN', 'TN '],
  ["Tony's", "Tony's ", 'Tony’s ', 'Tonys '],
  ['TRS', 'TRS '],
  ['Udhaiyam', 'Udhaiyam '],
  ['Valor', 'Valor '],
  ['Vandevi', 'Vandevi '],
  ['Vel', 'Vel '],
  ['Vim', 'Vim '],
  ['Wagh Bakri', 'Wagh Bakri '],
];

export type Brand = { name: string; slug: string };

const slug = (s: string) => s.toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const BRANDS: Brand[] = LIST.map(([name]) => ({ name, slug: slug(name) }));

const PREFIXES = LIST.flatMap(([name, ...starts]) => starts.map((s) => ({ s: s.toLowerCase(), brand: { name, slug: slug(name) } })))
  .sort((a, b) => b.s.length - a.s.length);

/** The brand of a product, from the start of its name, or null for unbranded items (vegetables, fish…). */
export function brandOf(productName: string): Brand | null {
  const n = productName.trim().toLowerCase();
  return PREFIXES.find((p) => n.startsWith(p.s))?.brand ?? null;
}

export const brandBySlug = (s: string) => BRANDS.find((b) => b.slug === s) ?? null;

/** Brands that have products, with a count and a photo to show, biggest first. */
export function brandsWithProducts<P extends { name: string; image: string; stock: number }>(products: P[]) {
  const map = new Map<string, Brand & { count: number; image: string | null }>();
  for (const p of products) {
    const b = brandOf(p.name);
    if (!b) continue;
    const e = map.get(b.slug) ?? { ...b, count: 0, image: null };
    e.count++;
    // Use an in-stock product's real photo as the brand's picture.
    if (!e.image && p.stock > 0 && (p.image.startsWith('/') || p.image.startsWith('http'))) e.image = p.image;
    map.set(b.slug, e);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
