import { useState, type FormEvent } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { submitContact, type ContactPayload } from '../services/contact';

export function ContactPage() {
  const [form, setForm] = useState<ContactPayload>({
    name: '',
    email: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ContactPayload>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSuccess(null);
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitContact(form);
      setSuccess(res.message);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Get In Touch</h1>
        <p className="mt-2 text-slate-600">
          Questions about your booking? We're here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <ContactInfo icon={<Mail className="h-5 w-5" />} label="Email">
            support@airporttransfers.com
          </ContactInfo>
          <ContactInfo icon={<Phone className="h-5 w-5" />} label="Phone">
            +1 (555) 010-2030
          </ContactInfo>
          <ContactInfo icon={<MapPin className="h-5 w-5" />} label="Office">
            City Center Terminal
          </ContactInfo>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200"
          noValidate
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Name
              </span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Message
            </span>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
            />
          </label>

          {success && (
            <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
              {success}
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ContactInfo({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="font-medium text-slate-800">{children}</p>
      </div>
    </div>
  );
}
