# BrewCart

BrewCart is a mobile-first ecommerce marketplace focused first on coffee products, with room to expand into gaming, electronics, home products, and other categories.

## Run BrewCart locally on Windows

### Easiest method

1. Download or clone this repository.
2. Open the BrewCart folder.
3. Double-click `START.bat`.
4. The first run automatically runs `npm install`.
5. When the terminal shows that Next.js is ready, open:

`http://localhost:3000`

### Using Git

```bat
git clone https://github.com/ValdemirJunior2020/BrewCart.git
cd BrewCart
START.bat
```

### Manual method

Requires Node.js 20 or newer.

```bat
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Working starter currently included

The repository now contains a runnable Next.js/React/TypeScript storefront with:

- mobile-first responsive layout
- sticky mobile search/header
- thumb-driven bottom navigation
- two-column mobile product grid
- demo coffee products
- live product search/category filtering
- deal pricing and badges
- add-to-cart controls
- persistent cart using localStorage
- quantity controls
- mobile bottom-sheet cart
- desktop cart drawer
- warm BrewCart coffee design direction

The checkout button is intentionally marked as the next phase. PayPal, PostgreSQL/Prisma, customer accounts, admin CRUD, inventory, orders, supplier management, and production checkout still need to be connected before BrewCart is a complete production store.

## Current direction

- Mobile-first is a hard requirement. The phone experience is designed first and desktop expands from it.
- Frontend: Next.js + React + TypeScript
- Planned backend: Node.js / TypeScript
- Planned database: PostgreSQL + Prisma
- Planned payments: PayPal
- Frontend deployment: Netlify
- Backend/database: Render

## UX direction

See [docs/MOBILE_FIRST_UX.md](docs/MOBILE_FIRST_UX.md).

## Open-source research

See [docs/OPEN_SOURCE_STACK.md](docs/OPEN_SOURCE_STACK.md).
