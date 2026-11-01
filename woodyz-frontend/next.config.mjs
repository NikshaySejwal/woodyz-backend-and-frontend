/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV === 'development';
const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').origin;

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''} https://js.stripe.com https://code.iconify.design; style-src 'self' 'unsafe-inline' https://api.fontshare.com; img-src 'self' data: https:; connect-src 'self' ${apiOrigin} https://api.stripe.com https://api.iconify.design; frame-src https://js.stripe.com https://hooks.stripe.com; font-src 'self' data: https://api.fontshare.com https://cdn.fontshare.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
};

export default nextConfig;
