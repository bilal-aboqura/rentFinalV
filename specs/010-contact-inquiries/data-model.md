# Data Model: Contact Form & Inquiries Management

This document maps out the database schema, attributes, constraints, RLS policies, and index details required to support Feature F-10.

## 1. Contact Inquiry Entity

All submissions from the contact form are stored in the `contact_inquiries` table.

### Table Schema

- **Table Name**: `contact_inquiries`
- **Columns**:

| Column Name | Database Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key. Unique identifier. |
| `name` | `TEXT` | No | None | Full Name of the customer (Length: 1-100 characters). |
| `email` | `TEXT` | No | None | Valid email address of the customer. |
| `subject` | `TEXT` | No | None | Subject line of the inquiry (Length: 1-150 characters). |
| `message` | `TEXT` | No | None | Message content of the inquiry (Length: 1-3000 characters). |
| `status` | `TEXT` | No | `'Unread'` | Status Enum. Value must be `'Unread'`, `'Read'`, or `'Resolved'`. |
| `created_at` | `TIMESTAMPTZ` | No | `timezone('utc'::text, now())` | Submission timestamp in UTC. |

### Constraints

* **Primary Key**: `id`
* **Status Check Constraint**: `CHECK (status IN ('Unread', 'Read', 'Resolved'))`
* **Text Length Validation** (Enforced client-side and server-side via Zod validation):
  * `name`: `min(1)`, `max(100)`
  * `email`: Zod `email()` validation
  * `subject`: `min(1)`, `max(150)`
  * `message`: `min(1)`, `max(3000)`

---

## 2. Row Level Security (RLS) & Policies

RLS is enabled on `contact_inquiries` to restrict unauthorized access to guest submissions.

* **Enable RLS SQL**:
  ```sql
  ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;
  ```

### Policies

#### Policy 1: Allow public insert
* **Purpose**: Allow guest users on `/contact` page to submit new contact form inquiries.
* **Scope**: `INSERT`
* **Roles**: `anon`, `authenticated`
* **Check Expression**: `WITH CHECK (status = 'Unread')`
* **Rationale**: Restricts guest submissions to initial `'Unread'` status only.

#### Policy 2: Allow admin full access
* **Purpose**: Allow authenticated administrators full access to list, view, and update inquiry statuses.
* **Scope**: `ALL` (SELECT, INSERT, UPDATE, DELETE)
* **Roles**: `authenticated`
* **Using/Check Expression**: `USING (true) WITH CHECK (true)`
* **Rationale**: Standard role-based access control. Authenticated administrator sessions have unrestricted CRUD capabilities.

---

## 3. Database Indexes

To optimize queries on the admin dashboard, the following index is defined:

```sql
CREATE INDEX IF NOT EXISTS contact_inquiries_created_at_idx ON contact_inquiries(created_at DESC);
```
* **Rationale**: The admin dashboard sorts inquiries by newest first (`created_at DESC`) and supports server-side pagination.
