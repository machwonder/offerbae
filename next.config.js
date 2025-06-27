
/** @type {import('next').NextConfig} */
const nextConfig = {
  // To enable Google Analytics and generate correct sitemap/metadata,
  // please add the following to your .env.local file:
  // NEXT_PUBLIC_GA_TRACKING_ID='G-XXXXXXXXXX'
  // NEXT_PUBLIC_SITE_URL='https://offerbae.com'
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.logo.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-review.cupshe.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

module.exports = nextConfig;
