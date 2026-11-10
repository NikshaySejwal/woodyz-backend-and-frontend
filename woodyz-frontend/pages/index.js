import Hero from '../components/Hero';
import CategoryGrid from '../components/CategoryGrid';
import Bestsellers from '../components/Bestsellers';
import TrustSection from '../components/TrustSection';
import Newsletter from '../components/Newsletter';
import Seo, { siteUrl } from '../components/Seo';
import axios from 'axios';
import { getServerApiBaseUrl } from '../lib/api';

export default function Home({ products = [], catalogError }) {
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];

  return (
    <>
      <Seo
        title="WOODYZ | Wooden Toys & Products"
        description="Explore wooden toys and products from WOODYZ."
        path="/"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              { '@type': 'Organization', name: 'WOODYZ', url: `${siteUrl}/` },
              { '@type': 'WebSite', name: 'WOODYZ', url: `${siteUrl}/` },
            ],
          }),
        }}
      />
      <Hero />
      <CategoryGrid categories={categories} />
      <Bestsellers products={products} catalogError={catalogError} />
      <TrustSection />
      <Newsletter />
    </>
  );
}

export async function getServerSideProps() {
  const backendUrl = getServerApiBaseUrl();
  if (!backendUrl) {
    return { props: { products: [], catalogError: true } };
  }

  try {
    const response = await axios.get(`${backendUrl}/api/products`);
    return { props: { products: response.data || [], catalogError: false } };
  } catch (error) {
    console.error('Homepage product fetch failed:', error.message);
    return { props: { products: [], catalogError: true } };
  }
}
