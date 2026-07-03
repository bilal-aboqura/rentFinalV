-- Seed a starter set of active Saudi Arabia locations for booking routes.

INSERT INTO public.locations (name, type, status)
VALUES
  ('Riyadh', 'city', 'active'),
  ('Jeddah', 'city', 'active'),
  ('Makkah', 'city', 'active'),
  ('Madinah', 'city', 'active'),
  ('Dammam', 'city', 'active'),
  ('Al Khobar', 'city', 'active'),
  ('King Khalid International Airport (RUH)', 'airport', 'active'),
  ('King Abdulaziz International Airport (JED)', 'airport', 'active'),
  ('Prince Mohammad bin Abdulaziz International Airport (MED)', 'airport', 'active'),
  ('King Fahd International Airport (DMM)', 'airport', 'active')
ON CONFLICT (name) DO NOTHING;
