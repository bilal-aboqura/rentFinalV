# Research: Booking Wizard (Step 1: Route & Time)

This document details the architectural decisions and technical choices made for the Booking Wizard (Step 1: Route & Time) feature, adhering to the project constitution.

## Decision 1: Interactive Form State & Next Step Transition

### Chosen Solution
Create a Next.js Client Component `BookingWizardStep1` that manages form fields (`pickupLocationId`, `destinationLocationId`, `date`, `time`) using React state. The state will be managed locally in Step 1, and upon validation and clicking "Next", the state is passed to the parent component or saved via a React Context or simple state transition handler passed down from the parent `BookingWizard`.

### Rationale
- React state is simple, clean, and has zero external dependencies, satisfying the constitution's constraint against unauthorized state management libraries.
- React Context or parent callback functions provide secure and direct state transfer to Step 2 (Trip Details Form) without polluting the URL or client history.
- Storing temporary state in memory prevents exposing draft booking parameters via URL query strings.

### Alternatives Considered
- **URL Search Parameters (`/booking?pickup=X&date=Y`)**: Rejected by requirements as "messy URL search parameters" and insecure for state persistence.
- **Redux / Zustand**: Rejected because the project constitution explicitly prohibits introducing external state management packages.

---

## Decision 2: Data Fetching and Route Pricing Integration

### Chosen Solution
- **Locations Dropdown**: Fetch active locations using the existing Server Action `fetchActiveLocationsAction()` from `src/lib/api/customerLocations.ts`. Group and sort them on the client using the utility `groupLocationsByType` from `src/lib/utils/groupLocations.ts`.
- **Pricing Query**: Query the database using a Server Action (e.g., `checkRoutePriceAction` or reuse `getRoutePriceAction` from `src/app/admin/pricing/actions.ts`). The pricing lookup is triggered dynamically in a `useEffect` on the client when both pickup and destination locations are selected and are distinct.

### Rationale
- Reusing existing database schemas and server actions prevents redundant code and ensures consistency across admin and customer operations.
- The route price lookup will run securely via Supabase RLS policies (which permit public read access to pricing).
- Showing a loading spinner (`lucide-react`) during price retrieval provides excellent visual feedback.

---

## Decision 3: Secure 2-Hour Same-Day Buffer Validation

### Chosen Solution
Enforce same-day buffer checking on the server using the central system/server local operational timezone as the single source of truth.
- A helper function `validateBookingSchedule(dateStr, timeStr, referenceDate)` will parse the input date (`YYYY-MM-DD`) and time (`HH:mm`) into a local JavaScript Date object on the server and check if the booking time is at least 2 hours in the future compared to the current server time (`new Date()`).
- The date picker input on the client will restrict selection to present and future dates using the client's current local date as a minimum boundary (`min` attribute).

### Rationale
- Validating the schedule on the server prevents users from manipulating their client device clocks to bypass the lead-time validation.
- Since the database does not contain location-specific timezone records, the server's operational timezone serves as the most consistent reference clock.
- Parsing `YYYY-MM-DDTHH:mm:00` without a timezone suffix in Node.js automatically resolves to the server's local operational timezone.

### Alternatives Considered
- **Client-Only Validation**: Rejected because client-side clocks are insecure and can easily be altered.
- **Location-Specific Timezones (external API)**: Rejected as out of scope because locations do not store timezone data.

---

## Decision 4: Testing Framework

### Chosen Solution
Use **Vitest** for testing the date and time buffer validation utilities and client-side form validation logic.

### Rationale
- Directly matches the project constitution's requirement: "Test-Driven Development (TDD) with Vitest."
- Vitest provides fast, ESM-native testing. Jest is explicitly banned.
