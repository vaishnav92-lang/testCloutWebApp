/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable static optimization for all pages to avoid useSearchParams issues
  trailingSlash: false,
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  async redirects() {
    return [
      {
        source: '/dashboard/jobs',
        destination: '/jobs',
        permanent: true, // Use a 308 permanent redirect
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/jobs',
        destination: '/dashboard/jobs',
      },
    ];
  },
}

module.exports = nextConfig