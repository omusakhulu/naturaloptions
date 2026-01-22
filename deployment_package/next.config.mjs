import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.production manually since next.config runs before Next.js loads env files
const envProductionPath = path.resolve(__dirname, '.env.production')
if (existsSync(envProductionPath) && !process.env.BASEPATH) {
  try {
    const envContent = readFileSync(envProductionPath, 'utf-8')
    const basePathMatch = envContent.match(/^BASEPATH=(.*)$/m)
    if (basePathMatch) {
      process.env.BASEPATH = basePathMatch[1].trim()
    }
  } catch (e) {
    // Ignore errors reading env file
  }
}

// Define the module path
const wooRentalBridgePath = path.resolve(__dirname, 'woo-rental-bridge/dist/WooRentalBridge.js')

const basePathSegment = (process.env.BASEPATH || '').replace(/^\/+/, '').replace(/\/+$/, '')

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
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Optimize images
  images: {
    minimumCacheTTL: 60,
    formats: ['image/webp']
  },
  // Performance optimizations
  swcMinify: true,
  productionBrowserSourceMaps: false,
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
    },
    // Enable optimizeCss for smaller CSS bundles
    optimizeCss: true
  },
  basePath: process.env.BASEPATH || '',
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
    // Disable locale redirect entirely - middleware handles all routing
    // This was causing /admin/en/... to redirect to /en/admin/en/...
    return []
  }
}

export default nextConfig
