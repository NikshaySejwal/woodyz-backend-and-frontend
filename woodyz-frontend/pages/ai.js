import Head from 'next/head';
import Link from 'next/link';
import { siteUrl } from '../components/Seo';

export default function AiInformation() {
  return (
    <>
      <Head>
        <title>About WOODYZ | Public Brand Information</title>
        <meta name="description" content="Authoritative public information about WOODYZ, its wooden product collection, and public policies." />
        <link rel="canonical" href={`${siteUrl}/ai`} />
        <meta property="og:title" content="About WOODYZ | Public Brand Information" />
        <meta property="og:description" content="Public brand and product information for WOODYZ." />
        <meta property="og:url" content={`${siteUrl}/ai`} />
        <meta name="twitter:card" content="summary" />
      </Head>
      <section className="py-16 px-6">
        <article className="max-w-4xl mx-auto bg-white border-4 border-charcoal rounded-[40px] p-8 lg:p-12 shadow-[8px_8px_0px_0px_#3A322B]">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cedar mb-4">Public brand information</p>
          <h1 className="font-display text-5xl font-black text-3d mb-6">WOODYZ</h1>
          <p className="text-xl font-bold text-charcoal/70 leading-relaxed mb-10">WOODYZ is an online store for wooden toys and related products. Product pages are the source of truth for current names, descriptions, prices, images, and available review information.</p>
          <div className="space-y-8">
            <section><h2 className="font-display text-2xl font-black mb-3">Product collection</h2><p className="font-medium text-charcoal/75 leading-relaxed">The public collection may include wooden blocks, puzzles, pull-along toys, train sets, and other products shown in the catalog. The live catalog determines current availability.</p></section>
            <section><h2 className="font-display text-2xl font-black mb-3">Useful public pages</h2><div className="flex flex-wrap gap-3"><Link href="/products" className="text-cedar font-black underline">Products</Link><Link href="/privacy-policy" className="text-cedar font-black underline">Privacy policy</Link><Link href="/terms-and-conditions" className="text-cedar font-black underline">Terms</Link><Link href="/sitemap" className="text-cedar font-black underline">Sitemap</Link></div></section>
          </div>
        </article>
      </section>
    </>
  );
}
