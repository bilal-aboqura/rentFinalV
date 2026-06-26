'use client';

import React, { useState } from 'react';
import { submitContactForm } from '@/app/actions/contact';
import { Mail, User, BookOpen, MessageSquare, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const res = await submitContactForm(formData);
      if (res.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else if (res.validationErrors) {
        setErrors(res.validationErrors as Record<string, string[]>);
      } else {
        setGeneralError(res.error || 'Failed to submit contact form.');
      }
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/60 sticky top-0 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                RF
              </div>
              <span className="font-bold text-white tracking-wide group-hover:text-blue-400 transition-colors">RentFinal</span>
            </a>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="/" className="text-slate-400 hover:text-white transition-colors">
              Home
            </a>
            <a href="/admin/bookings" className="text-slate-400 hover:text-white transition-colors">
              Admin Dashboard
            </a>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center items-center py-16 px-4 relative overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.25),rgba(255,255,255,0))]">
        <div className="w-full max-w-2xl relative z-10">
          
          {/* Header Link Back */}
          <div className="mb-6">
            <a href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors duration-200 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </a>
          </div>

          {/* Form Card */}
          <div className="w-full bg-slate-900/40 border border-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            {success ? (
              <div className="text-center py-8 space-y-6 animate-fadeIn">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 mb-2">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Message Sent Successfully!</h2>
                  <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
                    Thank you for reaching out. We have received your inquiry and will respond to your email address as soon as possible.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => setSuccess(false)}
                    className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors duration-200"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Get in Touch</h1>
                  <p className="text-slate-400 text-sm sm:text-base mt-1">
                    Have a question or want to request custom route pricing? Send us a message.
                  </p>
                </div>

                {generalError && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{generalError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950/80 border text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                          errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-1">{errors.name[0]}</p>
                    )}
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john.doe@example.com"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950/80 border text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                          errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1">{errors.email[0]}</p>
                    )}
                  </div>

                  {/* Subject field */}
                  <div className="space-y-2">
                    <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Subject
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="subject"
                        id="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Inquiry about custom routes"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950/80 border text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                          errors.subject ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {errors.subject && (
                      <p className="text-red-400 text-xs mt-1">{errors.subject[0]}</p>
                    )}
                  </div>

                  {/* Message field */}
                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Message
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 flex items-center pointer-events-none text-slate-500">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <textarea
                        name="message"
                        id="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Please describe your inquiries or details about custom pricing routes..."
                        className={`w-full pl-10 pr-4 py-3 rounded-lg bg-slate-950/80 border text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none ${
                          errors.message ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                      <span>{errors.message ? <span className="text-red-400">{errors.message[0]}</span> : ''}</span>
                      <span>{formData.message.length} / 3000 chars</span>
                    </div>
                  </div>

                  {/* Submit button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting Message...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 RentFinal Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
