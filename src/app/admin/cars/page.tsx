import { getAdminCarsAction } from '@/app/actions/cars';
import { CarsManager } from '@/components/cars-manager';

export const metadata = {
  title: 'إدارة السيارات | لوحة التحكم',
  description: 'إدارة أسطول السيارات المتاحة للحجز.',
};

export default async function AdminCarsPage() {
  const cars = await getAdminCarsAction();
  return (
    <div className="space-y-6">
      <CarsManager initialCars={cars} />
    </div>
  );
}
