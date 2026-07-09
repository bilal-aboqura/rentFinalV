import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getSiteSettings } from '@/app/actions/cms';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
import { LANGUAGE_COOKIE_KEY, resolveLanguage } from '@/lib/i18n/dictionaries';
import { ContactPageClient } from './contact-page-client';

export const metadata: Metadata = {
  title: 'تواصل معنا | دقه الوقت',
  description: 'تواصل مع فريق دقه الوقت لطلبات المسارات الخاصة أو الدعم أو المساعدة في الحجز.',
};

export default async function ContactPage() {
  const cookieStore = await cookies();
  const initialLanguage = resolveLanguage(
    cookieStore.get(LANGUAGE_COOKIE_KEY)?.value,
  );
  const settings = await getSiteSettings();

  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <ContactPageClient settings={settings} />
    </LanguageProvider>
  );
}
