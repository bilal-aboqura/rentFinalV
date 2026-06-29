/**
 * API Route for client-side location pagination/search.
 * Called by LocationsManager to refresh data when page or search changes.
 *
 * Route: GET /admin/locations/api
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLocationsData } from '../data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);

  const result = await getLocationsData({ search, page, pageSize });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
