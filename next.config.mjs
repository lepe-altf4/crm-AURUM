/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['jspdf'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

export default nextConfig
