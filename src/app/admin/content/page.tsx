'use client';

import React, { useState, useEffect, useTransition } from 'react';
import AdminNavbar from '@/components/admin-navbar';
import { getSiteSettings, updateSiteSettings, uploadSiteAsset } from '@/app/actions/cms';
import { SiteSettings } from '@/types';

export default function AdminContentPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [formData, setFormData] = useState({
    hero_title: '',
    about_text: '',
    contact_phone: '',
    contact_email: '',
    brand_primary_color: '#800000',
    brand_secondary_color: '#0b0c10',
  });

  const [isPending, startTransition] = useTransition();
  const [logoPending, setLogoPending] = useState(false);
  const [heroPending, setHeroPending] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    async function loadSettings() {
      const data = await getSiteSettings();
      setSettings(data);
      setFormData({
        hero_title: data.hero_title,
        about_text: data.about_text,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        brand_primary_color: data.brand_primary_color.startsWith('#') ? data.brand_primary_color : '#800000',
        brand_secondary_color: data.brand_secondary_color.startsWith('#') ? data.brand_secondary_color : '#0b0c10',
      });
    }
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setValidationErrors({});

    startTransition(async () => {
      const res = await updateSiteSettings(formData);
      if (res.success) {
        setMessage({ type: 'success', text: 'Text and brand settings updated successfully.' });
        // Refresh site settings from server
        const updated = await getSiteSettings();
        setSettings(updated);
      } else {
        if (res.validationErrors) {
          setValidationErrors(res.validationErrors);
          setMessage({ type: 'error', text: 'Please fix validation errors.' });
        } else {
          setMessage({ type: 'error', text: res.error || 'Failed to update settings.' });
        }
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, assetType: 'logo' | 'hero') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);
    if (assetType === 'logo') setLogoPending(true);
    else setHeroPending(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('assetType', assetType);

      const res = await uploadSiteAsset(uploadFormData);
      if (res.success && res.url) {
        setMessage({ type: 'success', text: `${assetType === 'logo' ? 'Logo' : 'Hero background'} uploaded and updated successfully.` });
        const updated = await getSiteSettings();
        setSettings(updated);
      } else {
        setMessage({ type: 'error', text: res.error || 'Upload failed.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'An unexpected error occurred during upload.' });
    } finally {
      if (assetType === 'logo') setLogoPending(false);
      else setHeroPending(false);
      // Clear file input value
      e.target.value = '';
    }
  };

  if (!settings) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <AdminNavbar activeTab="content" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-400 font-medium">Loading CMS configuration...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <AdminNavbar activeTab="content" />

      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Content Management System</h1>
            <p className="text-slate-400 text-base mt-2">
              Manage dynamic texts, branding color schemes, and media files directly on your website.
            </p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Forms section */}
            <div className="md:col-span-2 space-y-6">
              <form onSubmit={handleTextSubmit} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  Text & Theme Branding Settings
                </h2>

                <div className="grid grid-cols-1 gap-6">
                  {/* Hero Title */}
                  <div>
                    <label htmlFor="hero_title" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Hero Page Title
                    </label>
                    <input
                      type="text"
                      id="hero_title"
                      name="hero_title"
                      value={formData.hero_title}
                      onChange={handleChange}
                      placeholder="Enter site hero section header title"
                      className={`w-full bg-slate-950 border ${
                        validationErrors.hero_title ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-850 focus:border-indigo-500'
                      } rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all`}
                    />
                    {validationErrors.hero_title && (
                      <p className="text-xs text-rose-400 mt-1.5">{validationErrors.hero_title[0]}</p>
                    )}
                  </div>

                  {/* About Us text */}
                  <div>
                    <label htmlFor="about_text" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      About Us Description Text
                    </label>
                    <textarea
                      id="about_text"
                      name="about_text"
                      rows={4}
                      value={formData.about_text}
                      onChange={handleChange}
                      placeholder="Describe the company's background services..."
                      className={`w-full bg-slate-950 border ${
                        validationErrors.about_text ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-850 focus:border-indigo-500'
                      } rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all`}
                    />
                    {validationErrors.about_text && (
                      <p className="text-xs text-rose-400 mt-1.5">{validationErrors.about_text[0]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Contact Phone */}
                    <div>
                      <label htmlFor="contact_phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Contact Phone Number
                      </label>
                      <input
                        type="text"
                        id="contact_phone"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                        className={`w-full bg-slate-950 border ${
                          validationErrors.contact_phone ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-850 focus:border-indigo-500'
                        } rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all`}
                      />
                      {validationErrors.contact_phone && (
                        <p className="text-xs text-rose-400 mt-1.5">{validationErrors.contact_phone[0]}</p>
                      )}
                    </div>

                    {/* Contact Email */}
                    <div>
                      <label htmlFor="contact_email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Contact Email Address
                      </label>
                      <input
                        type="email"
                        id="contact_email"
                        name="contact_email"
                        value={formData.contact_email}
                        onChange={handleChange}
                        placeholder="contact@company.com"
                        className={`w-full bg-slate-950 border ${
                          validationErrors.contact_email ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-850 focus:border-indigo-500'
                        } rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all`}
                      />
                      {validationErrors.contact_email && (
                        <p className="text-xs text-rose-400 mt-1.5">{validationErrors.contact_email[0]}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    {/* Primary Color */}
                    <div>
                      <label htmlFor="brand_primary_color" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Primary Theme Color
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          id="brand_primary_color"
                          name="brand_primary_color"
                          value={formData.brand_primary_color}
                          onChange={handleChange}
                          className="w-12 h-11 bg-transparent border-0 rounded-lg cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          name="brand_primary_color"
                          value={formData.brand_primary_color}
                          onChange={handleChange}
                          placeholder="#800000"
                          className="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        />
                      </div>
                      {validationErrors.brand_primary_color && (
                        <p className="text-xs text-rose-400 mt-1.5">{validationErrors.brand_primary_color[0]}</p>
                      )}
                    </div>

                    {/* Secondary Color */}
                    <div>
                      <label htmlFor="brand_secondary_color" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Secondary Theme Color
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          id="brand_secondary_color"
                          name="brand_secondary_color"
                          value={formData.brand_secondary_color}
                          onChange={handleChange}
                          className="w-12 h-11 bg-transparent border-0 rounded-lg cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          name="brand_secondary_color"
                          value={formData.brand_secondary_color}
                          onChange={handleChange}
                          placeholder="#0b0c10"
                          className="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        />
                      </div>
                      {validationErrors.brand_secondary_color && (
                        <p className="text-xs text-rose-400 mt-1.5">{validationErrors.brand_secondary_color[0]}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving changes...</span>
                      </>
                    ) : (
                      <span>Save Brand & Settings</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Media Upload area */}
            <div className="space-y-6 col-span-1">
              {/* Logo upload card */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 flex flex-col space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Site Brand Logo</h3>
                
                <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950 p-4 min-h-[140px] relative">
                  {settings.site_logo_url ? (
                    <img
                      src={settings.site_logo_url}
                      alt="Uploaded Logo preview"
                      className="max-h-24 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-slate-500 text-xs text-center">No logo uploaded yet</span>
                  )}
                  {logoPending && (
                    <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-slate-400">Uploading...</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer transition-colors border border-slate-700/50 text-center">
                    <span>Upload Logo Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                      disabled={logoPending}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-2 text-center">PNG, JPG, WebP. Max 5MB.</p>
                </div>
              </div>

              {/* Hero background card */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 flex flex-col space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hero Background Image</h3>

                <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950 min-h-[140px] relative overflow-hidden p-2">
                  {settings.hero_image_url ? (
                    <img
                      src={settings.hero_image_url}
                      alt="Uploaded Hero Background preview"
                      className="max-h-24 w-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-slate-500 text-xs text-center">No hero background uploaded</span>
                  )}
                  {heroPending && (
                    <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-slate-400">Uploading...</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer transition-colors border border-slate-700/50 text-center">
                    <span>Upload Hero Background</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'hero')}
                      disabled={heroPending}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-2 text-center">PNG, JPG, WebP. Max 5MB.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
