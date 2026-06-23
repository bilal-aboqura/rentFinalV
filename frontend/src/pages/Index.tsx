import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui';
import { fetchContent, fetchFaq, type FaqEntry } from '../services/content';

export default function Index() {
  const [heroTitle, setHeroTitle] = useState('Reliable Airport Transfers, On Time Every Time');
  const [heroSubtitle, setHeroSubtitle] = useState(
    'Flat-rate pricing. Professional drivers. Book your ride in under a minute.',
  );
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchContent()
      .then((content) => {
        if (content.hero_title) setHeroTitle(content.hero_title);
        if (content.hero_subtitle) setHeroSubtitle(content.hero_subtitle);
      })
      .catch(() => undefined);
    fetchFaq()
      .then(setFaqs)
      .catch(() => undefined);
  }, []);

  return (
    <Layout>
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-16 text-center text-white">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-5xl">{heroTitle}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-brand-50">{heroSubtitle}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/booking">
            <Button variant="secondary" className="w-full sm:w-auto">Book a transfer</Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline" className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 sm:w-auto">
              Contact us
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { title: 'Flat-rate pricing', body: 'No surge fees. Know your fare before you book.' },
          { title: 'Professional drivers', body: 'Vetted, courteous drivers for a comfortable ride.' },
          { title: 'On-time, every time', body: 'Flight tracking and punctual pickups you can rely on.' },
        ].map((feature) => (
          <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{feature.body}</p>
          </div>
        ))}
      </section>

      {faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">Frequently asked questions</h2>
          <div className="mx-auto max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={faq.key}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-6 py-4 text-left"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                  >
                    <span className="font-medium text-slate-900">{faq.value.question}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <p className="px-6 pb-4 text-sm text-slate-600">{faq.value.answer}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </Layout>
  );
}
