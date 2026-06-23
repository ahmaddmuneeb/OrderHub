# OrderHub — Setup Guide

## Prerequisites
- Node.js ≥ 20
- Yarn
- Firebase CLI: `npm i -g firebase-tools`
- A Firebase project with **Firestore**, **Authentication**, and **Functions** enabled

---

## 1. Clone & Install

```bash
# Frontend
yarn install

# Cloud Functions
cd functions && yarn install && cd ..
```

---

## 2. Firebase Project

1. Create a project at https://console.firebase.google.com
2. Enable **Authentication** → Sign-in method → Email/Password + Google
3. Enable **Firestore** (production mode)
4. Enable **Functions** (requires Blaze plan)

---

## 3. Environment Variables

```bash
cp .env.example .env
```

Fill in every `VITE_FIREBASE_*` variable from:
**Firebase Console → Project Settings → Your apps → Web app → SDK snippet**

---

## 4. Deploy Firestore Rules & Indexes

```bash
firebase login
firebase use --add          # select your project
firebase deploy --only firestore
```

---

## 5. Set Functions Encryption Key

Generate a strong 32-char random key:
```bash
openssl rand -base64 32
```

Set it as a Firebase environment variable:
```bash
firebase functions:config:set encryption.key="<your-key>"
```

---

## 6. Deploy Cloud Functions

```bash
cd functions && yarn build && cd ..
firebase deploy --only functions
```

This deploys:
- `syncOrders` — callable, full order sync per store
- `updateOrderStatus` — callable, push status to platform
- `testStoreConnection` — callable, verify API credentials
- `addStore` — callable, save encrypted credentials
- `disconnectStore` — callable, remove store + orders
- `webhookShopify` — HTTP, receive Shopify webhooks
- `webhookWoo` — HTTP, receive WooCommerce webhooks
- `webhookBigCommerce` — HTTP, receive BigCommerce webhooks

---

## 7. Run Frontend

```bash
yarn dev
```

Open http://localhost:5173

---

## 8. Connect Each Platform

### Shopify
1. Go to your Shopify store → **Settings → Apps and sales channels → Develop apps**
2. Create a private app, grant `read_orders` + `write_orders` scopes
3. Copy **Admin API access token** (= API Key) and **API secret key**
4. In OrderHub → Stores → Add Store → Shopify
5. Register webhooks in Shopify → Notifications → Webhooks:
   - `orders/create` → `https://<region>-<project>.cloudfunctions.net/webhookShopify?storeId=<id>`
   - `orders/updated` → same URL

### WooCommerce
1. WP Admin → **WooCommerce → Settings → Advanced → REST API → Add Key**
2. Permissions: **Read/Write**
3. Copy Consumer Key + Consumer Secret
4. In OrderHub → Stores → Add Store → WooCommerce
5. Register webhooks in WP Admin → WooCommerce → Settings → Advanced → Webhooks:
   - Topic: `Order created` → URL: `https://.../webhookWoo?storeId=<id>`
   - Topic: `Order updated` → same URL

### BigCommerce
1. BC Admin → **Settings → API → Store-level API Accounts → Create API Account**
2. Scopes: `Orders` → Read-Write
3. Copy **Client ID**, **Access Token**, and your **Store Hash** (from the API path `/stores/{hash}`)
4. In OrderHub → Stores → Add Store → BigCommerce
5. Register webhooks in BC Admin → Advanced Settings → Webhooks:
   - `store/order/created` → `https://.../webhookBigCommerce?storeId=<id>`
   - `store/order/statusUpdated` → same URL

---

## 9. Build for Production

```bash
yarn build
firebase deploy --only hosting
```

---

## Architecture Notes

```
Frontend (React/Vite)
  └─ Firestore onSnapshot (real-time orders)
  └─ Firebase Auth
  └─ Callable Functions (never direct platform API calls)

Cloud Functions
  ├─ syncOrders      → Platform REST API → normalize → Firestore upsert
  ├─ updateOrderStatus → Firestore update + push to platform
  ├─ webhookShopify/Woo/BC → receive → normalize → Firestore upsert
  └─ credentials encrypted with AES before Firestore write

Firestore
  /stores/{storeId}   encryptedCredentials (AES, server-side only)
  /orders/{orderId}   normalized schema, real-time listener
```

**Security**: API credentials are AES-encrypted before being stored in Firestore.
The decryption key lives only in the Cloud Functions runtime environment —
it is never sent to or readable by the frontend.
