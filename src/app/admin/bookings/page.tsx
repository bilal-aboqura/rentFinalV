import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const urlParams = new URLSearchParams();

  if (params.page) {
    urlParams.set('page', params.page);
  }

  if (params.status) {
    urlParams.set('status', params.status.toLowerCase());
  }

  const nextUrl = `/admin/dashboard/bookings${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
  redirect(nextUrl);
}
