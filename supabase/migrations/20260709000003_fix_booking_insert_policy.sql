DROP POLICY IF EXISTS "Allow guests to insert booking requests" ON public.bookings;

CREATE POLICY "Allow guests to insert booking requests"
  ON public.bookings
  FOR INSERT
  TO anon
  WITH CHECK (status = 'Pending');
