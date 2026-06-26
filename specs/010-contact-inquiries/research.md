# Research: Contact Form & Inquiries Management

This document details the architectural and implementation decisions made during the planning phase for Feature F-10.

## Key Decisions

### 1. Database Table Design

* **Decision**: Create a `contact_inquiries` table in Supabase.
* **Schema**:
  * `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  * `name`: `TEXT NOT NULL`
  * `email`: `TEXT NOT NULL`
  * `subject`: `TEXT NOT NULL`
  * `message`: `TEXT NOT NULL`
  * `status`: `TEXT NOT NULL DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read', 'Resolved'))`
  * `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL`
* **Rationale**: Using standard PG types. Standardizing the status using `CHECK` ensures database-level validation of status transitions and states.
* **Alternatives Considered**: Creating a Postgres Enum type. Checked and rejected since `CHECK` constraints on text columns are easier to expand/modify without executing complex enum migrations in Supabase.

### 2. Row Level Security (RLS) Policies

* **Decision**: Enable RLS on the table with two policies:
  * **Public Insert**: Allow anonymous users to insert records, but restrict the status field to 'Unread' during insert.
  * **Admin Access**: Allow authenticated administrators full access (SELECT, UPDATE, DELETE).
* **Rationale**: Prevents unauthenticated users from querying/deleting inquiries, or inserting inquiries already marked as "Read" or "Resolved".
* **SQL**:
  ```sql
  ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Allow public insert to contact_inquiries" 
    ON contact_inquiries FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (status = 'Unread');

  CREATE POLICY "Allow admin full access to contact_inquiries" 
    ON contact_inquiries FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);
  ```

### 3. Server Actions Placement and Authentication

* **Decision**: Split the Server Actions:
  * **Public Actions**: `submitContactForm` in `src/app/actions/contact.ts`.
  * **Admin Actions**: `fetchInquiriesAction`, `updateInquiryStatusAction`, `getUnreadInquiriesCount` in `src/app/admin/inquiries/actions.ts`.
* **Rationale**: Public forms shouldn't import actions with sensitive admin imports. Placing admin-only functions in the `/admin` subtree enforces conceptual separation, and these actions must verify admin authentication before querying.
* **Authentication Validation**:
  ```typescript
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized. Admin session required.' };
  }
  ```

### 4. Admin Navbar Badge Integration

* **Decision**: Since `AdminNavbar` is a Next.js Server Component, it can directly fetch the unread count server-side:
  ```typescript
  const countRes = await getUnreadInquiriesCount();
  const unreadCount = countRes.success && countRes.data ? countRes.data.count : 0;
  ```
  The badge will render inline next to the Inquiries nav link.
* **Rationale**: Avoids unnecessary client-side fetching or Socket/WebSocket listeners, keeping VPS resources lightweight.

### 5. Testing Patterns

* **Decision**: Write unit tests using **Vitest** in `tests/unit/contact-actions.test.ts` and `tests/unit/contact-validation.test.ts`. Mock `createClient` from `@/lib/supabase/server` to mock Supabase DB responses.
* **Rationale**: Consistently aligns with current unit test suites in `tests/unit`.
