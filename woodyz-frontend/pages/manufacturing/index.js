import { useState } from 'react';
import Link from 'next/link';
import Seo from '../../components/Seo';
import api from '../../lib/api';
import {
  emptyManufacturingQuote,
  toManufacturingQuotePayload,
  validateManufacturingQuote,
} from '../../lib/manufacturingQuoteValidation.mjs';

const inputClass = 'mt-2 w-full rounded-xl border-2 border-charcoal/20 bg-white px-4 py-3 font-semibold text-charcoal outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20';
const products = ['Trophies & awards', 'Plaques', 'Shadow boxes', 'Signage', 'Corporate gifts', 'Wedding products', 'School awards', 'Promotional products', 'Branded merchandise', 'Other custom fabrication'];

function localDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function FieldError({ id, children }) {
  return children ? <p id={id} className="mt-1 text-sm font-semibold text-red-700">{children}</p> : null;
}

export default function ManufacturingPage() {
  const [values, setValues] = useState(emptyManufacturingQuote);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submission, setSubmission] = useState(null);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const validation = validateManufacturingQuote(values, localDateString());
    setValues(validation.clean);
    setErrors(validation.errors);
    setSubmitError('');
    if (Object.keys(validation.errors).length) {
      document.getElementById(Object.keys(validation.errors)[0])?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/api/manufacturing/quotes', toManufacturingQuotePayload(validation.clean));
      const { id, status, createdAt } = response.data || {};
      if (id == null || !status || !createdAt) {
        throw new Error('The server returned an incomplete submission receipt.');
      }
      setSubmission({ id, status, createdAt });
    } catch (error) {
      setSubmitError(error.response?.status === 400
        ? 'Please review the information and try again.'
        : 'We could not submit your request right now. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  function startAnotherRequest() {
    setValues(emptyManufacturingQuote());
    setErrors({});
    setSubmission(null);
    setSubmitError('');
  }

  return (
    <>
      <Seo
        title="Custom Manufacturing & Fabrication | WOODYZ"
        description="Custom CNC routing, laser cutting, UV printing, awards, signage, corporate gifts, prototyping, and bulk production by WOODYZ."
        path="/manufacturing"
      />
      <div className="min-h-screen bg-[#f4f1eb] text-[#252525]">
        <header className="border-b border-white/15 bg-[#222321] text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 sm:px-8">
            <Link href="/manufacturing" className="text-xl font-black tracking-tight text-white no-underline sm:text-2xl">
              WOODYZ <span className="ml-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-400">Manufacturing</span>
            </Link>
            <nav aria-label="Manufacturing navigation" className="flex items-center gap-4 sm:gap-8">
              <a href="#capabilities" className="hidden text-sm font-semibold text-white/75 no-underline hover:text-white sm:inline">Capabilities</a>
              <a href="#quote" className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-[#211f1c] no-underline transition hover:bg-amber-400">Get a Quote</a>
              <Link href="/" className="hidden text-sm font-semibold text-white/70 no-underline hover:text-white md:inline">WOODYZ Toys ↗</Link>
            </nav>
          </div>
        </header>

        <main>
          <section className="relative overflow-hidden bg-[#222321] text-white">
            <div className="absolute inset-y-0 right-0 hidden w-2/5 bg-[radial-gradient(ellipse_at_center,_rgba(201,115,37,0.25),_transparent_65%)] lg:block" aria-hidden="true" />
            <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
              <div>
                <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.28em] text-amber-400">Custom production · Bengaluru, India</p>
                <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight sm:text-7xl">Made to spec.<br /><span className="text-amber-400">Built to deliver.</span></h1>
                <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/70">From a first prototype to a production run, we turn your drawings and ideas into precise, branded products.</p>
                <a href="#quote" className="mt-9 inline-flex items-center gap-3 rounded-lg bg-amber-500 px-6 py-4 font-extrabold text-[#211f1c] no-underline transition hover:bg-amber-400">Tell us what you need <span aria-hidden="true">→</span></a>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  ['01', 'CNC routing'], ['02', 'Laser cutting & engraving'],
                  ['03', 'MDF & acrylic fabrication'], ['04', 'UV printing & branding'],
                ].map(([number, label]) => (
                  <div key={number} className="min-h-32 border border-white/15 bg-white/[0.04] p-5 sm:p-6">
                    <span className="text-xs font-bold text-amber-400">{number}</span>
                    <p className="mt-7 text-base font-bold sm:text-lg">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="capabilities" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="grid gap-8 border-b border-[#252525]/15 pb-12 md:grid-cols-[.7fr_1.3fr]">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-amber-700">What we make</p>
              <div>
                <h2 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Production support for ideas that need a real-world finish.</h2>
                <p className="mt-5 max-w-2xl leading-relaxed text-[#252525]/65">Awards, plaques, signage, shadow boxes, wedding pieces, corporate gifts, school awards, and branded merchandise. We support prototyping, small batches, and bulk orders.</p>
              </div>
            </div>
            <div className="grid gap-0 divide-y divide-[#252525]/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                ['01 / Scope', 'Share the product, finish, quantity, and timing you have in mind.'],
                ['02 / Review', 'Our team reviews the requirements and follows up to clarify details.'],
                ['03 / Quote', 'We prepare a production quote for your requested specification.'],
              ].map(([heading, body]) => (
                <article key={heading} className="py-6 sm:px-6 sm:py-8 first:sm:pl-0">
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-700">{heading}</p>
                  <p className="mt-3 leading-relaxed text-[#252525]/70">{body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="quote" className="bg-[#e7e2d9] px-5 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.72fr_1.28fr]">
              <div className="lg:sticky lg:top-10 lg:self-start">
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-amber-800">Start a project</p>
                <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Get a quote.</h2>
                <p className="mt-5 max-w-md leading-relaxed text-[#252525]/65">Give us a few details about your project. We’ll use them to understand the scope and prepare a useful response.</p>
                <p className="mt-8 border-l-2 border-amber-600 pl-4 text-sm leading-relaxed text-[#252525]/65">No payment or order is created by submitting this request.</p>
              </div>

              <div className="border border-[#252525]/10 bg-[#fbfaf7] p-5 shadow-[0_20px_60px_rgba(30,30,25,0.08)] sm:p-9">
                {submission ? (
                  <div role="status" aria-live="polite" className="py-8">
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-700">Request received</p>
                    <h3 className="mt-3 text-3xl font-black">Thank you.</h3>
                    <p className="mt-3 text-[#252525]/65">Your quote request has been submitted. Keep this reference for your records.</p>
                    <dl className="mt-8 grid gap-4 border-y border-[#252525]/15 py-6 sm:grid-cols-3">
                      <div><dt className="text-xs font-bold uppercase tracking-wider text-[#252525]/50">Request ID</dt><dd className="mt-1 font-extrabold">#{submission.id}</dd></div>
                      <div><dt className="text-xs font-bold uppercase tracking-wider text-[#252525]/50">Status</dt><dd className="mt-1 font-extrabold">{submission.status}</dd></div>
                      <div><dt className="text-xs font-bold uppercase tracking-wider text-[#252525]/50">Submitted</dt><dd className="mt-1 font-extrabold">{new Date(submission.createdAt).toLocaleString()}</dd></div>
                    </dl>
                    <button type="button" onClick={startAnotherRequest} className="mt-7 rounded-lg border-2 border-[#252525] px-5 py-3 font-extrabold transition hover:bg-[#252525] hover:text-white">Submit another request</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
                    <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="quote-name" className="text-sm font-bold">Your name <span aria-hidden="true" className="text-amber-700">*</span></label>
                        <input id="quote-name" name="name" autoComplete="name" maxLength={120} value={values.name} onChange={updateField} className={inputClass} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'quote-name-error' : undefined} />
                        <FieldError id="quote-name-error">{errors.name}</FieldError>
                      </div>
                      <div>
                        <label htmlFor="quote-email" className="text-sm font-bold">Email <span aria-hidden="true" className="text-amber-700">*</span></label>
                        <input id="quote-email" name="email" type="email" autoComplete="email" maxLength={254} value={values.email} onChange={updateField} className={inputClass} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'quote-email-error' : undefined} />
                        <FieldError id="quote-email-error">{errors.email}</FieldError>
                      </div>
                      <div>
                        <label htmlFor="quote-phone" className="text-sm font-bold">Phone <span aria-hidden="true" className="text-amber-700">*</span></label>
                        <input id="quote-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} value={values.phone} onChange={updateField} className={inputClass} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'quote-phone-error' : undefined} />
                        <FieldError id="quote-phone-error">{errors.phone}</FieldError>
                      </div>
                      <div>
                        <label htmlFor="quote-company" className="text-sm font-bold">Company <span className="font-medium text-[#252525]/45">(optional)</span></label>
                        <input id="quote-company" name="company" autoComplete="organization" maxLength={160} value={values.company} onChange={updateField} className={inputClass} aria-invalid={Boolean(errors.company)} aria-describedby={errors.company ? 'quote-company-error' : undefined} />
                        <FieldError id="quote-company-error">{errors.company}</FieldError>
                      </div>
                      <div>
                        <label htmlFor="quote-product" className="text-sm font-bold">Product type <span aria-hidden="true" className="text-amber-700">*</span></label>
                        <select id="quote-product" name="productType" value={values.productType} onChange={updateField} className={inputClass} aria-invalid={Boolean(errors.productType)} aria-describedby={errors.productType ? 'quote-product-error' : undefined}>
                          <option value="">Select a product</option>
                          {products.map((product) => <option key={product} value={product}>{product}</option>)}
                        </select>
                        <FieldError id="quote-product-error">{errors.productType}</FieldError>
                      </div>
                      <div>
                        <label htmlFor="quote-quantity" className="text-sm font-bold">Quantity <span aria-hidden="true" className="text-amber-700">*</span></label>
                        <input id="quote-quantity" name="quantity" type="number" min="1" max="1000000" step="1" inputMode="numeric" value={values.quantity} onChange={updateField} className={inputClass} aria-invalid={Boolean(errors.quantity)} aria-describedby={errors.quantity ? 'quote-quantity-error' : undefined} />
                        <FieldError id="quote-quantity-error">{errors.quantity}</FieldError>
                      </div>
                      <div>
                        <label htmlFor="quote-delivery" className="text-sm font-bold">Required delivery date <span className="font-medium text-[#252525]/45">(optional)</span></label>
                        <input id="quote-delivery" name="requiredDeliveryDate" type="date" min={localDateString()} value={values.requiredDeliveryDate} onChange={updateField} className={inputClass} aria-invalid={Boolean(errors.requiredDeliveryDate)} aria-describedby={errors.requiredDeliveryDate ? 'quote-delivery-error' : undefined} />
                        <FieldError id="quote-delivery-error">{errors.requiredDeliveryDate}</FieldError>
                      </div>
                      <div>
                        <label htmlFor="quote-material" className="text-sm font-bold">Material preference <span className="font-medium text-[#252525]/45">(optional)</span></label>
                        <input id="quote-material" name="materialPreference" maxLength={120} value={values.materialPreference} onChange={updateField} className={inputClass} aria-invalid={Boolean(errors.materialPreference)} aria-describedby={errors.materialPreference ? 'quote-material-error' : undefined} />
                        <FieldError id="quote-material-error">{errors.materialPreference}</FieldError>
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="quote-process" className="text-sm font-bold">Process preference <span className="font-medium text-[#252525]/45">(optional)</span></label>
                        <input id="quote-process" name="processPreference" maxLength={120} placeholder="For example: CNC routing, laser engraving, UV printing" value={values.processPreference} onChange={updateField} className={inputClass} aria-invalid={Boolean(errors.processPreference)} aria-describedby={errors.processPreference ? 'quote-process-error' : undefined} />
                        <FieldError id="quote-process-error">{errors.processPreference}</FieldError>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="flex items-end justify-between gap-4">
                          <label htmlFor="quote-message" className="text-sm font-bold">Project details <span aria-hidden="true" className="text-amber-700">*</span></label>
                          <span className="text-xs text-[#252525]/50">{values.message.trim().length}/5,000</span>
                        </div>
                        <textarea id="quote-message" name="message" rows={5} minLength={10} maxLength={5000} placeholder="Dimensions, finish, branding, use case, or anything else we should know…" value={values.message} onChange={updateField} className={inputClass} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'quote-message-error' : undefined} />
                        <FieldError id="quote-message-error">{errors.message}</FieldError>
                      </div>
                    </div>

                    {submitError && <p role="alert" className="mt-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{submitError}</p>}
                    {Object.keys(errors).length > 0 && <p role="alert" className="sr-only">Please correct the highlighted fields.</p>}
                    <div className="mt-7 flex flex-col gap-4 border-t border-[#252525]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs leading-relaxed text-[#252525]/55">Fields marked * are required. Your request is not an order.</p>
                      <button type="submit" disabled={submitting} className="inline-flex min-w-48 items-center justify-center gap-3 rounded-lg bg-[#222321] px-6 py-4 font-extrabold text-white transition hover:bg-amber-700 disabled:cursor-wait disabled:opacity-60">
                        {submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> Sending…</> : <>Send quote request <span aria-hidden="true">→</span></>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-[#222321] px-5 py-8 text-white sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm sm:flex-row sm:items-center">
            <p className="font-bold">WOODYZ Manufacturing <span className="font-normal text-white/55">· Custom production and fabrication</span></p>
            <Link href="/" className="font-semibold text-amber-400 no-underline hover:text-amber-300">Visit WOODYZ Toys ↗</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
