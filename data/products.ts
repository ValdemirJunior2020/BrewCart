export type Product = {
  id: number; name: string; category: string; price: number; compareAt: number;
  rating: number; reviews: number; badge?: string; shipping?: string; image: string;
};

export const products: Product[] = [
  {id:1,name:"Compact Espresso Maker 20 Bar",category:"Espresso",price:89.99,compareAt:129.99,rating:4.8,reviews:1246,badge:"Hot Deal",shipping:"Free shipping",image:"https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=900&q=80"},
  {id:2,name:"Electric Burr Coffee Grinder",category:"Grinders",price:39.99,compareAt:59.99,rating:4.7,reviews:892,badge:"Best Seller",shipping:"Free shipping",image:"https://images.unsplash.com/photo-1517080310959-bc2a2e5f3f49?auto=format&fit=crop&w=900&q=80"},
  {id:3,name:"Handheld Milk Frother Pro",category:"Frothers",price:14.99,compareAt:24.99,rating:4.6,reviews:532,badge:"Under $20",shipping:"Free shipping",image:"https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=900&q=80"},
  {id:4,name:"Digital Coffee Scale with Timer",category:"Accessories",price:19.95,compareAt:29.95,rating:4.7,reviews:321,badge:"Limited Deal",shipping:"Free shipping",image:"https://images.unsplash.com/photo-1521302080334-4bebac2763a6?auto=format&fit=crop&w=900&q=80"},
  {id:5,name:"Double Wall Glass Mug Set",category:"Mugs",price:21.99,compareAt:34.99,rating:4.9,reviews:711,badge:"Customer Favorite",shipping:"Free shipping",image:"https://images.unsplash.com/photo-1511081692775-05d0f180a065?auto=format&fit=crop&w=900&q=80"},
  {id:6,name:"Airtight Coffee Bean Canister",category:"Storage",price:24.99,compareAt:36.99,rating:4.8,reviews:408,badge:"New",shipping:"Free shipping",image:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"}
];
