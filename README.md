# Saree Sanskriti

A modern e-commerce web app for browsing and ordering authentic Indian sarees. Built with React, TypeScript, and a clean, responsive UI.

## Features

### Storefront

- **Home** — Hero section, featured products, and quick links to shop
- **Shop Sarees** — Product grid with category badges, fabric info, and pricing
- **Product detail** — Full description, fabric & category, quantity selector, **Add to Cart**, and **Order Now** (direct order)
- **Cart** — View items, change quantity, remove items, see subtotal, and **Checkout** with a single customer form (creates one order per cart line)

### Cart & checkout

- Add products from the product page or listing (with optional quantity on detail page)
- Edit quantity (increase/decrease) and remove items from the cart
- Cart persisted in `localStorage` and reflected in header badge
- Checkout dialog: name, email, phone, address → places orders for all cart items

### Admin

- **Login** — Simple auth (credentials in code; see [Admin access](#admin-access) below)
- **Dashboard** — Tabs for **Products** (add, edit, delete) and **Orders** (view list)
- **Product form** — Create or edit product (name, price, description, fabric, category, image URL)

## Tech stack

- **React 18** + **TypeScript**
- **Vite** — build and dev server
- **React Router** — routing
- **TanStack React Query** — server state (available for future API use)
- **Tailwind CSS** — styling
- **shadcn/ui** — Radix-based UI components (dialog, form, table, tabs, etc.)
- **React Hook Form** + **Zod** — forms and validation
- **Lucide React** — icons

Data is stored in the browser (**localStorage**) for products, orders, cart, and admin session. No backend required to run the app.

## Project structure

```
src/
├── App.tsx                 # Routes, CartProvider, QueryClient
├── main.tsx
├── context/
│   └── CartContext.tsx     # Cart state and actions (add, update, remove, clear)
├── components/
│   ├── Layout.tsx          # Header + Footer wrapper
│   ├── Header.tsx         # Nav + cart link with badge
│   ├── Footer.tsx
│   ├── ProductCard.tsx    # Product tile (Add to Cart + View Details)
│   ├── OrderForm.tsx      # Single-product order dialog
│   ├── CheckoutForm.tsx   # Cart checkout dialog (multi-item)
│   └── ui/                # shadcn components
├── lib/
│   ├── storage.ts         # localStorage helpers (products, orders, cart, admin auth)
│   └── utils.ts
├── pages/
│   ├── Index.tsx          # Home
│   ├── Products.tsx       # Product listing
│   ├── ProductDetail.tsx  # Product page + add to cart
│   ├── Cart.tsx          # Cart page + checkout
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx # Products & orders management
│   ├── AdminProductForm.tsx
│   └── NotFound.tsx
├── types/
│   └── index.ts           # Product, Order, CartItem, AdminUser
└── hooks/
```

## Getting started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Install and run

```bash
# Install dependencies
npm install

# Start dev server (default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Other scripts

- `npm run lint` — Run ESLint
- `npm run test` — Run Vitest
- `npm run test:watch` — Vitest in watch mode

## Routes

| Path                 | Description               |
| -------------------- | ------------------------- |
| `/`                  | Home                      |
| `/products`          | Shop – all products       |
| `/product/:id`       | Product detail            |
| `/cart`              | Shopping cart & checkout  |
| `/admin/login`       | Admin login               |
| `/admin/dashboard`   | Admin – products & orders |
| `/admin/product/:id` | Add or edit product       |

## Admin access

The app uses a simple in-memory admin login (no backend). Default credentials are defined in `src/lib/storage.ts`:

- **Username:** `admin`
- **Password:** `sanskriti2024`
Change these in code for your own use.

## License

Private project.
