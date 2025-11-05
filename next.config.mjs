import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define the module path
const wooRentalBridgePath = path.resolve(__dirname, 'woo-rental-bridge/dist/WooRentalBridge.js')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude disabled files from build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].map(ext => {
    return ext
  }),
  // Ignore patterns for build
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: false
  },
  experimental: {
    turbo: {
      resolveAlias: {
        '@': path.resolve(__dirname, 'src'),
        '@views': path.resolve(__dirname, 'src/views'),
        '@core': path.resolve(__dirname, 'src/@core'),
        '@configs': path.resolve(__dirname, 'src/configs'),
        '@layouts': path.resolve(__dirname, 'src/@layouts'),
        '@store': path.resolve(__dirname, 'src/redux-store'),
        '@menu': path.resolve(__dirname, 'src/@menu'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@components': path.resolve(__dirname, 'src/components'),
        'woorental-bridge': wooRentalBridgePath
      }
    }
  },
  basePath: process.env.BASEPATH,
  webpack: (config, { isServer }) => {
    // Add path aliases - webpack doesn't support wildcard aliases, so we use direct paths
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@views': path.resolve(__dirname, 'src/views'),
      '@core': path.resolve(__dirname, 'src/@core'),
      '@configs': path.resolve(__dirname, 'src/configs'),
      '@layouts': path.resolve(__dirname, 'src/@layouts'),
      '@store': path.resolve(__dirname, 'src/redux-store'),
      '@menu': path.resolve(__dirname, 'src/@menu'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@components': path.resolve(__dirname, 'src/components'),
      'woorental-bridge': wooRentalBridgePath
    }
    
    // Add support for .js files
    config.resolve.extensions.push('.js')
    
    // Add node modules that should be polyfilled
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false
    }
    
    return config
  },
  // DISABLED: These redirects were bypassing middleware authentication
  // The middleware now handles all routing and authentication
  redirects: async () => {
    return [
      // Only keep the lang redirect, middleware handles the rest
      {
        source: '/((?!(?:en|fr|ar|front-pages|favicon.ico|api|_next)\\b)):path',
        destination: '/en/:path',
        permanent: false,  // Changed to false to allow middleware to work
        locale: false
      }
    ]
  }
}

export default nextConfig
