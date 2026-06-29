import { redirect } from 'next/navigation';

// The (customer) route group handles '/', but if this file is hit, redirect.
// In practice the (customer)/page.tsx is the landing page at '/'.
export default function RootPage() {
  redirect('/');
}
