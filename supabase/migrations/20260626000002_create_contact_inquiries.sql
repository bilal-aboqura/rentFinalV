-- Create contact_inquiries table
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read', 'Resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for performance on newest-first sorting
CREATE INDEX IF NOT EXISTS contact_inquiries_created_at_idx ON contact_inquiries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public/guest users to insert inquiries (status must be 'Unread')
CREATE POLICY "Allow public insert to contact_inquiries"
  ON contact_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'Unread');

-- Policy 2: Allow authenticated administrators full CRUD access
CREATE POLICY "Allow admin full access to contact_inquiries"
  ON contact_inquiries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
