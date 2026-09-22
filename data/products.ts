export type Product = {
  id: number;
  name: string;
  category: string;
  price: number | null;
  compareAt: number | null;
  rating: number | null;
  reviews: number | null;
  badge?: string;
  shipping?: string;
  image: string;
  source: "Temu" | "Demo";
  supplierProductId?: string;
  supplierUrl?: string;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Professional Espresso Machine with Grinder, Milk Frother & Steam Wand",
    category: "Espresso Machines",
    price: null,
    compareAt: null,
    rating: null,
    reviews: null,
    badge: "New supplier product",
    shipping: "Shipping set in admin",
    image: "https://img.kwcdn.com/product/open/86a37ac4e1294bf586fcaa0abe64cd75-goods.jpeg",
    source: "Temu",
    supplierProductId: "605596761851539",
    supplierUrl: "https://www.temu.com/espresso-machine-with-grinder-professional-coffee-maker-for-latte-cappuccino-with-milk-frother-steam-wand-removable-water-tank-for-home-g-605596761851539.html"
  },
  {
    id: 2,
    name: "15-Bar Espresso Machine with Built-In Grinder, Milk Frother & 70oz Water Tank",
    category: "Espresso Machines",
    price: null,
    compareAt: null,
    rating: null,
    reviews: null,
    badge: "New supplier product",
    shipping: "Shipping set in admin",
    image: "https://img.kwcdn.com/product/fancy/aa4936bb-0287-47f7-a41d-c419337ec4d6.jpg",
    source: "Temu",
    supplierProductId: "601099704667803",
    supplierUrl: "https://www.temu.com/-espresso-machine-15-bar-coffee-maker-with-milk-frother-steam-wand-built-in-bean-grinder-combo-cappuccino-machine-with-70oz-removable-water-tank-abs-high-strength-plastic-shell-g-601099704667803.html"
  },
  {
    id: 3,
    name: "1350W 20-Bar Espresso Maker with Instant Heating & Milk Frother",
    category: "Espresso Machines",
    price: null,
    compareAt: null,
    rating: null,
    reviews: null,
    badge: "New supplier product",
    shipping: "Shipping set in admin",
    image: "https://img.kwcdn.com/product/fancy/749d8f9c-5f78-499d-aa92-ac80793ae9a6.jpg",
    source: "Temu",
    supplierProductId: "606623779151957",
    supplierUrl: "https://www.temu.com/1350w-20-machine-instant-heating-system-espresso-maker-with-milk-frother-fast-brew-italian--machine-for-latte-cappuccino-1-6l-removable-water-tank--g-606623779151957.html"
  }
];
