# Airport Transfer & Driver Booking System

A full-stack web application for managing airport transfers, built with Next.js 14+ App Router and Supabase.

## Tech Stack

- **Framework**: Next.js 14+ (App Router, Server Actions)
- **Database**: PostgreSQL via Supabase (with RLS policies)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **Validation**: Zod
- **Testing**: Vitest + Testing Library
- **Email**: Nodemailer (SMTP)
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/
│   ├── (customer)/         # Public booking interface
│   │   ├── page.tsx        # Landing page
│   │   ├── contact/        # Contact form
│   │   └── actions.ts      # Public Server Actions
│   ├── admin/
│   │   ├── login/          # Admin auth
│   │   └── dashboard/      # Protected admin area
│   │       ├── bookings/   # Booking management
│   │       ├── drivers/    # Driver profiles
│   │       ├── settings/   # Locations & pricing
│   │       ├── content/    # CMS
│   │       └── actions.ts  # Admin Server Actions
│   └── layout.tsx
├── components/
│   ├── booking-form.tsx    # 3-step booking wizard
│   └── notifications-list.tsx
├── lib/
│   ├── supabase/           # Client & server helpers
│   ├── validation/         # Zod schemas
│   └── email/              # Nodemailer utility
└── types/
    └── index.ts            # TypeScript types

supabase/
└── migrations/
    └── 20260623000000_init_schema.sql

tests/
├── unit/
│   ├── components.test.ts
│   └── email.test.ts
└── integration/
    └── actions.test.ts
```

## Environment Setup

Create `.env.local` in the project root:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

## Database Setup

### Option A — Supabase CLI (Local)
```bash
npx supabase migration up
```

### Option B — Supabase SQL Editor
Copy the contents of `supabase/migrations/20260623000000_init_schema.sql` and run in the Supabase project SQL Editor.

## Installation & Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the booking interface.
Admin dashboard: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Running Tests

```bash
# Run all tests
npx vitest run

# Watch mode
npx vitest
```

## Deployment

### Vercel (Recommended)

1. Connect the repository to Vercel
2. Set all environment variables in Vercel project settings
3. Deploy — Vercel automatically handles Next.js App Router

### Manual Build

```bash
npm run build
npm start
```

## Admin Setup

1. Create an admin user in Supabase Authentication (email + password)
2. Navigate to `/admin/login` and sign in with those credentials
3. Start managing bookings, drivers, locations, and pricing from the dashboard

## Key Features

- **Customer Booking**: 3-step wizard with real-time pricing lookup
- **Admin Dashboard**: Bookings management with search, filter, and pagination
- **Driver Assignment**: 3-hour conflict validation enforced server-side
- **Notifications**: Real-time admin alerts + customer email notifications
- **Content CMS**: Dynamic homepage content and FAQ management
- **Security**: Row-Level Security (RLS) on all Supabase tables
