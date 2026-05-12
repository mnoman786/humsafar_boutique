import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9010',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '162.217.248.75',
        port: '9010',
        pathname: '/media/**',
      },
    ],
  },
}

export default nextConfig
