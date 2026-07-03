import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function DriversPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const urlParams = new URLSearchParams();

  if (params.search) {
    urlParams.set('search', params.search);
  }

  if (params.page) {
    urlParams.set('page', params.page);
  }

  const nextUrl = `/admin/dashboard/drivers${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
  redirect(nextUrl);
}
