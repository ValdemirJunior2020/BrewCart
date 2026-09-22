# BrewCart Open-Source Stack Research

Research date: September 22, 2026.

This list is intentionally focused on software that is free to use or self-host. It was checked against the existing open-source collection so BrewCart does not simply repeat projects that are already saved there.

## Recommended direction

Do not replace BrewCart with a single giant ecommerce framework. Keep BrewCart's own storefront, branding, PayPal flow, supplier model, profit tools, and admin workflow. Reuse focused open-source components where they save a lot of work.

### 1. Vercel Commerce
Repository: https://github.com/vercel/commerce  
License: MIT  
Use: storefront architecture and UI inspiration.

Why it fits: It is a modern Next.js App Router ecommerce application using React Server Components, Server Actions, Suspense, optimistic UI patterns, SEO, caching, product pages, cart patterns, and responsive storefront structure.

BrewCart use: study and reuse suitable UI/application patterns, but replace the Shopify data layer with BrewCart's own API and PostgreSQL/Prisma backend.

### 2. Vendure
Repository: https://github.com/vendurehq/vendure  
License: GPLv3 for the community edition.

Use: serious ecommerce backend architecture reference, or a possible backend alternative if GPLv3 is acceptable.

Why it fits: TypeScript, Node.js, NestJS, GraphQL, catalog, customers, orders, pricing, promotions, admin dashboard, marketplace support, and SQL databases.

BrewCart note: do not casually copy Vendure core code into BrewCart. GPLv3 obligations apply to modified/distributed core code. It is excellent architecture inspiration and can also be used as a separate backend if that licensing model is acceptable.

### 3. Saleor
Repository: https://github.com/saleor/saleor  
License: BSD-3-Clause.

Use: ecommerce domain and API architecture inspiration.

Why it fits: Saleor has mature concepts for checkout, products, shipping, payments, channels, orders, promotions, and headless commerce.

BrewCart note: the backend is Python/Django, so it does not match the planned Node/TypeScript backend. Use it mainly to study data models, workflows, edge cases, and admin behavior.

### 4. Meilisearch
Repository: https://github.com/meilisearch/meilisearch  
License: MIT Community Edition.

Use: actual BrewCart product search.

Why it fits: search-as-you-type, typo tolerance, filters, facets, sorting, synonyms, and fast search. These map directly to BrewCart requirements such as category, price, rating, availability, discount, newest, best-selling, and price sorting.

Suggested BrewCart integration: PostgreSQL remains the source of truth. Sync searchable product fields into Meilisearch after product create/update/delete operations.

### 5. Uppy
Repository: https://github.com/transloadit/uppy  
License: MIT.

Use: actual admin image/file upload interface.

Why it fits: BrewCart needs multi-image product uploads, drag/drop, progress, reordering workflows, and good browser upload UX.

Suggested BrewCart integration: use Uppy for the admin upload UI, while BrewCart's backend controls where files are stored and records product image metadata.

### 6. Payload CMS
Repository: https://github.com/payloadcms/payload  
License: MIT.

Use: admin/content architecture inspiration or optional CMS layer.

Why it fits: Payload is TypeScript/React/Next.js based and provides admin UI, APIs, access control, uploads, and flexible collections.

Suggested BrewCart use: study it for homepage banners, promotional sections, content blocks, media management, and admin patterns. Avoid adding it just to duplicate product/order logic that BrewCart already owns.

### 7. React-admin
Repository: https://github.com/marmelab/react-admin  
License: MIT.

Use: actual admin-dashboard building blocks or inspiration.

Why it fits: CRUD screens, filters, forms, validation patterns, tables, pagination, relationships, data providers, authentication hooks, and admin workflows.

Suggested BrewCart use: evaluate it for products, customers, coupons, inventory, suppliers, and orders. Keep BrewCart's own branded dashboard shell if React-admin's default UI feels too generic.

### 8. shadcn/ui
Repository: https://github.com/shadcn-ui/ui  
License: MIT.

Use: actual UI component source.

Why it fits: accessible, customizable React components that work very well with Tailwind and modern Next.js. BrewCart can own the copied component code and style it with the espresso/cream/orange design system.

Suggested BrewCart use: dialogs, sheets, dropdowns, forms, tables, tabs, badges, command/search UI, popovers, toasts, pagination, navigation, and admin controls.

### 9. dnd-kit
Repository: https://github.com/clauderic/dnd-kit  
License: MIT.

Use: actual drag-and-drop support.

Why it fits: BrewCart requires homepage admin control with reordering for hero banners, categories, deals, featured products, trending products, best sellers, new arrivals, and promotional banners.

Suggested BrewCart integration: store a numeric sort/order field in PostgreSQL and persist the new positions after drag-and-drop.

### 10. imgproxy
Repository: https://github.com/imgproxy/imgproxy  
License: Apache-2.0.

Use: optional image-processing service.

Why it fits: resizing, format conversion, optimization, source restrictions, and image-security controls.

Suggested BrewCart use: later, if image volume becomes large. For the first version, the already-saved Sharp project may be simpler because it can run directly inside the Node backend without another service.

### 11. Mailpit
Repository: https://github.com/axllent/mailpit  
License: MIT.

Use: development/testing only.

Why it fits: BrewCart needs order confirmation, payment, shipping, delivery, password reset, and admin notification emails. Mailpit lets us test those emails locally without accidentally emailing real customers.

Suggested BrewCart integration: use SMTP in development with Mailpit. Production can later point the same email abstraction at the chosen SMTP/email provider.

## Already in the existing collection

Medusa is already saved in the current open-source collection, so it was not added as a new discovery. It is highly relevant to BrewCart and its existing collection description should eventually be upgraded from the generic entry to a real ecommerce-specific description.

Typesense and Sharp are also already present, so BrewCart should compare Meilisearch vs Typesense before committing to a search engine, and should prefer Sharp for the first image-processing implementation unless a separate imgproxy service is actually needed.

Plausible Community Edition is already present and can be used instead of adding another analytics platform. It is useful for site traffic analytics, while BrewCart should still keep its own database events for product views, add-to-cart, checkout starts, orders, revenue, estimated profit, and conversion calculations.

## Suggested BrewCart stack

Keep:
- Next.js
- React
- TypeScript
- Tailwind CSS
- Node.js
- PostgreSQL
- Prisma
- PayPal
- Netlify + Render

Add first:
- shadcn/ui for storefront/admin components
- dnd-kit for homepage/admin reordering
- Uppy for product image upload UX
- Mailpit for local email testing
- Playwright (already in the collection) for checkout and admin end-to-end testing

Evaluate before adding:
- Meilisearch vs Typesense
- React-admin vs fully custom admin
- Payload CMS for homepage/content management

Use as architecture references:
- Vercel Commerce
- Vendure
- Saleor
- Medusa

## Important licensing rule

Before copying source code from any repository, check that repository's current license and keep required notices. MIT, BSD, Apache, and GPL licenses have different obligations. BrewCart should prefer permissive MIT/BSD/Apache components for direct code reuse when there is a practical choice.
