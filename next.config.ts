import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  // skipWaiting: true, // Removed - not supported by this PWA plugin version
});

const nextConfig: NextConfig = {
  /* config options here */
  // ✅ Production-ready: Enforce TypeScript and ESLint checks
  typescript: {
    ignoreBuildErrors: false, // Changed from true - critical for production safety
  },
  eslint: {
    ignoreDuringBuilds: false, // Changed from true - catch linting issues before deployment
  },
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
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
