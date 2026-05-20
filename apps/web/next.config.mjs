/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@inventory-saas/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

export default nextConfig
