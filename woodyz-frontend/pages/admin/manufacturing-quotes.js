import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import api from '../../lib/api';

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Timestamp unavailable' : date.toLocaleString();
}

export default function AdminManufacturingQuotes() {
  const { isReady: authReady } = useAuthGuard({ requiredRole: 'ADMIN', redirectTo: '/' });
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/manufacturing/quotes/admin');
      setQuotes(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.response?.status === 403
        ? 'Your account is not authorized to view manufacturing requests.'
        : 'We could not load manufacturing requests. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authReady) loadQuotes();
  }, [authReady, loadQuotes]);

  if (!authReady || loading) return <LoadingScreen message="Loading manufacturing quotes..." />;

  return (
    <>
      <Head><title>Manufacturing Quotes | WOODYZ Admin</title><meta name="robots" content="noindex,nofollow" /></Head>
      <AdminLayout activeTab="manufacturing-quotes">
        <main>
          <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-orange">WOODYZ Manufacturing</p>
              <h1 className="font-display text-4xl font-black text-3d sm:text-5xl">Quote Requests</h1>
              <p className="mt-3 font-semibold text-charcoal/55">Latest requests from businesses and project teams.</p>
            </div>
            <button type="button" onClick={loadQuotes} disabled={loading} className="rounded-xl border-2 border-charcoal bg-white px-5 py-3 text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_#3A322B] transition hover:bg-cream disabled:opacity-60">Refresh list</button>
          </header>

          {error ? (
            <section role="alert" className="rounded-3xl border-2 border-red-200 bg-red-50 p-8 text-red-900">
              <h2 className="text-xl font-black">Could not load requests</h2>
              <p className="mt-2 font-semibold">{error}</p>
              <button type="button" onClick={loadQuotes} className="mt-5 rounded-lg border-2 border-red-900 px-4 py-2 font-bold">Try again</button>
            </section>
          ) : quotes.length === 0 ? (
            <section className="rounded-3xl border-2 border-dashed border-charcoal/20 bg-white px-6 py-20 text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-charcoal/40">Nothing in the queue</p>
              <h2 className="mt-3 font-display text-2xl font-black">New quote requests will appear here.</h2>
            </section>
          ) : (
            <div className="space-y-5" aria-live="polite">
              <p className="text-xs font-black uppercase tracking-widest text-charcoal/45">Showing {quotes.length} most recent request{quotes.length === 1 ? '' : 's'}</p>
              {quotes.map((quote) => (
                <article key={quote.id} className="rounded-3xl border-2 border-charcoal/10 bg-white p-5 shadow-[4px_4px_0px_0px_rgba(58,50,43,0.12)] sm:p-7">
                  <div className="flex flex-col justify-between gap-4 border-b border-charcoal/10 pb-5 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-display text-2xl font-black">{quote.productType}</h2>
                        <span className="rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-charcoal">{quote.status}</span>
                      </div>
                      <p className="mt-2 text-xs font-bold uppercase tracking-wider text-charcoal/45">Request #{quote.id} · {formatDate(quote.createdAt)}</p>
                    </div>
                    <p className="rounded-xl bg-cream px-4 py-2 text-sm font-black">Quantity: {quote.quantity}</p>
                  </div>
                  <div className="grid gap-5 pt-5 md:grid-cols-[.8fr_1.2fr]">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                      <div className="col-span-2"><dt className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Contact</dt><dd className="mt-1 font-bold">{quote.name}</dd></div>
                      <div><dt className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Email</dt><dd className="mt-1 break-words"><a href={`mailto:${encodeURIComponent(quote.email || '')}`} className="font-bold text-charcoal underline decoration-orange/50 underline-offset-2">{quote.email}</a></dd></div>
                      <div><dt className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Phone</dt><dd className="mt-1"><a href={`tel:${encodeURIComponent(quote.phone || '')}`} className="font-bold text-charcoal underline decoration-orange/50 underline-offset-2">{quote.phone}</a></dd></div>
                      {quote.company && <div className="col-span-2"><dt className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Company</dt><dd className="mt-1 font-bold">{quote.company}</dd></div>}
                      {quote.requiredDeliveryDate && <div className="col-span-2"><dt className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Requested delivery</dt><dd className="mt-1 font-bold">{quote.requiredDeliveryDate}</dd></div>}
                      {quote.materialPreference && <div className="col-span-2"><dt className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Material preference</dt><dd className="mt-1 font-bold">{quote.materialPreference}</dd></div>}
                      {quote.processPreference && <div className="col-span-2"><dt className="text-[10px] font-black uppercase tracking-widest text-charcoal/40">Process preference</dt><dd className="mt-1 font-bold">{quote.processPreference}</dd></div>}
                    </dl>
                    <div className="rounded-2xl bg-cream p-5">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-charcoal/45">Project details</h3>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-charcoal/80">{quote.message}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </AdminLayout>
    </>
  );
}
