import type { Metadata } from 'next';
import { getSiteSettings } from '@/app/actions/cms';
import { ContactPageClient } from './contact-page-client';

export const metadata: Metadata = {
  title: 'تواصل معنا | دقه الوقت',
  description: 'تواصل مع فريق دقه الوقت لطلبات المسارات الخاصة أو الدعم أو المساعدة في الحجز.',
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return <ContactPageClient settings={settings} />;
}
