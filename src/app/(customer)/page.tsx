import type { Metadata } from 'next';
import CustomerHome from '@/components/customer-home';
import { getSiteSettings } from '@/app/actions/cms';
import { getPublicFleetCarsAction } from '@/app/actions/cars';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'حجز النقل من وإلى المطار | Airport Transfer Booking',
  description:
    'احجز خدمة نقل احترافية من وإلى المطار بأسعار واضحة. Book a professional airport transfer with clear pricing.',
};

export default async function CustomerPage() {
  const [settings, fleetCars] = await Promise.all([
    getSiteSettings(),
    getPublicFleetCarsAction(),
  ]);

  return <CustomerHome settings={settings} fleetCars={fleetCars} />;
}
