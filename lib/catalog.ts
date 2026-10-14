import type { Prisma } from '@prisma/client';

type Cat = { id: string; parentId: string | null };

/** Top-level categories, each with its sub-categories (in the order given). */
export function categoryTree<C extends Cat>(cats: C[]) {
  return cats.filter((c) => !c.parentId).map((c) => ({ ...c, children: cats.filter((x) => x.parentId === c.id) }));
}

/** Products in a category or in any of its sub-categories. */
export const inCategory = (slug: string): Prisma.ProductWhereInput => ({
  OR: [{ category: { slug } }, { category: { parent: { slug } } }],
});

/** Collections customers can see right now (switched on and inside their dates). */
export const liveCollection = (now: Date): Prisma.CollectionWhereInput => ({
  active: true,
  AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
});
