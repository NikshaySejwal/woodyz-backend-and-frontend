import axios from 'axios';
import { siteUrl } from '../components/Seo';

export async function getServerSideProps({ res }) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
  let products = [];

  try {
    const response = await axios.get(`${backendUrl}/api/products`);
    products = response.data || [];
  } catch (error) {
    console.error('Sitemap product fetch failed:', error.message);
  }

  const urls = ['/', '/products', '/privacy-policy', '/terms-and-conditions', '/sitemap', '/ai', '/manufacturing'];
  products.forEach((product) => urls.push(`/products/${product.id}`));
  const body = urls.map((path) => `<url><loc>${siteUrl}${path}</loc></url>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function SitemapXml() {
  return null;
}
