# SMTP Helper Contracts

This contract specifies the typescript signatures and parameters for the new email delivery helpers in `src/lib/mail/smtp.ts`.

## 1. `sendBookingConfirmedEmail`

Dispatches a transactional email to the customer confirming their booking, including trip details and optional driver information.

```typescript
export interface SendBookingConfirmedEmailParams {
  email: string;
  customerName: string;
  reference: string;
  pickupName: string;
  destinationName: string;
  date: string;
  time: string;
  driverName?: string;
  driverPhone?: string;
}

export async function sendBookingConfirmedEmail(
  params: SendBookingConfirmedEmailParams
): Promise<any | null>;
```

---

## 2. `sendBookingCancelledEmail`

Dispatches a polite cancellation notification to the customer.

```typescript
export interface SendBookingCancelledEmailParams {
  email: string;
  customerName: string;
  reference: string;
}

export async function sendBookingCancelledEmail(
  params: SendBookingCancelledEmailParams
): Promise<any | null>;
```
