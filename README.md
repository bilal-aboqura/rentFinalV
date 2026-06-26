This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Cities & Airports Management

Administrators can manage the operating locations used by the transfer service at
`/admin/locations`.

Supported location operations:

- List locations with URL-driven search and pagination.
- Create locations with validated name, type, and active status fields.
- Edit an existing location's name, type, or active status.
- Delete unused locations.
- Block deletion when a location is referenced by bookings or route pricing rules, with guidance to deactivate the location instead.

Customer-facing booking dropdowns use the active locations API so inactive locations are excluded and active entries are grouped by type.

### Location Server Actions

The admin UI calls the Server Actions in `src/app/admin/locations/actions.ts`:

- `createLocationAction(input)` creates a new location.
- `updateLocationAction(input)` updates a location by UUID.
- `deleteLocationAction(id)` deletes an unused location after checking booking and route pricing references.

Run the location tests with:

```bash
npx vitest run tests/integration/createLocation.test.ts tests/integration/updateLocation.test.ts tests/integration/deleteLocation.test.ts
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
