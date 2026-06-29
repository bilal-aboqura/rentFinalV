# Airport Transfer and Driver Booking System

A decoupled web application with a public-facing customer booking interface and a secure admin dashboard. Customers can get flat-rate quotes and book airport transfers; admins manage bookings, drivers, pricing, locations, content, and notifications.

## Architecture

- **Backend**: Node.js + Express + TypeScript, PostgreSQL via Sequelize ORM, JWT auth in HTTP-only cookies, Nodemailer SMTP notifications.
- **Frontend**: Vite + React + TypeScript SPA, Tailwind CSS, React Router.
- **Deployment**: PM2 (Node) behind Nginx (static + reverse proxy) on a Linux VPS with TLS (Let's Encrypt).

```
backend/   # Express REST API
├── src/
│   ├── config/       # database & env
│   ├── controllers/  # request handlers
│   ├── middleware/   # auth, logging, error handling
│   ├── models/       # Sequelize models & associations
│   ├── routes/       # API route registration
│   ├── services/     # email & notification logic
│   └── app.ts        # Express app factory
├── migrations/       # umzug-style DB migrations
├── seeders/          # initial admin + mock data
└── tests/            # Vitest unit & integration tests

frontend/  # Vite React SPA
├── src/
│   ├── components/   # BookingForm, AdminLayout, AdminNotifications
│   ├── pages/        # Booking, Contact, Login, Admin* pages
│   ├── services/     # typed API clients
│   ├── contexts/     # AuthContext
│   └── App.tsx       # router
└── tests/            # Vitest component tests
```

## Prerequisites

- Node.js **v18+**
- npm **v9+**
- PostgreSQL **v14+**

## Environment Setup

1. Create a PostgreSQL database:
   ```bash
   createdb airport_transfer_booking
   ```

2. Copy the example env files and fill in real values:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   Key variables (see `backend/.env.example`):
   - `DATABASE_URL` – PostgreSQL connection string
   - `JWT_SECRET` – secret used to sign admin session tokens
   - `SMTP_*` – SMTP credentials for transactional email
   - `CORS_ORIGIN` – frontend origin (default `http://localhost:5173`)

   Frontend: `VITE_API_URL` – backend URL (default `http://localhost:5000`).

## Installation & Database Setup

```bash
# 1. Install dependencies for both workspaces
npm --prefix backend install
npm --prefix frontend install

# 2. Run database migrations
npm --prefix backend run migrate

# 3. Seed initial data (admin user, locations, pricing rules, FAQ content)
npm --prefix backend run seed
```

Default admin credentials (from seeder): **`admin` / `SecurePassword123`**

## Running the App (Development)

```bash
# Backend API on :5000
npm --prefix backend run dev

# Frontend SPA on :5173
npm --prefix frontend run dev
```

Visit `http://localhost:5173` for the customer site and `http://localhost:5173/admin` for the admin dashboard.

## Testing

All tests use **Vitest** (tests are written first per the TDD constitution).

```bash
npm --prefix backend test     # backend unit + integration
npm --prefix frontend test    # frontend component tests
```

Type checking:
```bash
npm --prefix backend run typecheck
npm --prefix frontend run typecheck
```

## Production Build

```bash
# Backend -> backend/dist
npm --prefix backend run build

# Frontend -> frontend/dist
npm --prefix frontend run build
```

Run the backend in production with PM2:
```bash
pm2 start "node backend/dist/server.js" --name airport-api
pm2 save
pm2 startup
```

### Nginx + TLS

Use `nginx.conf` as a template. Replace `airporttransfers.example.com` with your domain, provision certs with Certbot:

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d airporttransfers.example.com
sudo cp nginx.conf /etc/nginx/sites-available/airport-transfers
sudo ln -s /etc/nginx/sites-available/airport-transfers /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Manual Validation Scenarios

### Customer Booking
1. Open the booking page, pick pickup + destination, a future date, vehicle class.
2. The price renders dynamically; fill contact details and submit.
3. A confirmation screen shows `BK-XXXXXX`; the booking is saved with status `pending` and an admin notification is logged.

### Admin Status Transition
1. Go to `/admin`, log in as `admin` / `SecurePassword123`.
2. Open Bookings, confirm a pending booking.
3. Status becomes `confirmed` and a customer email is dispatched via SMTP (check your SMTP trap).

See `specs/001-airport-transfer-booking/quickstart.md` for the full end-to-end guide.

## Project Documentation

Full design artifacts live under `specs/001-airport-transfer-booking/`:
`plan.md`, `data-model.md`, `contracts/api.md`, `research.md`, `tasks.md`.
