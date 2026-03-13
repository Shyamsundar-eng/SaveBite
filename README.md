
# SaveBite (FoodRescue AI)

SaveBite is a lightweight food-inventory and donation demo app that helps you track items, reduce waste, find NGOs, and (optionally) use Gemini-powered features like food scanning and recipe generation.

## Features

- **Auth (local demo)**: email/password signup + login, plus a demo shortcut account.
- **Inventory**: add/edit/delete items, filter/search, see expiry status, swipe actions.
- **Donations**: pick safe (non-expired) items, choose an NGO, and confirm handover.
- **NGO Map**: browse demo NGOs; optionally search nearby NGOs using Gemini.
- **Recipes**: optionally generate recipes from your inventory using Gemini.
- **Dark mode**: persistent theme toggle.

## Run Locally

### Prerequisites

- Node.js (LTS recommended)

### Install

```bash
npm install
```

### Configure (optional AI features)

AI features are **optional**. The app runs without them.

Create a `.env.local` (or `.env`) in the project root:

```bash
GEMINI_API_KEY=YOUR_KEY_HERE

# Firebase Auth (optional but recommended)

To enable Firebase email/password and Google sign-in, add these to the same `.env.local` (or `.env`) file:

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### Start dev server

```bash
npm run dev
```

Vite is configured to run on:

- `http://localhost:3000/`

## Demo login

Use the built-in demo shortcut on the login screen:

- **Email**: `demo@ecotable.dev`
- **Password**: `password123`

## Build for production

```bash
npm run build
npm run preview
```

## Notes

- This repo uses a CDN Tailwind setup for styling plus a small `index.css` for accessibility focus styling.
- If `GEMINI_API_KEY` is not set, AI actions will show a friendly message instead of crashing the app.
- If Firebase env vars are not set, the app will still render but Firebase auth flows will fail at runtime; for a quick demo, you can continue using the built-in demo login (`demo@ecotable.dev` / `password123`).
