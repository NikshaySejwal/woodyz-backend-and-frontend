import Hero from '../components/Hero';
import CategoryGrid from '../components/CategoryGrid';
import Bestsellers from '../components/Bestsellers';
import TrustSection from '../components/TrustSection';
import Newsletter from '../components/Newsletter';
import Seo, { siteUrl } from '../components/Seo';

export default function Home() {
  return (
    <>
      <Seo
        title="WOODYZ | Eco-Friendly Wooden Toys & Products"
        description="Explore WOODYZ wooden toys and products made for curious minds, thoughtful play, and joyful homes."
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
      <CategoryGrid />
      <Bestsellers />
      <TrustSection />
      <Newsletter />
    </>
  );
}
