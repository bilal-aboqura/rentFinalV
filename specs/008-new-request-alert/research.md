# Research Notes: New Request Alert (Feature F-08)

## 1. Delivery Channel Integration (SMTP Alert)

- **Decision**: Add a new helper function `sendAdminNotificationEmail` in [smtp.ts](file:///c:/Users/anasa/Desktop/rentFinal/src/lib/mail/smtp.ts) that uses the existing `sendMail` function to dispatch HTML and text notifications to the configured admin email.
- **Rationale**: Keeps SMTP configuration centralized, matches the existing architecture for sending passenger confirmation emails, and encapsulates the email template layout.
- **Alternatives Considered**: 
  - Calling `sendMail` directly inside the server action: Rejected because it makes it harder to unit test the template format and results in messy template strings inside business logic.
  - Adding a third-party notification library: Rejected as it introduces unnecessary dependencies.

## 2. Pending Bookings Count Query

- **Decision**: Create a Server Action `getPendingBookingsCount` in the admin bookings actions file [actions.ts](file:///c:/Users/anasa/Desktop/rentFinal/src/app/admin/bookings/actions.ts). It will execute:
  ```typescript
  const { count, error } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pending');
  ```
- **Rationale**: Using `{ count: 'exact', head: true }` triggers a high-performance `SELECT COUNT` query in PostgreSQL instead of fetching records, saving bandwidth and memory.
- **Alternatives Considered**: 
  - Loading all bookings and calculating the length in memory: Rejected due to scaling and performance overhead.

## 3. Admin Header UI & Layout

- **Decision**: Refactor the redundant admin navbar layout present on all four admin pages (`locations`, `pricing`, `drivers`, `bookings`) into a single, reusable Next.js Server Component [admin-navbar.tsx](file:///c:/Users/anasa/Desktop/rentFinal/src/components/admin-navbar.tsx). The component will accept an `activeTab` prop to render the active tab styles and will call `getPendingBookingsCount` directly to render the red badge count.
- **Rationale**: Promotes DRY (Don't Repeat Yourself) principle from the project Constitution. It makes adding the badge count across all admin views a single-line inclusion and simplifies future navigation adjustments.
- **Alternatives Considered**:
  - Updating all four admin page layout wrappers individually: Rejected because it duplicates layout code, styling, and server-side count-fetching logic.

## 4. Environment Variables

- **Decision**: Define `ADMIN_EMAIL` (the recipient of the alert) in `.env.local` and retrieve it via `process.env.ADMIN_EMAIL`.
- **Rationale**: Keeps email credentials and target addresses secure and configurable per environment.
