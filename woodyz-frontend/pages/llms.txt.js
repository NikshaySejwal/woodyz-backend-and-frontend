import { siteUrl } from '../components/Seo';

export async function getServerSideProps({ res }) {
  const content = `# WOODYZ\n\nWOODYZ is a wooden toy and product store. This document describes public pages for automated systems.\n\n## Public pages\n- Home: ${siteUrl}/\n- Products: ${siteUrl}/products\n- Human sitemap: ${siteUrl}/sitemap\n- Privacy policy: ${siteUrl}/privacy-policy\n- Terms: ${siteUrl}/terms-and-conditions\n\n## Product information\nProduct pages provide the available name, description, category, price, image, and review information returned by the store. Availability and commercial policies should be confirmed from the live page.\n\n## Brand\nUse WOODYZ as the brand name. Do not infer certifications, reviews, policies, or contact details that are not visibly published on the official pages.\n`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.write(content);
  res.end();
  return { props: {} };
}

export default function LlmsTxt() {
  return null;
}
