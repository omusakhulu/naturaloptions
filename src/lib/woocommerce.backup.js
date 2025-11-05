import { createHmac } from 'crypto';
import { URL } from 'url';

import axios from 'axios';

// Server-side only Node.js modules
let http, https, dns;
if (typeof window === 'undefined') {
  http = require('http');
  https = require('https');
  dns = require('dns');
  // Set default DNS lookup to prefer IPv4
  dns.setDefaultResultOrder('ipv4');
}

// Client configuration that works in both environments
const createClient = () => {
  const baseURL = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL || process.env.WOO_STORE_URL;
  const consumerKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!baseURL || !consumerKey || !consumerSecret) {
    console.error('Missing required WooCommerce environment variables');

    return axios.create({
      baseURL: `${baseURL}/wp-json/wc/v3`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      auth: {
        username: consumerKey,
        password: consumerSecret
      }
    });
  }

  return axios.create({
    baseURL: `${baseURL}/wp-json/wc/v3`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    auth: {
      username: consumerKey,
      password: consumerSecret
    }
  });
}

// Create axios instance with custom configuration
const createWooCommerceClient = () => {
  // Use browser-compatible client in the browser
  if (typeof window !== 'undefined') {
    return createBrowserClient();
  }

  // Server-side client with Node.js specific features
  const http = require('http')
  const https = require('https')
  const { lookup } = require('dns').promises
  const dns = require('dns')

  // Custom DNS lookup that prefers IPv4 (server-side only)
  const lookupWithIpv4 = (hostname, options, callback) => {
    if (typeof dns === 'undefined') {
      // In browser, use default behavior
      return require('dns').lookup(hostname, options, callback);
      }

      return dns.promises.lookup(hostname, { family: 4 })
    }
  }

  const baseURL = process.env.WOO_STORE_URL || process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET;

  if (!baseURL || !consumerKey || !consumerSecret) {
    console.error('Missing required WooCommerce environment variables');

    return axios.create({
      baseURL: `${baseURL}/wp-json/wc/v3`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      auth: {
        username: consumerKey,
        password: consumerSecret
      }
    });
  }

  const client = axios.create({
    baseURL: `${baseURL}/wp-json/wc/v3`,
    timeout: 30000, // 30 second timeout
    auth: {
      username: consumerKey,
      password: consumerSecret
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    // Custom DNS lookup (server-side only)
    lookup: lookupWithIPv4,

    // Keep connections alive
    httpAgent: new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 60000,
      maxSockets: 100,
      maxFreeSockets: 10,
      timeout: 60000
    }),
    httpsAgent: new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 60000,
      maxSockets: 100,
      maxFreeSockets: 10,
      timeout: 60000,
      rejectUnauthorized: process.env.NODE_ENV === 'production' // Only validate certs in production
    })
  });

  // Add request interceptor for logging
  client.interceptors.request.use(
    config => {
      console.log('WooCommerce API Request:', {
        method: config.method,
        url: config.url,
        params: config.params
      })

      return config
    },
    error => {
      console.error('WooCommerce API Request Error:', error)

      return Promise.reject(error)
    }
  )

  // Add response interceptor for error handling
  client.interceptors.response.use(
    response => {
      console.log('WooCommerce API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      })

      return response
    },
    error => {
      console.error('WooCommerce API Error:', {
        message: error.message,
        config: error.config,
        response: error.response?.data
      })

      return Promise.reject(error)
    }
  )

  return client;
}

const wooClient = createWooCommerceClient()

export const createWooCommerceProduct = async productData => {
  try {
    console.log('Creating WooCommerce product:', productData)
    const response = await wooClient.post('/products', productData)

    return { success: true, data: response.data }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message

    console.error('Error creating WooCommerce product:', {
      message: errorMessage,
      productData,
      error: error.response?.data || error
    })

    return {
      success: false,
      error: errorMessage || 'Failed to create product in WooCommerce',
      details: error.response?.data
    }
  }
}

export const updateWooCommerceProduct = async (productId, productData) => {
  try {
    console.log(`Updating WooCommerce product ${productId}:`, productData)
    const response = await wooClient.put(`/products/${productId}`, productData)

    return { success: true, data: response.data }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message

    console.error(`Error updating WooCommerce product ${productId}:`, {
      message: errorMessage,
      productData,
      error: error.response?.data || error
    })

    return {
      success: false,
      error: errorMessage || 'Failed to update product in WooCommerce',
      details: error.response?.data
    }
  }
}

/**
 * Register webhooks with WooCommerce
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const registerWebhooks = async () => {
  try {
    // Use ngrok URL if available, otherwise use localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-ngrok-url.ngrok.io'
    const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/webhooks/woocommerce`

    if (!webhookUrl.startsWith('http')) {
      throw new Error(`Invalid webhook URL: ${webhookUrl}. Must start with http:// or https://`)
    }

    console.log('Registering webhooks with URL:', webhookUrl)
    console.log('Using WooCommerce URL:', process.env.WOO_STORE_URL)
    const events = ['product.created', 'product.updated', 'product.deleted']

    // Get existing webhooks
    const { data: existingWebhooks } = await wooClient.get('webhooks')

    // Create webhooks for each event if they don't exist
    const results = [];

    for (const event of events) {
      try {
        const webhookExists =
          Array.isArray(existingWebhooks) &&
          existingWebhooks.some(webhook => webhook.topic === event && webhook.delivery_url === webhookUrl)

        if (!webhookExists) {
          const response = await wooClient.post('webhooks', {
            name: `Webhook - ${event}`,
            topic: event,
            delivery_url: webhookUrl,
            secret: process.env.WOOCOMMERCE_WEBHOOK_SECRET,
            status: 'active'
          })

          results.push(`Created webhook for ${event}`)
        } else {
          results.push(`Webhook for ${event} already exists`)
        }
      } catch (error) {
        console.error(`Error creating webhook for ${event}:`, error)
        results.push(`Error creating webhook for ${event}: ${error.message}`)
      }
    }

    return {
      success: true,
      message: 'Webhook registration completed',
      details: results
    };
  } catch (error) {
    console.error('Error registering webhooks:', error)

    return {
      success: false,
      message: error.message,
      details: results || []
    };
  }
}

export const getWooCommerceProduct = async productId => {
  try {
    console.log(`Fetching WooCommerce product ${productId}`)
    const response = await wooClient.get(`/products/${productId}`)

    return { success: true, data: response.data }
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, error: 'Product not found in WooCommerce', notFound: true }
    }

    const errorMessage = error.response?.data?.message || error.message

    console.error(`Error fetching WooCommerce product ${productId}:`, errorMessage)

    return {
      success: false,
      error: errorMessage || 'Failed to fetch product from WooCommerce',
      details: error.response?.data
    }
  }
}
