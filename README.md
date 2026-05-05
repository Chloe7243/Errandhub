# ErrandHub

A peer-to-peer errand platform that connects university students who need small tasks completed with students willing to help — for payment or as a favour.

Built as a Final Year Project at the University of Portsmouth.

---

## What it does

- **Requesters** post errands (pickup/delivery or hands-on help) with a suggested price
- **Helpers** receive real-time dispatch notifications, accept or counter-offer, and complete tasks
- Payments are held in escrow via Stripe and only released when the requester confirms completion
- Both roles live in a single account — users can switch between requester and helper at any time

---

## Tech Stack

| Layer              | Technology                               |
| ------------------ | ---------------------------------------- |
| Frontend           | React Native (Expo), TypeScript          |
| Backend            | Node.js, Express, TypeScript             |
| Database           | PostgreSQL via Prisma ORM                |
| Real-time          | Socket.IO                                |
| Payments           | Stripe (Payment Intents, manual capture) |
| Push notifications | Expo Notifications                       |
| Image storage      | Cloudinary                               |
| Maps               | Leaflet (via WebView)                    |
| Monorepo           | npm workspaces                           |

---

## Project Structure

```
errandhub/
├── apps/
│   ├── frontend/          # React Native / Expo mobile app
│   └── backend/           # Express API + Socket.IO server
├── shared/                # Shared Zod schemas and TypeScript types
├── __tests__/             # Jest unit tests (backend + frontend utils)
├── package.json           # Root workspace config
└── jest.config.js
```

---

## Prerequisites

- Node.js 18+
- npm 9+
- A PostgreSQL database (Prisma Postgres or any Postgres instance)
- Expo Go installed on a physical device, or an iOS/Android simulator
- A Stripe account (test keys are sufficient)
- A Cloudinary account (free tier is sufficient)

---

## Environment Variables

### Backend — `apps/backend/.env`

```env
PORT=3000
JWT_SECRET=your_jwt_secret_key

# PostgreSQL connection string
DATABASE_URL=postgres://...

# Stripe (use test keys during development)
STRIPE_SECRET_KEY=sk_test_...

# Nodemailer — used for email verification and password reset
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# Your Expo app URL — required for deep links (e.g. password reset emails).
# Use your tunnel URL if running with --tunnel (exp://xxxx.exp.direct),
# or your local network URL if on LAN (exp://192.168.x.x:8081).
# This must be set correctly or links in emails will not open the app.
APP_URL=exp://your-expo-url
```

### Frontend — `apps/frontend/.env`

```env
EXPO_PUBLIC_API_URL=http://your-local-ip:3000

# Stripe publishable key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Cloudinary
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# EasyPostcode API (address autocomplete)
EXPO_PUBLIC_EASY_POSTCODE_API_KEY=your_key
```

> **Note:** Never commit `.env` files. Both are listed in `.gitignore`.

---

## Installation

Clone the repository and install all workspace dependencies from the root:

```bash
git clone https://github.com/your-username/errandhub.git
cd errandhub
npm install
```

---

## Database Setup

```bash
# Apply migrations and generate the Prisma client
npm run db:migrate --workspace=apps/backend

# Or push the schema without creating a migration file (dev only)
npm run db:push --workspace=apps/backend

# Open Prisma Studio to browse data
npm run db:studio --workspace=apps/backend
```

---

## Running in Development

### Both frontend and backend (concurrently)

```bash
npm run dev
```

### Backend only

```bash
npm run backend
```

Starts the Express + Socket.IO server on `http://localhost:3000`.

### Frontend only

```bash
npm run frontend
```

Starts the Expo dev server. Scan the QR code with Expo Go on your device.

---

## Running on a Physical Device (same network)

Set `EXPO_PUBLIC_API_URL` in `apps/frontend/.env` to your machine's local IP address:

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

Make sure your device and machine are on the same WiFi network.

---

## Running for Remote Testing (ngrok / Cloudflare Tunnel)

To allow testers on different networks to access the app:

**1. Expose the backend:**

```bash
# Using ngrok
ngrok http 3000

# Using Cloudflare Tunnel (no account needed)
cloudflared tunnel --url http://localhost:3000
```

Copy the generated public URL and update `EXPO_PUBLIC_API_URL` in `apps/frontend/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-tunnel-url.ngrok-free.app
```

