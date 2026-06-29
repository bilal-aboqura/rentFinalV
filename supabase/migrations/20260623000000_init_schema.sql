-- ============================================================
-- Migration: 20260623000000_init_schema.sql
-- Airport Transfer and Driver Booking System — Initial Schema
-- ============================================================

-- ============================================================
-- 1. Locations Table
-- ============================================================
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('city', 'airport')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to locations"
  ON public.locations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin full access to locations"
  ON public.locations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 2. Drivers Table
-- ============================================================
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_plate TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access to drivers"
  ON public.drivers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. Pricing Rules Table
-- ============================================================
CREATE TABLE public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  destination_location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  vehicle_class TEXT NOT NULL CHECK (vehicle_class IN ('standard', 'executive', 'van')),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT pricing_rules_route_class_unique UNIQUE (pickup_location_id, destination_location_id, vehicle_class)
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to pricing rules"
  ON public.pricing_rules FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin full access to pricing rules"
  ON public.pricing_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. Bookings Table
-- ============================================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id TEXT NOT NULL UNIQUE,
  pickup_location_id UUID REFERENCES public.locations(id) ON DELETE RESTRICT NOT NULL,
  destination_location_id UUID REFERENCES public.locations(id) ON DELETE RESTRICT NOT NULL,
  trip_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  vehicle_class TEXT NOT NULL CHECK (vehicle_class IN ('standard', 'executive', 'van')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow guests to insert booking requests"
  ON public.bookings FOR INSERT
  TO anon
  WITH CHECK (status = 'pending');

CREATE POLICY "Allow admin full access to bookings"
  ON public.bookings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 5. Content Table
-- ============================================================
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to content"
  ON public.content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow admin full access to content"
  ON public.content FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 6. Notifications Table
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('admin_new_booking', 'customer_status_change')),
  read_status BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access to notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Seed: Default Content Entries
-- ============================================================
INSERT INTO public.content (key, value, description) VALUES
  ('hero_title', 'Premium Airport Transfers', 'Homepage hero section title'),
  ('hero_subtitle', 'Reliable, flat-rate rides to and from the airport — book in minutes.', 'Homepage hero subtitle'),
  ('faq_1_question', 'How do I book a ride?', 'FAQ item 1 question'),
  ('faq_1_answer', 'Use the booking form on our homepage to select your route, vehicle class, and travel time.', 'FAQ item 1 answer'),
  ('faq_2_question', 'Are prices fixed?', 'FAQ item 2 question'),
  ('faq_2_answer', 'Yes. All prices are flat-rate and calculated based on your chosen route and vehicle class.', 'FAQ item 2 answer'),
  ('faq_3_question', 'Can I cancel my booking?', 'FAQ item 3 question'),
  ('faq_3_answer', 'Please contact us as soon as possible. Cancellations depend on availability and timing.', 'FAQ item 3 answer')
ON CONFLICT (key) DO NOTHING;
