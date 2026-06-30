import { Mail, Phone, Plane } from 'lucide-react';
import type { SiteSettings } from '@/types';

export default function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t border-white/10 bg-white/[0.03] px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          {settings.site_logo_url ? (
            <img
              src={settings.site_logo_url}
              alt="AirTransfer logo"
              className="h-7 w-7 rounded-md object-contain"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand-primary)]">
              <Plane className="h-3 w-3 text-white" />
            </div>
          )}
          <span className="text-sm text-slate-400">
            AirTransfer {new Date().getFullYear()}
          </span>
        </div>

        <div className="flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:gap-6">
          <a href={`tel:${settings.contact_phone}`} className="flex items-center gap-2 hover:text-white">
            <Phone className="h-4 w-4" />
            {settings.contact_phone}
          </a>
          <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 hover:text-white">
            <Mail className="h-4 w-4" />
            {settings.contact_email}
          </a>
          <a href="/admin/login" className="hover:text-white">
            Admin Login
          </a>
        </div>
      </div>
    </footer>
  );
}
