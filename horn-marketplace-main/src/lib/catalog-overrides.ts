/** Live demo rows still stored under the original grocery and electronics titles. */
export const CATALOG_OVERRIDES: Record<
  string,
  {
    title: string;
    description: string;
    category: string;
    price_usd: number;
    price_slsh: number;
    stock: number;
    photos: string[];
  }
> = {
  "8157ae3b-62c4-41e1-b630-39b2e1e2fe85": {
    title: "Cladding Sheet",
    description: "Exterior aluminium cladding sheets for shops and homes. Sold per sheet.",
    category: "Home",
    price_usd: 55,
    price_slsh: 467500,
    stock: 40,
    photos: ["https://images.pexels.com/photos/9685870/pexels-photo-9685870.jpeg?auto=compress&cs=tinysrgb&w=1200"],
  },
  "9c57497c-0e12-4afb-8a00-02de26b599b1": {
    title: "Marble Sheet",
    description: "Polished marble-look sheet for walls and counters. Bulk orders welcome.",
    category: "Home",
    price_usd: 68,
    price_slsh: 578000,
    stock: 24,
    photos: ["https://images.pexels.com/photos/3847492/pexels-photo-3847492.jpeg?auto=compress&cs=tinysrgb&w=1200"],
  },
  "d04888c1-ee9c-4a76-b348-c1d752ce509f": {
    title: "Wallpaper",
    description: "Patterned wallpaper for living rooms and hallways. Sold per roll.",
    category: "Home",
    price_usd: 16,
    price_slsh: 136000,
    stock: 90,
    photos: ["https://images.pexels.com/photos/7546771/pexels-photo-7546771.jpeg?auto=compress&cs=tinysrgb&w=1200"],
  },
  "219541c0-3762-4780-b95b-6ff6d5cc1184": {
    title: "Vinyl Sticker Roll",
    description: "Self-adhesive vinyl sticker roll for signs, vehicles, and decor.",
    category: "Home",
    price_usd: 24,
    price_slsh: 204000,
    stock: 70,
    photos: ["https://images.pexels.com/photos/36697924/pexels-photo-36697924.jpeg?auto=compress&cs=tinysrgb&w=1200"],
  },
};

export function applyCatalogOverride<T extends { id: string }>(row: T): T {
  const next = CATALOG_OVERRIDES[row.id];
  return next ? { ...row, ...next } : row;
}
