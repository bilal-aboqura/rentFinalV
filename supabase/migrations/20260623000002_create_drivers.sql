-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  phone TEXT NOT NULL UNIQUE,
  availability_status TEXT NOT NULL CHECK (availability_status IN ('Available', 'Busy', 'Inactive')) DEFAULT 'Available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin Operations
-- Admins must be authenticated and carry the admin role to perform any action on drivers.
CREATE POLICY "Allow admin full access"
  ON drivers FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
