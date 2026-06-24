# OrderHub

Manage Shopify, WooCommerce, and BigCommerce orders from one kanban dashboard.
Connect multiple stores and get a per-store view with native platform statuses, drag-and-drop order management, and status updates pushed back to each platform.
Built with Next.js, Firebase, and Tailwind CSS.

---

## Features

- **Multi-platform support** — Shopify, WooCommerce, BigCommerce
- **Per-store dashboards** — switch between stores with a single click; each store shows its own native status columns
- **Native platform statuses** — Shopify shows Unfulfilled / Partially Fulfilled / Fulfilled / Cancelled exactly as in the Shopify admin; WooCommerce and BigCommerce use their own status systems
- **Live order fetch** — orders are fetched directly from store APIs on load and on-demand refresh; no background sync jobs
- **Status updates pushed back** — change a status in the drawer and it is written back to the platform (Shopify uses the modern fulfillment orders API)
- **Drag-and-drop kanban** — move orders between status columns with dnd-kit
- **Order detail drawer** — payment status, fulfillment status, delivery method, delivery status, tags, timeline, line items, customer info, notes, channel, and a direct link to the platform order
- **Search + filters** — search by order number, customer name, email, or tags; filter by platform; filter by date range
- **Authentication** — email/password and Google sign-in via Firebase Auth
- **Per-user store isolation** — Firestore security rules enforce that users can only read and write their own stores

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS, Inter font |
| State | Zustand |
| Drag-and-drop | dnd-kit |
| Auth + DB | Firebase (client SDK only — no Admin SDK) |
| Platform APIs | Axios, OAuth 1.0a (WooCommerce) |
| Icons | Lucide React |
| Dates | date-fns |

---

## Architecture

```
Browser
  ├── Firebase Auth (login / signup)
  ├── Firestore onSnapshot  →  reads /stores/{id} (credentials stored per-user)
  └── fetch('/api/orders')  →  Next.js API route (server-side proxy)
                                 ├── fetchShopifyOrders
                                 ├── fetchWooOrders
                                 └── fetchBCOrders

Next.js API Routes (server-side, no CORS issues)
  ├── POST /api/orders               — fetch orders from all connected stores
  └── POST /api/update-order-status  — push status change back to platform
```

Credentials are stored in Firestore by the client (client SDK + security rules). The client passes them as POST body to the API routes, which proxy the external platform calls. The server never reads Firestore directly — no Admin SDK or service account needed.

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Yarn
- A Firebase project with **Authentication** (Email/Password + Google) and **Firestore** enabled

### Install

```bash
yarn install
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → create or open your project
2. Enable **Authentication** → Sign-in method → Email/Password and Google
3. Enable **Firestore Database** (start in production mode)
4. Go to **Project Settings → General → Your apps** → add a Web app → copy the config

Paste your config into `src/lib/firebase.ts`:

```ts
const app = initializeApp({
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
})
```

### Deploy Firestore Rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # select your project
firebase deploy --only firestore
```

### Run

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Connecting Stores

### Shopify

1. Shopify Admin → **Settings → Apps and sales channels → Develop apps**
2. Create an app → **Configuration** → Admin API scopes → enable:
   - `read_orders`, `write_orders`
   - `read_assigned_fulfillment_orders`, `write_assigned_fulfillment_orders`
   - `read_merchant_managed_fulfillment_orders`, `write_merchant_managed_fulfillment_orders`
   - `read_third_party_fulfillment_orders`, `write_third_party_fulfillment_orders`
3. **API credentials** tab → **Install app** → copy the **Admin API access token** (starts with `shpat_`)
4. In OrderHub → Settings → Add Store → Shopify → paste the store URL and access token

> The access token is shown only once. Do not use the API key or secret key — those are different fields.

### WooCommerce

1. WP Admin → **WooCommerce → Settings → Advanced → REST API → Add key**
2. Permissions: **Read/Write**
3. Copy **Consumer Key** (`ck_…`) and **Consumer Secret** (`cs_…`)
4. In OrderHub → Settings → Add Store → WooCommerce

### BigCommerce

1. BC Admin → **Settings → API → Store-level API Accounts → Create API account**
2. Scope: **Orders** → Modify (Read-Write)
3. Copy **Client ID**, **Access Token**, and your **Store Hash** (visible in the API path `/stores/{hash}/`)
4. In OrderHub → Settings → Add Store → BigCommerce

---

## Firestore Data Model

```
/stores/{storeId}
  userId:      string       — owner UID (enforced by security rules)
  platform:    'shopify' | 'woocommerce' | 'bigcommerce'
  name:        string       — display name
  storeUrl:    string
  status:      'connected' | 'error' | 'disconnected'
  credentials: { ... }     — platform API credentials (plaintext, user-owned)
  createdAt:   Timestamp
```

Orders are **not** stored in Firestore. They are fetched live from the platform APIs on each page load and manual refresh.

---

## Status Mapping

| Platform | Kanban columns |
|---|---|
| Shopify | Unfulfilled, Partially Fulfilled, Fulfilled, Cancelled |
| WooCommerce | Pending, Processing, On Hold, Completed, Cancelled, Refunded, Failed |
| BigCommerce | Pending, Awaiting Payment, Awaiting Fulfillment, Awaiting Shipment, Partially Shipped, Shipped, Completed, Cancelled, Declined, Refunded |

Selecting a store tab on the dashboard shows only that store's columns. "All Stores" shows the union of statuses that have at least one order.

---

## Deployment

```bash
yarn build
```

Deploy to [Vercel](https://vercel.com) by importing the repo — no extra configuration required. The `vercel.json` is already included.
