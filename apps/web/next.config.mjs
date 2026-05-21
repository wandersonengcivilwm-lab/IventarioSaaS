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
  webpack: (config, { isServer }) => {
    if (isServer) {
      // jsPDF só funciona no browser — previne erro de build no servidor
      config.resolve.alias = {
        ...config.resolve.alias,
        jspdf: false,
        'jspdf-autotable': false,
      }
    }
    return config
  },
}

export default nextConfig
