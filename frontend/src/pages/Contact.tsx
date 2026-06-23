import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button, Card, Field, Input } from '../components/ui';
import { submitContact } from '../services/contact';
import { getApiErrorMessage } from '../services/api';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function validate() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email.';
    if (!message.trim()) next.message = 'Enter a message.';
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    try {
      await submitContact({ name: name.trim(), email: email.trim(), message: message.trim() });
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send your message.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Contact us</h1>
          <p className="mt-2 text-slate-600">Questions about your booking or business travel? Send us a message.</p>
        </header>
        {done ? (
          <Card className="text-center">
            <h2 className="text-xl font-semibold text-green-700">Message sent</h2>
            <p className="mt-2 text-slate-600">Thanks for reaching out. We will get back to you shortly.</p>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <Field label="Your name" htmlFor="contact-name" required error={errors.name}>
                <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Email" htmlFor="contact-email" required error={errors.email}>
                <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Message" htmlFor="contact-message" required error={errors.message}>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </Field>
              {error && (
                <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button type="submit" loading={submitting}>Send message</Button>
            </form>
          </Card>
        )}
      </div>
    </Layout>
  );
}
