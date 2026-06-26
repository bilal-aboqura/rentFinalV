# Server Actions Contract: Contact Form & Inquiries Management

This contract defines the Server Actions, Zod validation schemas, and types that act as the interface between the client UI and database operations.

## 1. Public Actions

### `submitContactForm`

Processes, validates, and persists a public contact form submission.

* **Path**: `@/app/actions/contact.ts`
* **Signature**:
  ```typescript
  export async function submitContactForm(
    payload: SubmitContactFormPayload
  ): Promise<ServerActionResponse<{ success: boolean }>>
  ```
* **Payload Types**:
  ```typescript
  export interface SubmitContactFormPayload {
    name: string;
    email: string;
    subject: string;
    message: string;
  }
  ```
* **Zod Schema (`ContactFormSchema`)**:
  ```typescript
  import { z } from 'zod';

  export const ContactFormSchema = z.object({
    name: z
      .string()
      .min(1, { message: 'Full name is required.' })
      .max(100, { message: 'Full name cannot exceed 100 characters.' }),
    email: z
      .string()
      .min(1, { message: 'Email address is required.' })
      .email({ message: 'Please enter a valid email address.' }),
    subject: z
      .string()
      .min(1, { message: 'Subject is required.' })
      .max(150, { message: 'Subject cannot exceed 150 characters.' }),
    message: z
      .string()
      .min(1, { message: 'Message is required.' })
      .max(3000, { message: 'Message cannot exceed 3000 characters.' }),
  });
  ```
* **Expected Response**:
  * Success: `{ success: true, data: { success: true } }`
  * Validation Error: `{ success: false, validationErrors: { name: [...], email: [...] } }`
  * Database Error: `{ success: false, error: "Error message details" }`

---

## 2. Admin Actions

All admin actions must verify the user is logged in as an authenticated admin before executing database queries.

### `fetchInquiriesAction`

Queries contact inquiries sorted newest first (`created_at DESC`) with server-side pagination.

* **Path**: `@/app/admin/inquiries/actions.ts`
* **Signature**:
  ```typescript
  export async function fetchInquiriesAction(input: {
    page: number;
    limit: number;
  }): Promise<ServerActionResponse<{ inquiries: ContactInquiry[]; totalCount: number }>>
  ```
* **Expected Response**:
  * Success: `{ success: true, data: { inquiries: ContactInquiry[], totalCount: number } }`
  * Error: `{ success: false, error: "Unauthorized" | "Database query error" }`

### `updateInquiryStatusAction`

Updates the status of an existing inquiry (e.g. marking as "Read" or "Resolved").

* **Path**: `@/app/admin/inquiries/actions.ts`
* **Signature**:
  ```typescript
  export async function updateInquiryStatusAction(
    input: unknown
  ): Promise<ServerActionResponse<ContactInquiry>>
  ```
* **Zod Schema (`UpdateInquiryStatusSchema`)**:
  ```typescript
  export const UpdateInquiryStatusSchema = z.object({
    inquiryId: z.string().uuid({ message: 'Invalid inquiry ID.' }),
    status: z.enum(['Unread', 'Read', 'Resolved'], {
      message: 'Invalid status selection.',
    }),
  });
  ```
* **Expected Response**:
  * Success: `{ success: true, data: ContactInquiry }`
  * Validation Error: `{ success: false, validationErrors: { status: [...] } }`
  * Error: `{ success: false, error: "Inquiry not found" | "Database error" }`

### `getUnreadInquiriesCount`

Gets the count of inquiries in the database that have a status of `'Unread'`.

* **Path**: `@/app/admin/inquiries/actions.ts`
* **Signature**:
  ```typescript
  export async function getUnreadInquiriesCount(): Promise<ServerActionResponse<{ count: number }>>
  ```
* **Expected Response**:
  * Success: `{ success: true, data: { count: number } }`
  * Error: `{ success: false, error: "Database error" }`
