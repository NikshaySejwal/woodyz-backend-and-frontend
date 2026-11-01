import Head from 'next/head';
import Link from 'next/link';
import { siteUrl } from '../components/Seo';

const sections = [
  ['Information we collect', 'WOODYZ may collect information you provide when you create an account, place an order, contact support, submit a review, or subscribe to updates. This can include your name, email address, shipping details, account credentials, order details, and the content of your messages.'],
  ['Account and order information', 'Account and order information is used to provide the store, process orders, communicate about service requests, and support account features. Please do not submit payment card numbers or other sensitive financial information through a form.'],
  ['Payment processing', 'Payments are handled by the payment provider configured for the store. WOODYZ does not ask you to send full payment card details by email or through support forms. The provider may process payment information under its own privacy terms.'],
  ['Cookies and local storage', 'The site may use essential browser storage, such as a login token and cart data, to provide account and shopping functionality. Optional analytics or advertising cookies are not loaded unless they are configured and consented to.'],
  ['Analytics and third parties', 'This deployment does not load an analytics provider by default. The site uses service providers for hosting, payment processing, email, and APIs as configured by the administrator. Their processing is governed by their own terms and privacy notices.'],
  ['Contact forms and reviews', 'Information submitted through support, newsletter, or review forms is used to respond, provide the requested service, or display the submitted review where applicable. Do not include passwords, payment credentials, or unnecessary personal information.'],
  ['Retention and user rights', 'Information is retained only as long as needed for the purpose collected, account operation, order records, legal obligations, or dispute handling. Depending on applicable law, you may request access, correction, deletion, or restriction of your information.'],
  ['Contact information', 'Administrator contact details are not configured in this deployment. Replace this notice with the official WOODYZ privacy contact before launch.'],
];

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | WOODYZ</title>
        <meta name="description" content="Read how WOODYZ handles account, order, payment, cookie, and contact information." />
        <link rel="canonical" href={`${siteUrl}/privacy-policy`} />
        <meta property="og:title" content="Privacy Policy | WOODYZ" />
        <meta property="og:description" content="How WOODYZ handles personal information and essential site storage." />
        <meta property="og:url" content={`${siteUrl}/privacy-policy`} />
        <meta name="twitter:card" content="summary" />
      </Head>
      <section className="py-16 px-6">
        <article className="max-w-4xl mx-auto bg-white border-4 border-charcoal rounded-[40px] p-8 lg:p-12 shadow-[8px_8px_0px_0px_#3A322B]">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cedar mb-4">WOODYZ policies</p>
          <h1 className="font-display text-5xl font-black text-3d mb-6">Privacy Policy</h1>
          <p className="font-bold text-charcoal/60 mb-10">This policy is a practical overview for the current WOODYZ website. The administrator should replace configuration placeholders and obtain legal review before launch.</p>
          <div className="space-y-8">
            {sections.map(([title, text]) => (
              <section key={title}>
                <h2 className="font-display text-2xl font-black mb-3">{title}</h2>
                <p className="font-medium text-charcoal/75 leading-relaxed">{text}</p>
              </section>
            ))}
          </div>
          <Link href="/products" className="inline-flex mt-10 btn-pop bg-cedar text-white border-4 border-charcoal px-6 py-4 rounded-2xl font-black uppercase tracking-widest no-underline">Shop WOODYZ</Link>
        </article>
      </section>
    </>
  );
}
