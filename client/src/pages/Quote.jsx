import React, { useState } from 'react';
import { ArrowUpRight, FileText, Mail, MapPin, Phone, Send } from 'lucide-react';
import api from '../services/api';

const address = 'Office No. 522, 5th Floor, Amanora Chambers, Amanora Town Centre East Block, Pune 411028';
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
const initialForm = { name: '', email: '', phone: '', subject: '', message: '', website: '' };

export default function Quote() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setNotice(null);
    try {
      await api.post('/quotes', form);
      setForm(initialForm);
      setNotice({ type: 'success', text: 'Your request was received. Our team will contact you soon.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Could not send your request. Please try again or contact us directly.' });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = 'mt-2 w-full rounded-lg border border-[#d7e1eb] bg-[#fafbfd] px-4 py-3 text-sm text-[#172536] outline-none transition focus:border-[#385775] focus:ring-2 focus:ring-[#385775]/15';

  return (
    <div className="pb-16 pt-[140px] md:pt-[86px] lg:pt-[132px]">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-8">
        <div className="min-w-0 space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#385775]">Contact information</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Talk to our team</h2>
            <p className="mt-2 text-sm text-gray-600">Call, email, or visit our Pune office.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <a href="tel:08282982829" className="group rounded-2xl border border-[#d7e1eb] bg-white p-5 shadow-sm transition hover:border-[#385775]/50 hover:shadow-md">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaf0f6] text-[#385775]"><Phone className="h-5 w-5" aria-hidden="true" /></span>
              <span className="mt-5 block text-xs font-bold uppercase tracking-widest text-gray-500">Call</span>
              <span className="mt-1 flex items-center justify-between gap-2 text-base font-bold"><span>082829 82829</span><ArrowUpRight className="h-4 w-4 text-[#385775]" aria-hidden="true" /></span>
            </a>
            <a href="mailto:sales@advaitteleservices.com" className="group min-w-0 rounded-2xl border border-[#d7e1eb] bg-white p-5 shadow-sm transition hover:border-[#385775]/50 hover:shadow-md">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaf0f6] text-[#385775]"><Mail className="h-5 w-5" aria-hidden="true" /></span>
              <span className="mt-5 block text-xs font-bold uppercase tracking-widest text-gray-500">Email</span>
              <span className="mt-1 flex items-center justify-between gap-2 text-sm font-bold"><span className="min-w-0 break-all">sales@advaitteleservices.com</span><ArrowUpRight className="h-4 w-4 shrink-0 text-[#385775]" aria-hidden="true" /></span>
            </a>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#d7e1eb] bg-white shadow-sm">
            <div className="flex items-start gap-3 p-5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf0f6] text-[#385775]"><MapPin className="h-5 w-5" aria-hidden="true" /></span>
              <div className="min-w-0">
                <h3 className="font-bold">Head Office</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{address}, Maharashtra, India.</p>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#385775] hover:underline">Open in Maps <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a>
              </div>
            </div>
            <iframe title="Map of Advait Teleservices head office in Pune" src={embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-64 w-full border-0 sm:h-72" />
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-[#d7e1eb] bg-white p-5 shadow-sm sm:p-8 lg:self-start">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#172536] text-brand-300"><FileText className="h-5 w-5" aria-hidden="true" /></span>
            <div><h2 className="text-2xl font-bold tracking-tight">Send an enquiry</h2><p className="mt-1 text-sm text-gray-600">Share a few details and we&apos;ll get back to you.</p></div>
          </div>
          <form onSubmit={submit} className="mt-7 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Your name <span className="text-red-600">*</span><input className={fieldClass} name="name" value={form.name} onChange={update} required minLength={2} maxLength={100} autoComplete="name" placeholder="Full name" /></label>
              <label className="block text-sm font-semibold">Phone <span className="font-normal text-gray-500">(optional)</span><input className={fieldClass} name="phone" value={form.phone} onChange={update} maxLength={25} autoComplete="tel" inputMode="tel" placeholder="Phone number" /></label>
            </div>
            <label className="block text-sm font-semibold">Email address <span className="text-red-600">*</span><input className={fieldClass} type="email" name="email" value={form.email} onChange={update} required maxLength={254} autoComplete="email" placeholder="you@example.com" /></label>
            <label className="block text-sm font-semibold">Subject <span className="text-red-600">*</span><input className={fieldClass} name="subject" value={form.subject} onChange={update} required minLength={3} maxLength={150} placeholder="What do you need?" /></label>
            <label className="block text-sm font-semibold">Message <span className="text-red-600">*</span><textarea className={`${fieldClass} min-h-36 resize-y`} name="message" value={form.message} onChange={update} required minLength={10} maxLength={5000} placeholder="Tell us about your requirements" /></label>
            <label className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">Website<input name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" /></label>
            {notice && <p role="status" className={`rounded-lg px-4 py-3 text-sm ${notice.type === 'success' ? 'bg-brand-50 text-brand-900' : 'bg-red-50 text-red-800'}`}>{notice.text}</p>}
            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#385775] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#293d54] disabled:cursor-wait disabled:opacity-60"><Send className="h-4 w-4" aria-hidden="true" />{submitting ? 'Sending…' : 'Send Request'}</button>
          </form>
        </div>
      </section>
    </div>
  );
}
