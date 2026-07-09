# TimBit Food Truck Order System

A React-based point-of-sale and order-tracking app for the TimBit food truck. Orders are stored in Firebase Firestore and synchronized in real time across open browsers.

## Open the app

The app is publicly available at:

**https://food-truck-729ef.web.app**

Open that URL in a current desktop or mobile browser. No installation or account is currently required.

> **Access warning:** the app does not currently enforce sign-in or role-based access. Anyone who can open the site may be able to view, create, edit, complete, or delete shared orders, depending on the deployed Firestore security rules. Add authentication and restrictive Firestore rules before using it with private or production data.

## How the app works

### Create an order

1. Enter the customer's name.
2. Select menu item cards to add them to the current order. Selecting the same item again increases its quantity.
3. Use the minus button beside an item to reduce its quantity or remove it.
4. Optionally enable Quebec taxes:
   - TPS: 5%
   - TVQ: 9.975%
5. Select **Complete Order** to save the order to Firestore, or **Clear Order** to discard the current order.

### Manage orders

Select **Order History** in the header to:

- see orders update in real time;
- search by customer or menu item;
- edit an existing order;
- delete an order;
- mark individual items as delivered; and
- see delivery progress and whether the whole order is pending or completed.

### View sales reports

The expandable **Sales Summary** in Order History shows:

- total revenue;
- total order count;
- total items sold;
- daily sales breakdowns; and
- item-level sales totals.

Reports can be filtered by today, yesterday, the last 7 days, the last 30 days, all time, or a custom date range.

## Data flow

The browser loads the React app from Firebase Hosting. The app subscribes to the `orders` collection in Cloud Firestore, so a saved or updated order is reflected in every connected browser. A generated device ID is stored in the browser's `localStorage` and attached to Firestore writes for basic device tracking.

The menu and prices are defined in `src/data/menuItems.js`. Firebase project settings are defined in `src/firebase/config.js`.

## Run locally

### Requirements

- Node.js and npm
- Network access to the configured Firebase project

### Setup

```bash
git clone https://github.com/walkn/food-truck-app.git
cd food-truck-app
npm install
npm start
```

Open http://localhost:3000. The development server reloads after source changes.

Other commands:

```bash
npm test
npm run build
```

`npm run build` creates an optimized production build in `build/`.

## Make the app available to any user

The current Firebase Hosting deployment already gives users a public HTTPS URL:

**https://food-truck-729ef.web.app**

After making code changes, a Firebase project administrator can publish a new version:

```bash
npm install
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting
```

The repository is configured to deploy the `build/` directory to the Firebase project `food-truck-729ef`. Firebase access is required to deploy; ordinary users only need the public URL.

For a production rollout:

1. Add Firebase Authentication.
2. Restrict Firestore rules to authorized employees.
3. Create separate development and production Firebase projects.
4. Move environment-specific Firebase settings into environment variables.
5. Optionally connect a custom domain in Firebase Hosting.

## Technology

- React 18
- Create React App / `react-scripts`
- Firebase Hosting
- Cloud Firestore
- Firebase Authentication SDK (installed, but authentication is not yet implemented)
