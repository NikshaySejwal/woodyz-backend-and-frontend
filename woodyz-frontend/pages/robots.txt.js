import { siteUrl } from '../components/Seo';

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.write(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /auth/\nDisallow: /cart\nDisallow: /checkout\nDisallow: /orders\nDisallow: /profile\nDisallow: /track/\nDisallow: /api/\nSitemap: ${siteUrl}/sitemap.xml\n`);
  res.end();
  return { props: {} };
}

export default function Robots() {
  return null;
}
