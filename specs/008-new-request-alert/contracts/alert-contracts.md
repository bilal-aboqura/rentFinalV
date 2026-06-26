# Interface Contracts: Admin Alert & Count Retrieval

This document defines the interface contracts for the booking count server action and SMTP admin notification helper for Feature F-08.

## 1. Next.js Server Action: `getPendingBookingsCount`

This server action queries the database to retrieve the total count of bookings currently in the `'Pending'` state.

### Action Signature

```typescript
export async function getPendingBookingsCount(): Promise<ServerActionResponse<{ count: number }>>
```

### Output Structure (`ServerActionResponse`)

On Success:
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

On Database Error:
```json
{
  "success": false,
  "error": "Failed to retrieve pending booking count: [Database Error Message]"
}
```

---

## 2. SMTP Notification Helper: `sendAdminNotificationEmail`

This helper function formats and dispatches an email alert to the administrator when a customer submits a new booking.

### Function Signature

```typescript
export async function sendAdminNotificationEmail(params: {
  reference: string;
  pickupName: string;
  destinationName: string;
  date: string;
  time: string;
  customerName: string;
  adminEmail: string;
}): Promise<any>
```

### Behavior
- Formats a human-readable plain text template and an HTML layout containing all the booking details.
- Inserts a URL pointing to `/admin/bookings?ref=[UUID]` or the base admin page.
- Dispatches the email via Nodemailer `transporter.sendMail`.
- Catches errors internally and returns `null` with a logged warning to ensure non-blocking execution during the customer's checkout flow.
