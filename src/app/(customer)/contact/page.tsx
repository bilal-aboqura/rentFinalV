'use client';

import { useState, useTransition } from 'react';
import { Plane, Send, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { submitContactAction } from '@/app/(customer)/actions';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitContactAction(form);
      if (result.success) {
        setSubmitted(true);
      } else {
        const fieldErrors: Record<string, string> = {};
        if (result.validationErrors) {
          Object.entries(result.validationErrors).forEach(([key, msgs]) => {
            fieldErrors[key] = msgs[0];
          });
        } else {
          fieldErrors._general = result.error;
        }
        setErrors(fieldErrors);
      }
    });
  };

  return (
    <main className="min-h-screen animated-bg flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" id="contact-back-link" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Plane className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white">AirTransfer</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white mb-4">Get in Touch</h1>
            <p className="text-slate-400">
              Have a question or special request? Send us a message and we&apos;ll respond promptly.
            </p>
          </div>

          {submitted ? (
            <div className="glass rounded-2xl p-10 text-center space-y-6 glow">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
              <h2 className="text-2xl font-bold text-white">Message Sent!</h2>
              <p className="text-slate-400">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
              <Link
                id="contact-back-home-btn"
                href="/"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5 glow">
              {errors._general && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors._general}
                </div>
              )}

              <div>
                <label htmlFor="contact-name" className="block text-sm text-slate-400 mb-2">Full Name</label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-sm text-slate-400 mb-2">Email Address</label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm text-slate-400 mb-2">Message</label>
                <textarea
                  id="contact-message"
                  placeholder="How can we help you?"
                  rows={5}
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                />
                {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message}</p>}
              </div>

              <button
                id="contact-submit-btn"
                type="submit"
                disabled={isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Message</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
