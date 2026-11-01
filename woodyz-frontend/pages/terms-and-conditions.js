import Head from 'next/head';
import Link from 'next/link';
import { siteUrl } from '../components/Seo';

const sections = [
  ['Website use', 'Use this website lawfully and do not interfere with its operation, attempt unauthorized access, or misuse another person’s account.'],
  ['Accounts', 'You are responsible for keeping account credentials private and for activity performed through your account. Contact the administrator promptly if you believe an account is compromised.'],
  ['Products and information', 'WOODYZ aims to describe products accurately. Product images, materials, availability, and specifications should be confirmed against the current product listing before purchase.'],
  ['Pricing and orders', 'Prices and availability are shown on the product listing. An order is subject to acceptance and availability. The administrator must configure any tax, cancellation, minimum-order, or order-confirmation rules before launch.'],
  ['Payments', 'Payment processing is provided by the payment service configured for the store. Payment-provider terms may also apply. Never send payment credentials through support forms or email.'],
  ['Shipping', 'Shipping destinations, delivery estimates, fees, and carriers are not configured in this deployment. The administrator must publish the applicable shipping terms before accepting orders.'],
  ['Returns and refunds', 'Returns, exchanges, refund timing, and eligible items are not configured in this deployment. The administrator must publish the official return and refund policy before launch.'],
  ['Intellectual property', 'WOODYZ site content, branding, product photography, and software may not be copied, modified, or redistributed except as permitted by law or written permission.'],
  ['Disclaimers and limits', 'The site is provided subject to applicable law. No business-specific warranty, availability guarantee, or liability limitation is stated here because those terms have not been configured. Obtain legal review before publication.'],
  ['Contact', 'Official legal contact details are not configured. Replace this placeholder with the authorized WOODYZ contact before launch.'],
];

export default function TermsAndConditions() {
  return (
    <>
      <Head>
        <title>Terms and Conditions | WOODYZ</title>
        <meta name="description" content="Review the website, account, product, order, payment, shipping, and return terms for WOODYZ." />
        <link rel="canonical" href={`${siteUrl}/terms-and-conditions`} />
        <meta property="og:title" content="Terms and Conditions | WOODYZ" />
        <meta property="og:description" content="Website and shopping terms for WOODYZ." />
        <meta property="og:url" content={`${siteUrl}/terms-and-conditions`} />
        <meta name="twitter:card" content="summary" />
      </Head>
      <section className="py-16 px-6">
        <article className="max-w-4xl mx-auto bg-white border-4 border-charcoal rounded-[40px] p-8 lg:p-12 shadow-[8px_8px_0px_0px_#3A322B]">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cedar mb-4">WOODYZ policies</p>
          <h1 className="font-display text-5xl font-black text-3d mb-6">Terms and Conditions</h1>
          <p className="font-bold text-charcoal/60 mb-10">These are baseline website terms with clearly marked configuration placeholders. The administrator should complete the commercial terms and obtain legal review before launch.</p>
          <div className="space-y-8">
            {sections.map(([title, text]) => (
              <section key={title}>
                <h2 className="font-display text-2xl font-black mb-3">{title}</h2>
                <p className="font-medium text-charcoal/75 leading-relaxed">{text}</p>
              </section>
            ))}
          </div>
          <Link href="/products" className="inline-flex mt-10 btn-pop bg-cedar text-white border-4 border-charcoal px-6 py-4 rounded-2xl font-black uppercase tracking-widest no-underline">Browse products</Link>
        </article>
      </section>
    </>
  );
}
