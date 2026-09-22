"use client";

import { useEffect, useMemo, useState } from "react";
import { products, Product } from "@/data/products";

type CartItem = Product & { qty: number };

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export default function StoreFront() {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("brewcart-cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("brewcart-cart", JSON.stringify(cart));
  }, [cart]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [query]);

  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const add = (product: Product) => {
    setCart((current) => {
      const exists = current.find((item) => item.id === product.id);
      return exists
        ? current.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
        : [...current, { ...product, qty: 1 }];
    });
    setCartOpen(true);
  };

  const updateQty = (id: number, change: number) => {
    setCart((current) =>
      current
        .map((item) => item.id === id ? { ...item, qty: item.qty + change } : item)
        .filter((item) => item.qty > 0)
    );
  };

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brandRow">
          <a className="brand" href="#home" aria-label="BrewCart home">
            <span className="brandIcon">☕</span><span>BrewCart</span>
          </a>
          <button className="cartButton desktopCart" onClick={() => setCartOpen(true)}>
            Cart <strong>{count}</strong>
          </button>
        </div>
        <label className="search">
          <span>⌕</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search coffee gear, mugs, grinders..." aria-label="Search BrewCart" />
        </label>
      </header>

      <section className="hero" id="home">
        <div>
          <span className="eyebrow">BETTER DEALS. BETTER MORNINGS.</span>
          <h1>Upgrade your coffee setup without the premium markup.</h1>
          <p>Fresh finds, useful gear and deal-first shopping made for your phone.</p>
          <a href="#deals" className="primary">Shop today&apos;s deals</a>
        </div>
        <div className="heroCard" aria-hidden="true">
          <span>☕</span><strong>Daily Brew Drop</strong><small>New deal every morning</small>
        </div>
      </section>

      <section className="categoryStrip" aria-label="Categories">
        {["Espresso","Grinders","Frothers","Mugs","Accessories","Storage"].map((item) => (
          <button key={item} onClick={() => setQuery(item)}>{item}</button>
        ))}
      </section>

      <section id="deals" className="section">
        <div className="sectionHeading">
          <div><span className="eyebrow">TRENDING NOW</span><h2>Deals worth waking up for</h2></div>
          <span className="results">{filtered.length} items</span>
        </div>

        <div className="productGrid">
          {filtered.map((product) => {
            const discount = Math.round((1 - product.price / product.compareAt) * 100);
            return (
              <article className="productCard" key={product.id}>
                <div className="imageWrap">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span className="dealBadge">{product.badge}</span>
                  <button className="heart" aria-label={"Save " + product.name}>♡</button>
                </div>
                <div className="productBody">
                  <small>{product.category}</small>
                  <h3>{product.name}</h3>
                  <div className="rating">★ {product.rating} <span>({product.reviews})</span></div>
                  <div className="priceRow">
                    <strong>{money(product.price)}</strong>
                    <del>{money(product.compareAt)}</del>
                    <span className="discount">-{discount}%</span>
                  </div>
                  <div className="shipping">{product.shipping}</div>
                  <button className="addButton" onClick={() => add(product)}>Add to cart</button>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && <div className="empty">No products found. Try another search.</div>}
      </section>

      <section className="valueBand">
        <div><strong>Fast discovery</strong><span>Search and filters built for mobile.</span></div>
        <div><strong>Deal-first pricing</strong><span>Discounts stay easy to understand.</span></div>
        <div><strong>Simple checkout</strong><span>Guest checkout + PayPal is next.</span></div>
      </section>

      <div className={"overlay " + (cartOpen ? "show" : "")} onClick={() => setCartOpen(false)} />
      <aside className={"cartDrawer " + (cartOpen ? "open" : "")} aria-hidden={!cartOpen}>
        <div className="drawerHead">
          <div><small>YOUR CART</small><h2>{count} item{count === 1 ? "" : "s"}</h2></div>
          <button onClick={() => setCartOpen(false)}>✕</button>
        </div>

        <div className="cartItems">
          {cart.length === 0 ? <div className="emptyCart">Your cart is empty.</div> :
            cart.map((item) => (
              <div className="cartItem" key={item.id}>
                <img src={item.image} alt="" />
                <div>
                  <strong>{item.name}</strong><span>{money(item.price)}</span>
                  <div className="qty">
                    <button onClick={() => updateQty(item.id, -1)}>−</button>
                    <b>{item.qty}</b>
                    <button onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>

        <div className="cartFooter">
          <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
          <button className="checkout" disabled={!cart.length}>Checkout coming next</button>
        </div>
      </aside>

      <nav className="mobileNav" aria-label="Mobile navigation">
        <a href="#home"><span>⌂</span>Home</a>
        <button onClick={() => setQuery("")}><span>▦</span>Categories</button>
        <a href="#deals"><span>%</span>Deals</a>
        <button onClick={() => setCartOpen(true)} className="cartNav">
          <span>🛒</span>Cart{count > 0 && <b>{count}</b>}
        </button>
        <button><span>○</span>Account</button>
      </nav>
    </main>
  );
}
