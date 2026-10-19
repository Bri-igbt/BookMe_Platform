# BookMe

**A calm booking desk for small businesses.**
<img src='https://res.cloudinary.com/dhdcmkuhx/image/upload/f_auto/q_auto/Screenshot_2026-10-19_at_10.58.22_uohnep.png' alt='image' width='400' height='400' />

BookMe is a full-stack appointment scheduling and booking platform. A business owner creates a profile, adds services, sets weekly availability and shares one clean booking link. Customers pick a time, verify their email, pay online (or book for free) and get a confirmation with a Google Calendar link. Owners track bookings, earnings and withdrawals from a dashboard, and an admin approves payout requests.

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?logo=stripe&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

---

## Table of contents

- [Live links](#live-links)
- [Features](#features)
- [Tech stack](#tech-stack)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Pages and routes](#pages-and-routes)
- [API overview](#api-overview)
- [Data model](#data-model)
- [Getting started locally](#getting-started-locally)
- [Environment variables](#environment-variables)
- [Deploying to Vercel](#deploying-to-vercel)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Known limitations and roadmap](#known-limitations-and-roadmap)
- [Screenshots](#screenshots)
- [License](#license)

---

## Live links

| | URL |
|---|---|
| Frontend | https://book-me-platform-d3gz.vercel.app |
| Backend API | https://book-me-platform.vercel.app (open `/` to see `API WORKING`) |

---

## Features

### For business owners

- **Account with email verification.** Register with a 6-digit code sent by email, then log in with a JWT session.
- **Business profile.** Business name and description, time zone, five brand themes and a custom accent color, with a live preview of the public page.
- **Services.** Create, edit, switch on or off, and delete (soft delete) services with a name, description, duration, price and icon.
- **Weekly availability.** Set one or more time windows per weekday. An empty day means closed.
- **Bookings.** See every booking with its payment and calendar status, filter by date and status, reschedule, or cancel. The customer is notified by email.
- **Dashboard.** Totals, confirmed and rescheduled counts, income, a bookings chart (daily, weekly, monthly, yearly), an earnings bar chart, a status breakdown, top services and upcoming bookings.
- **Payments and wallet.** Available balance, total earned, pending payouts, recent activity, bank details and withdrawal requests.
- **Google Calendar.** Connect a calendar and every booking is created, moved or removed there automatically.
- **Shareable booking link.** One public link per business, with quick share buttons.

### For customers

- **Public booking page** at `/book/<business-slug>`, themed with the business's colors.
- **Real available times only.** Times already booked, held for an unpaid booking, or in the past are hidden.
- **Email verification** before booking, so every booking has a real email behind it.
- **Pay online or confirm free.** Paid services go through Stripe Checkout. Free services confirm instantly.
- **Confirmation email** and an **Add to Google Calendar** link set to the business's time zone.

### For the platform admin

- **Admin login** at `/admin/login`, separate from owner accounts.
- **Overview dashboard.** Users, paid bookings, gross revenue, platform fees, provider payouts and withdrawal holds.
- **Withdrawal review.** Move requests through `pending`, `processing`, `paid` or `rejected`. Rejecting returns the money to the owner's wallet.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, Tailwind CSS, Axios, lucide-react |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Auth | JWT (7 days), bcrypt password hashing, email OTP |
| Payments | Stripe Checkout |
| Email | Brevo transactional email API |
| Calendar | Google Calendar API (OAuth 2.0) through `googleapis` |
| Hosting | Vercel (frontend and backend as separate projects) |

---

## How it works

### Booking flow

1. The customer opens `/book/<slug>` and chooses a service and a date.
2. The server builds the available times from the owner's weekly availability for that weekday, then removes past times, confirmed bookings, and unpaid bookings that are still inside their 30-minute hold.
3. The customer enters a name and email and requests a code. The code is 6 digits, valid for 10 minutes, stored as a hash, limited to 5 attempts, and can be re-sent once every 60 seconds.
4. When the customer books, the server checks again that the chosen time is one it would offer, works out the end time from the service length (the client's end time is never trusted), and uses up the code.
5. **Free service:** the booking is confirmed, the calendar event is created and emails are sent.
6. **Paid service:** the booking is created as `pending_payment` and the customer is sent to Stripe Checkout. When they return to `/booking/success`, the page checks the payment status until it is confirmed.

Two customers cannot take the same start time. A unique partial index on `userId + date + startTime` (for active bookings only) rejects the second one, even if both requests arrive at the same moment.

### Money flow

- All money amounts are stored in the **smallest unit (kobo)**. Currency is Nigerian naira (NGN).
- The platform keeps a **10% fee**. The rest is the provider's payout and is credited to their wallet as a `booking_payout` transaction once the payment is confirmed.
- The wallet balance is `earned - holds + reversals`.
- A withdrawal request (minimum ₦1,000) creates a `withdrawal_hold` transaction, so the money cannot be spent twice. Only one withdrawal can be open per owner at a time.
- The admin marks the request `processing`, then `paid`. If it is `rejected`, a `withdrawal_reversal` transaction returns the money.
- Only the **last 4 digits** of the account number are stored.

### Statuses

| Item | Values |
|---|---|
| Booking | `pending`, `pending_payment`, `confirmed`, `cancelled`, `payment_failed` |
| Payment | `not_required`, `pending`, `paid`, `failed` |
| Withdrawal | `pending`, `processing`, `paid`, `rejected` |
| Wallet transaction | `booking_payout`, `withdrawal_hold`, `withdrawal_reversal` |

---

## Project structure

```
BOOKME_PLATFORM/
├── backend/
│   ├── api/index.js            Vercel entry point (exports the Express app)
│   ├── app.js                  Express app: CORS, JSON, DB, routes
│   ├── server.js               Local development server
│   ├── vercel.json             Sends every request to the Express app
│   ├── config/db.js            Cached MongoDB connection
│   ├── controllers/            auth, service, availability, booking, public,
│   │                           payment, admin and Google controllers
│   ├── middleware/
│   │   ├── auth.js             Owner JWT check
│   │   └── adminAuth.js        Admin-only JWT check
│   ├── models/                 User, Service, Availability, Booking,
│   │                           EmailOtp, WalletTransaction, Withdrawal
│   ├── routes/                 One router per area
│   └── utils/                  emailOtp, bookingNotification, slot generator,
│                               time, calendarLink, googleCalendar, money,
│                               wallet, stripe, slug
└── frontend/
    ├── app/
    │   ├── (auth)/             Login and register (public only)
    │   ├── (app)/              Owner area: dashboard, profile, services,
    │   │                       availability, bookings, payments
    │   ├── (admin)/admin/      Admin login and dashboard
    │   ├── book/[slug]/        Public booking page
    │   ├── booking/            Payment success and cancelled pages
    │   ├── privacy/ and terms/ Legal pages
    │   ├── api/                Axios clients for every backend area
    │   └── assets/             Images, icons, avatars and style objects
    └── public/
```

---

## Pages and routes

| Route | Who | What |
|---|---|---|
| `/login` | Visitors | Log in or register with email verification |
| `/` | Owner | Dashboard |
| `/profile` | Owner | Business details, theme, Google Calendar |
| `/services` | Owner | Manage services |
| `/availability` | Owner | Weekly availability |
| `/bookings` | Owner | Bookings list, reschedule, cancel |
| `/payments` | Owner | Wallet, bank details, withdrawals |
| `/book/[slug]` | Customers | Public booking page |
| `/booking/success` | Customers | Payment result |
| `/privacy`, `/terms` | Everyone | Legal pages |
| `/admin/login` | Admin | Admin sign-in |
| `/admin/dashboard` | Admin | Platform overview and withdrawal review |

Signed-in owners are redirected away from `/login`, signed-out visitors are redirected away from the owner area, and `/admin/*` is guarded separately.

---

## API overview

All routes start with `/api`. Routes marked **Auth** need an `Authorization: Bearer <token>` header.

### Auth `/api/auth`

| Method | Path | Notes |
|---|---|---|
| POST | `/request-otp` | Send a registration code (`/register/request-otp` also works) |
| POST | `/verify-otp` | Check a code without using it (`/register/verify-otp` also works) |
| POST | `/register` | Create an account (needs a verified code) |
| POST | `/login` | Log in |
| GET | `/me` | **Auth.** Current profile |
| PUT | `/profile` | **Auth.** Update profile |

### Services `/api/services` (Auth)

`GET /`, `POST /`, `PUT /:id` or `PATCH /:id`, `DELETE /:id`

### Availability `/api/availability` (Auth)

`GET /` lists all weekdays. `PUT /` saves one weekday with `{ dayOfWeek, slots }`. An empty `slots` array marks the day off.

### Bookings `/api/bookings` (Auth)

`GET /` (filters: `status`, `date`), `PUT /:id/status` or `PATCH /:id`, `PUT /:id/reschedule` or `PATCH /:id/reschedule`

### Payments `/api/payments` (Auth)

`GET /overview` (or `GET /`), `PUT /payout-details`, `POST /withdrawals`

### Public `/api/public`

| Method | Path | Notes |
|---|---|---|
| GET | `/:slug` | Business details and its active services |
| GET | `/:slug/slots?serviceId=&date=` | Available times |
| POST | `/:slug/request-otp` | Send a booking code |
| POST | `/:slug/verify-otp` | Check a code |
| POST | `/:slug/book` | Create a booking (free) or start checkout (paid) |
| GET | `/booking/status?session_id=` | Payment result for the success page |
| POST | `/booking/cancel-payment` | Customer left the payment page |

### Admin `/api/admin`

`POST /login`, `GET /dashboard` (admin), `PATCH /withdrawals/:id` (admin)

### Integrations `/api/integrations`

Google Calendar connect, OAuth callback and disconnect.

### Health

`GET /` returns `API WORKING`. `GET /api/health` reports whether the main settings are present, without revealing any values.

---

## Data model

| Model | Main fields |
|---|---|
| **User** | name, email, password hash, slug, businessName, businessDescription, brandTheme, brandAccent, timeZone, Google Calendar connection and refresh token, payoutDetails (holder, bank, bank code, last 4 digits) |
| **Service** | userId, name, description, duration (minutes), price, icon, isActive, isDeleted |
| **Availability** | userId, dayOfWeek (0 = Sunday), slots `[{ startTime, endTime }]` in `HH:mm` |
| **Booking** | userId, serviceId, customer name and email, avatar, date, startTime, endTime, status, paymentStatus, amount, platform fee, provider payout, payment reference, Google event id, calendar link, notes, reschedule info |
| **EmailOtp** | email, purpose (`registration` or `booking`), code hash, attempts, expiry (auto-deleted), consumed time |
| **WalletTransaction** | userId, bookingId or withdrawalId, type, amount, status, description |
| **Withdrawal** | userId, amount, status, payout snapshot (bank details at the time), admin note |

The password and the Google refresh token are hidden from queries by default.

---

## Getting started locally

### Prerequisites

- Node.js 18 or newer
- A MongoDB database, version 6.0 or newer (MongoDB Atlas works)
- A Brevo account (sending emails)
- A Stripe account with a test key (paid bookings)
- A Google Cloud project with the Calendar API enabled (optional, for calendar sync)

### 1. Clone and install

```bash
git clone <your-repository-url>
cd BOOKME_PLATFORM

cd backend && npm install
cd ../frontend && npm install
```

### 2. Add environment variables

Create `backend/.env` and `frontend/.env.local` using the tables in the next section.

To create the admin password hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('YourStrongPassword', 10))"
```

Put the output in `ADMIN_PASSWORD_HASH`, wrapped in single quotes.

### 3. Run it

```bash
# terminal 1: backend on http://localhost:8000
cd backend
npm start

# terminal 2: frontend on http://localhost:3000
cd frontend
npm run dev
```

Open http://localhost:3000/login, register, and follow the setup order: **Profile**, **Services**, **Availability**, then open your public booking link from the dashboard.

---

## Environment variables

### Backend (`backend/.env`)

| Name | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | Connection string. Include the database name before the `?`, for example `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/BookMe?appName=Cluster0` |
| `JWT_SECRET` | Yes | Long random string used to sign tokens |
| `CLIENT_URL` | Yes | Frontend address, for example `http://localhost:3000`. Scheme and host only: no path and no trailing slash |
| `ALLOWED_ORIGINS` | No | Extra allowed frontend addresses, separated by commas |
| `BREVO_API_KEY` | Yes | Brevo API key |
| `BREVO_SENDER_EMAIL` | Yes | A sender address verified in Brevo |
| `BREVO_SENDER_NAME` | No | Display name for emails (defaults to `BookMe`) |
| `STRIPE_SECRET_KEY` | For paid bookings | Stripe secret key (`sk_test_...` while testing) |
| `GOOGLE_CLIENT_ID` | For calendar | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | For calendar | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | For calendar | The backend OAuth callback address, registered in Google Cloud |
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD_HASH` | Yes | bcrypt hash of the admin password (`ADMIN_PASSWORD` works but is not recommended) |
| `PORT` | No | Local port (defaults to `8000`) |

### Frontend (`frontend/.env.local`)

| Name | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend address including `/api`, for example `http://localhost:8000/api` |

Never commit `.env` files. Make sure both are in `.gitignore`.

---

## Deploying to Vercel

The backend and the frontend are two separate Vercel projects.

### Backend project

1. Import the repository and set the **Root Directory** to `backend`, with the framework preset **Other**.
2. Make sure these files exist: `api/index.js`, `app.js`, `vercel.json` and `config/db.js`. Together they run the Express app as a serverless function.
3. Add every backend variable from the table above in **Settings, Environment Variables**. Set `CLIENT_URL` to the exact frontend origin, for example `https://your-frontend.vercel.app`.
4. Redeploy. Open the backend address and check that it says `API WORKING`.

### Frontend project

1. Import the same repository and set the **Root Directory** to `frontend`.
2. Add `NEXT_PUBLIC_API_URL` set to `https://your-backend.vercel.app/api`.
3. Deploy. This value is baked in at build time, so redeploy after any change to it.

### Services to configure

- **MongoDB Atlas:** Network Access must allow `0.0.0.0/0`, because Vercel's addresses change.
- **Brevo:** turn off Authorized IPs blocking (Security settings), for the same reason.
- **Google Cloud Console:** add the backend callback address to **Authorized redirect URIs**. It must match `GOOGLE_REDIRECT_URI` exactly.
- **Stripe:** payment methods are chosen in your Stripe Dashboard (Settings, Payment methods). Make sure cards are turned on and your account can charge in NGN.

---

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| "Could not send code" on the live site, and the logs say `CORS blocked origin` | `CLIENT_URL` on the backend does not exactly match the frontend address. Check `https`, spelling, and that it has no path or trailing slash. Redeploy the backend. |
| The live site calls `localhost:8000` | `NEXT_PUBLIC_API_URL` is missing, or the frontend was not redeployed after adding it. |
| `Database connection failed` | Wrong `MONGODB_URI`, or Atlas Network Access does not allow Vercel. |
| Your data seems to disappear | The connection string has no database name, so MongoDB uses `test`. Put the name before the `?`. |
| Verification email is not sent | Check `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` on the server, that the sender is verified in Brevo, and that IP blocking is off. The server logs print `Failed to send OTP email:` with the reason. |
| Checkout fails with a "payment provider" message | The server logs print the real Stripe error. Common causes: wrong key, an invalid `CLIENT_URL`, or an account that cannot charge NGN. |
| `404` on `/api/...` after deploying | The backend project's Root Directory should be `backend`, and `vercel.json` must be present. |
| Booking emails do not arrive on Vercel | Serverless functions can stop right after they respond. Await the email call before sending the response. |

---

## Security

- Passwords are hashed with bcrypt. The password and the Google refresh token are excluded from queries by default.
- Email codes are hashed, expire automatically, allow 5 attempts, and are used up atomically so they cannot be replayed.
- Rate limits protect code requests, code checks, login, registration, booking, admin login and withdrawals.
- CORS only allows the configured frontend addresses.
- Request values are type-checked and validated (dates, times, ids, amounts) before they reach the database, which blocks query-injection attempts.
- The Google OAuth `state` is a short-lived signed token, so one user cannot attach their calendar to another account.
- Customers only ever see a small public view of a booking (no fees, payouts, notes or email).
- Admin routes require a token that carries the admin role, separate from owner tokens.

---

## Known limitations and roadmap

These are the next steps for turning BookMe from a working product into a production-hardened one:

- [ ] **Stripe webhook.** Payments are currently confirmed when the customer returns to the success page. A webhook would confirm them even if the customer closes the tab.
- [ ] **Automatic payouts.** Withdrawals are approved by an admin and paid manually, and only the last 4 digits of the account number are stored. A payment provider's transfer recipients (for example Paystack or Flutterwave) would allow real automatic transfers.
- [ ] **Refunds on cancellation.** Cancelling a paid booking does not yet refund the customer or reverse the provider's payout.
- [ ] **Encrypt the Google refresh token** at rest.
- [ ] **Read Google Calendar busy times** so events created outside BookMe also block time slots.
- [ ] **Disconnect Google Calendar** button in the profile page (the API route exists).
- [ ] **Shared rate-limit store** (for example Redis), because limits are currently kept in memory per server instance.
- [ ] **Local payment provider.** Stripe's support for NGN depends on the account's country.
- [ ] **Legal review.** The Privacy Policy and Terms of Service pages are drafts and should be reviewed by a lawyer before launch.

---

## Screenshots

Add screenshots to a `docs/screenshots/` folder and link them here:

<!--
![Owner dashboard](docs/screenshots/dashboard.png)
![Public booking page](docs/screenshots/booking-page.png)
![Payments](docs/screenshots/payments.png)
![Admin dashboard](docs/screenshots/admin.png)
-->

---

## License

Choose a license (for example MIT) and add a `LICENSE` file to the repository.

---

Built by **your name**.