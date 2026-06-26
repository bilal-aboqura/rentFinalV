# Research Notes: Status Change Alert

## 1. Asynchronous & Non-blocking Email Dispatch

- **Decision**: Emails will be dispatched using Javascript promises *without* using `await` inside the main execution path of the server actions, and using `.catch()` to handle failures gracefully.
- **Rationale**: Email delivery over SMTP introduces network latency (often 500ms to several seconds). Awaiting this in Next.js Server Actions blocks the response, causing the admin UI to feel slow or unresponsive. Running it in the background keeps the UI snappy.
- **Alternatives Considered**:
  - *Awaiting the SMTP call*: Rejected because it violates performance requirements.
  - *Using a job queue (e.g., BullMQ, Inngest)*: Rejected to avoid adding third-party architectural dependencies, keeping the tech stack simple and standard.

## 2. Driver Detail Fetching & Types

- **Decision**: Update the Supabase query in both `updateBookingStatusAction` and `assignDriverAction` to select `driver:drivers(name, phone)` instead of just `name`. Update the TypeScript `BookingWithDetails` type in `src/types/index.ts` to make the driver's phone available (`phone?: string` on the driver object).
- **Rationale**: To include the driver's phone in the "Confirmed" email, it must be fetched from Supabase at the time of status update or driver assignment.
- **Alternatives Considered**:
  - *Querying the driver table separately*: Rejected as it causes additional database roundtrips when a single joined query can retrieve all details in one transaction.

## 3. Trigger Points for Confirmed Status

- **Decision**: The confirmation email is triggered in two scenarios:
  1. Inside `updateBookingStatusAction` when transitioning status to `Confirmed`.
  2. Inside `assignDriverAction` when a driver is assigned or updated, but *only* if the booking's current status (fetched before update) is already `Confirmed`.
- **Rationale**: Admins may confirm a booking first and assign a driver later. This approach ensures the guest customer receives the confirmation email with the driver details in both paths.
- **Alternatives Considered**:
  - *Only triggering on status change*: Rejected because the customer would never get driver info if they were assigned after the status change.
