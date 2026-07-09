# TimBit Order System

A responsive food-truck point-of-sale and order-tracking app built with React and Firebase. Orders, menu availability, and status changes synchronize across connected browsers.

## Open the app

The current production site is:

**https://food-truck-729ef.web.app**

No account is required. This is intentional for the current small-team setup, but it means anyone who discovers the URL can access the shared data. The site asks search engines not to index it; that is not a substitute for authentication.

## Main workflow

1. Select menu items to build an order.
2. Optionally enter a customer name and notes.
3. Select cash, card, or mobile payment.
4. Optionally apply Québec TPS (5%) and TVQ (9.975%).
5. Select **Save Order**. Firestore assigns the next order number.
6. Use **Order History** to move orders through New, Preparing, Ready, Delivered, or Cancelled.

Additional capabilities include:

- menu price and sold-out controls;
- unfinished-order recovery after refresh;
- per-item delivery tracking;
- soft deletion and restoration;
- printable receipts;
- CSV sales export;
- date-filtered reports;
- offline draft preservation; and
- automatic customer-name anonymization after 30 days when the production app is used.

## Run locally

Requirements:

- Node.js 20 or newer
- npm
- access to the configured Firebase project

```bash
git clone https://github.com/walkn/food-truck-app.git
cd food-truck-app
npm install
npm start
```

Open http://localhost:3000.

Run validation with:

```bash
npm test -- --watchAll=false
npm run build
```

## Firebase configuration

The public Firebase web configuration is in `src/firebase/config.js`. Firebase API keys identify the project; Firestore rules and App Check provide the security controls.

### App Check

1. In Firebase Console, enable App Check for the web app.
2. Register a reCAPTCHA v3 site key for the production domain.
3. Create a GitHub Actions repository variable named `FIREBASE_APP_CHECK_SITE_KEY`.
4. For a local production build, set:

```bash
REACT_APP_FIREBASE_APP_CHECK_SITE_KEY=your_public_site_key npm run build
```

5. After verifying valid traffic, enforce App Check for Cloud Firestore in Firebase Console.

App Check reduces automated abuse. It does not make this public, no-login application employee-only.

### Firestore rules

`firestore.rules`:

- blocks hard deletion;
- validates permitted fields, types, lengths, statuses, prices, quantities, and totals;
- permits only append-only audit events;
- constrains the sequential order counter; and
- rejects access to undeclared collections.

Rules intentionally retain public read/write access for the supported collections because the app has no sign-in.

Test rules with the Firebase Emulator Suite before tightening or extending the schema.

## Deployment

Pushes to `main` run tests, build the app, deploy Firestore rules, and publish Firebase Hosting. Pull requests receive Hosting preview deployments.

GitHub must contain:

- secret `FIREBASE_SERVICE_ACCOUNT_FOOD_TRUCK_729EF`
- variable `FIREBASE_APP_CHECK_SITE_KEY`

Manual deployment:

```bash
npm install
npm test -- --watchAll=false
npm run build
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,hosting
```

Firebase Hosting adds CSP, clickjacking protection, MIME sniffing protection, a restrictive permissions policy, and immutable caching for static assets.

## Data model

- `orders`: active and soft-deleted orders
- `orderEvents`: append-only change history
- `menu`: shared price and availability overrides
- `counters/orders`: sequential order-number counter

A generated device identifier is stored in `localStorage` and attached to writes for basic troubleshooting. It is not an identity or authentication mechanism.

## Technology

- React 18 / Create React App
- Firebase Hosting
- Cloud Firestore with persistent browser cache
- Firebase App Check with reCAPTCHA v3