**2. Expose the Expo dev server:**

```bash
npx expo start --tunnel
```

Testers can scan the QR code from anywhere using Expo Go.

> **Note:** The ngrok free tier URL changes every time you restart. Update both `.env` and restart Expo when this happens.

---

## Running Tests

Tests are located in `__tests__/` and use Jest with ts-jest.

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run a specific test file
npm test -- __tests__/backend/services/matching.test.ts
```

---

## Key Scripts Reference

| Script           | Command                                       | Description                     |
| ---------------- | --------------------------------------------- | ------------------------------- |
| Start everything | `npm run dev`                                 | Frontend + backend concurrently |
| Backend only     | `npm run backend`                             | Express server on port 3000     |
| Frontend only    | `npm run frontend`                            | Expo dev server                 |
| Migrate DB       | `npm run db:migrate --workspace=apps/backend` | Run Prisma migrations           |
| Push schema      | `npm run db:push --workspace=apps/backend`    | Push schema without migration   |
| Prisma Studio    | `npm run db:studio --workspace=apps/backend`  | Browse database in browser      |
| Tests            | `npm test`                                    | Run all Jest tests              |

---

## API Overview

All routes except `/auth` and `/health` require a `Bearer` JWT token in the `Authorization` header.

| Method   | Route                        | Description                                |
| -------- | ---------------------------- | ------------------------------------------ |
| `GET`    | `/health`                    | Server health check                        |
| `POST`   | `/auth/signup`               | Register a new user                        |
| `POST`   | `/auth/login`                | Login and receive JWT                      |
| `POST`   | `/auth/select-role`          | Set requester or helper role               |
| `POST`   | `/auth/forgot-password`      | Request a password reset email             |
| `POST`   | `/auth/reset-password`       | Reset password with token                  |
| `GET`    | `/user/me`                   | Get authenticated user profile             |
| `DELETE` | `/user/me`                   | Delete account (GDPR right to erasure)     |
| `PATCH`  | `/user/avatar`               | Update profile photo URL                   |
| `GET`    | `/user/settings`             | Get user settings                          |
| `PATCH`  | `/user/update-settings`      | Update availability, radius, notifications |
| `POST`   | `/user/push-token`           | Save Expo push token                       |
| `GET`    | `/user/requested-errands`    | Requester's errand history                 |
| `GET`    | `/user/helped-errands`       | Helper's errand history                    |
| `POST`   | `/errand`                    | Create a new errand                        |
| `GET`    | `/errand/:id`                | Get errand by ID                           |
| `PATCH`  | `/errand/:id/status`         | Update errand status                       |
| `POST`   | `/errand/:id/start-work`     | Helper starts hands-on work timer          |
| `PATCH`  | `/errand/:id/extend`         | Extend estimated duration                  |
| `POST`   | `/errand/:id/dispute`        | Raise a dispute                            |
| `POST`   | `/payment/setup`             | Create a Stripe SetupIntent (add card)     |
| `GET`    | `/payment/methods`           | List saved payment methods                 |
| `DELETE` | `/payment/methods/:methodId` | Remove a saved card                        |

---

## Socket.IO Events

The server and client communicate over Socket.IO for real-time matching, chat, and status updates.

| Event              | Direction          | Description                          |
| ------------------ | ------------------ | ------------------------------------ |
| `errand_request`   | Server → Helper    | New errand dispatched to helper      |
| `accept_errand`    | Helper → Server    | Helper accepts dispatch              |
| `decline_errand`   | Helper → Server    | Helper declines dispatch             |
| `counter_offer`    | Helper → Server    | Helper proposes a different price    |
| `offer_response`   | Requester → Server | Requester accepts or rejects counter |
| `errand_assigned`  | Server → Both      | Match confirmed, errand begins       |
| `errand_expired`   | Server → Requester | No helper accepted in time           |
| `errand_completed` | Server → Helper    | Requester confirmed completion       |
| `send_message`     | Client → Server    | Send a chat message                  |
| `receive_message`  | Server → Client    | Incoming chat message                |
| `update_location`  | Helper → Server    | Update helper's current coordinates  |

---

## Author

Stephanie Oluoha — BSc Software Engineering, University of Portsmouth
Supervisor: Matt Dennis
