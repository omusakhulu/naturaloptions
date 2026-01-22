/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: false, // Disabled to prevent duplicate API calls
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during production builds
  },
  webpack: (config) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,

      // Core aliases
      '@': path.resolve(__dirname, 'src'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/lib': path.resolve(__dirname, 'src/lib'),

      // Component aliases
      '@components': path.resolve(__dirname, 'src/components'),

      // View aliases
      '@views': path.resolve(__dirname, 'src/views'),

      // Config aliases
      '@configs': path.resolve(__dirname, 'src/configs'),

      // Core functionality aliases - points to the @core directory
      '@core': path.resolve(__dirname, 'src/@core'),

      // Layout aliases - points to the @layouts directory
      '@layouts': path.resolve(__dirname, 'src/@layouts'),

      // Asset aliases
      '@assets': path.resolve(__dirname, 'src/assets'),

      // HOC aliases
      '@hocs': path.resolve(__dirname, 'src/hocs'),

      // Menu aliases - point to the @menu directory
      '@menu': path.resolve(__dirname, 'src/@menu'),
    };

    return config;
  }
};

module.exports = nextConfig;
