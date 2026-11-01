import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { siteUrl } from '../components/Seo';

export async function getServerSideProps() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
  let products = [];
  try {
    const response = await axios.get(`${backendUrl}/api/products`);
    products = response.data || [];
  } catch (error) {
    console.error('HTML sitemap product fetch failed:', error.message);
  }
  return { props: { products } };
}

export default function Sitemap({ products }) {
  return (
    <>
      <Head>
        <title>Site Map | WOODYZ</title>
        <meta name="description" content="Browse the public WOODYZ site map, product collection, and policies." />
        <link rel="canonical" href={`${siteUrl}/sitemap`} />
        <meta property="og:title" content="Site Map | WOODYZ" />
        <meta property="og:description" content="Public WOODYZ pages and product links." />
        <meta property="og:url" content={`${siteUrl}/sitemap`} />
      </Head>
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-5xl font-black text-3d mb-10">WOODYZ Site Map</h1>
          <div className="grid md:grid-cols-2 gap-8">
            <section className="bg-white border-4 border-charcoal rounded-3xl p-8">
              <h2 className="font-display text-2xl font-black mb-5">Important pages</h2>
              <ul className="space-y-3 font-bold"><li><Link href="/" className="text-cedar underline">Home</Link></li><li><Link href="/products" className="text-cedar underline">Products</Link></li><li><Link href="/ai" className="text-cedar underline">Public brand information</Link></li><li><Link href="/privacy-policy" className="text-cedar underline">Privacy policy</Link></li><li><Link href="/terms-and-conditions" className="text-cedar underline">Terms and conditions</Link></li></ul>
            </section>
            <section className="bg-white border-4 border-charcoal rounded-3xl p-8">
              <h2 className="font-display text-2xl font-black mb-5">Products</h2>
              <ul className="space-y-3 font-bold">{products.map((product) => <li key={product.id}><Link href={`/products/${product.id}`} className="text-cedar underline">{product.name}</Link></li>)}</ul>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
