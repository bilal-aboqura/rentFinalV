# Quickstart: Drivers Management

This validation guide outlines the scenarios and instructions to verify that the Drivers Management feature works end-to-end.

## 1. Database Setup

Create the table schema and constraints in the Supabase SQL editor:
1. Copy the DDL Script defined in [data-model.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/004-drivers-management/data-model.md).
2. Execute the script in the Supabase SQL Editor.
3. Seed the database with two initial drivers:
   - Driver A: Name: `John Doe`, Phone: `+15550100111`, Status: `Available`
   - Driver B: Name: `Bob Miller`, Phone: `+15550100222`, Status: `Busy`

---

## 2. Running Automated Tests

Run the Vitest test suite to verify data validation, phone number normalization, and schema parsing:
```bash
npx vitest tests/unit/driver.test.ts
```

Expected output:
```text
✓ tests/unit/driver.test.ts (4 tests passed)
```

---

## 3. Manual Validation Scenarios

Launch the development server:
```bash
npm run dev
```
Open a browser and navigate to the admin dashboard at `/admin/drivers`.

### Scenario 1: Retrieve and Search Drivers
1. **Action**: Load `/admin/drivers`.
   - **Expectation**: A table displays `John Doe` (Green badge: Available) and `Bob Miller` (Yellow badge: Busy).
2. **Action**: Type `Miller` in the search bar.
   - **Expectation**: The table filters and displays only `Bob Miller`.
3. **Action**: Type `+15550100111` or `555-0100-111` in the search bar.
   - **Expectation**: The table filters and displays only `John Doe` (due to case-insensitive partial phone match).

### Scenario 2: Create a New Driver (Success & Failure)
1. **Action**: Click "Add Driver".
2. **Action**: Leave the name field blank, type `+15550100333` for Phone, and submit.
   - **Expectation**: Submission is blocked, and "Name is required" is displayed next to the Name input.
3. **Action**: Enter `Alice Green` in Name, select status `Available`, and submit.
   - **Expectation**: Modal closes, success notification is shown, and `Alice Green` appears in the list.
4. **Action**: Click "Add Driver" again. Enter `Jane Smith` in Name, type `+15550100111` (duplicate of John Doe's phone number), and submit.
   - **Expectation**: The database constraint triggers, the Server Action catches it, and the modal shows an error message: "A driver with this phone number is already registered."

### Scenario 3: Update Driver Status & Details
1. **Action**: Click "Edit" next to `John Doe`.
2. **Action**: Change status from `Available` to `Inactive` and click save.
   - **Expectation**: Modal closes, status badge for John Doe updates to Red/Gray (Inactive).
3. **Action**: Open "Edit" on `John Doe` again, change phone number to `+15550100222` (duplicate of Bob Miller's phone), and save.
   - **Expectation**: Update is blocked with a duplicate phone validation error.

### Scenario 4: Delete a Driver
1. **Action**: Click "Delete" next to `Alice Green`.
2. **Action**: Confirm the confirmation dialog.
   - **Expectation**: The driver record is removed from the database and vanishes from the admin table immediately.
