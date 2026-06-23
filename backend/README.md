# Airport Transfer and Driver Booking System — Deployment Guide

This guide covers environment configuration and production deployment for the
decoupled Airport Transfer application (`backend/` + `frontend/`).

## Architecture

- **Backend** (`backend/`): Node.js + Express + TypeScript, Sequelize ORM, PostgreSQL, JWT auth, Nodemailer SMTP.
- **Frontend** (`frontend/`): Vite + React + TypeScript SPA styled with Tailwind CSS.
- **Reverse proxy**: Nginx terminates TLS, serves the frontend static bundle, and reverse-proxies `/api/*` to the Node backend (managed by PM2).

## Prerequisites

- Node.js v18+ and NPM v9+
- PostgreSQL v14+
- (Production) A Linux VPS (Ubuntu 22.04 LTS recommended), a domain name, and an SMTP provider.

---

## 1. Environment Setup

### Backend
Copy `backend/.env.example` to `backend/.env` and fill in real values:

```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/airport_transfer_booking
JWT_SECRET=super_secret_jwt_key_change_in_production
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=test_smtp_user
SMTP_PASS=test_smtp_password
SMTP_FROM=noreply@airporttransfers.com
CORS_ORIGIN=http://localhost:5173
```

### Frontend
Copy `frontend/.env.example` to `frontend/.env`:

```ini
VITE_API_URL=http://localhost:5000
```

> In production set `VITE_API_URL` to the public origin (e.g. `https://transfers.example.com`) and `CORS_ORIGIN` to the same value.

---

## 2. Installation & Database

```bash
# Install dependencies
npm --prefix backend install
npm --prefix frontend install

# Create the PostgreSQL database (one-time)
createdb airport_transfer_booking

# Run migrations and seed initial data (admin user, locations, pricing, FAQ)
npm --prefix backend run migrate
npm --prefix backend run seed
```

Default seeded admin credentials: `admin` / `SecurePassword123` — **change immediately in production** by updating the seeder or creating a new admin.

---

## 3. Development

```bash
# Backend API (http://localhost:5000)
npm --prefix backend run dev

# Frontend SPA (http://localhost:5173, proxies /api to the backend)
npm --prefix frontend run dev
```

---

## 4. Testing

All tests use Vitest.

```bash
npm --prefix backend test      # integration + unit tests
npm --prefix frontend test     # BookingForm unit tests
```

Integration tests require a reachable PostgreSQL test database
(`airport_transfer_booking_test`). Create it once:

```bash
createdb airport_transfer_booking_test
NODE_ENV=test npm --prefix backend test
```

---

## 5. Production Build

```bash
# Backend: compile TypeScript to dist/
npm --prefix backend run build

# Frontend: type-check + production bundle to dist/
npm --prefix frontend run build
```

---

## 6. Production Deployment (Nginx + PM2)

1. **Process manager (PM2)** — keep the backend running and restart on boot:

   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name airport-api --env production
   pm2 save
   pm2 startup
   ```

2. **Nginx** — copy the provided `nginx.conf` to `/etc/nginx/sites-available/airport-transfers`
   (symlink into `sites-enabled`), set `server_name`, point `ssl_certificate` /
   `ssl_certificate_key` to your certificates, then:

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. **TLS** — issue free certificates with Certbot (Let's Encrypt):

   ```bash
   sudo certbot --nginx -d transfers.example.com
   ```

4. **Frontend static assets** — upload `frontend/dist/` to `/var/www/airport-transfers`
   (the path referenced by `nginx.conf`).

The backend must never be exposed directly: Nginx proxies `/api/*` to `127.0.0.1:5000`
and blocks direct access to port 5000.

---

## 7. Validation Checklist

- [ ] `npm --prefix backend run build` succeeds (strict TypeScript).
- [ ] `npm --prefix frontend run build` succeeds.
- [ ] Backend + frontend test suites pass.
- [ ] Customer can fetch a quote, submit a booking, and receive a `BK-XXXXXX` reference.
- [ ] Admin can log in, confirm a booking, and a customer email is dispatched via SMTP.
- [ ] Nginx serves TLS and reverse-proxies `/api` correctly.
