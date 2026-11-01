import Head from 'next/head';

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://woodyz.in').replace(/\/+$/, '');
const defaultImage = `${siteUrl}/favicon.ico`;

export default function Seo({
  title,
  description,
  path = '/',
  image = defaultImage,
  noindex = false,
}) {
  const canonical = `${siteUrl}${path}`;
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="WOODYZ" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  );
}
