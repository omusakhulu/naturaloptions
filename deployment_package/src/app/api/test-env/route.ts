import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    WOOCOMMERCE_STORE_URL: process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL || process.env.WOO_STORE_URL,
    WOOCOMMERCE_CONSUMER_KEY: process.env.WOOCOMMERCE_CONSUMER_KEY,
    WOOCOMMERCE_CONSUMER_SECRET: process.env.WOOCOMMERCE_CONSUMER_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  }

  return NextResponse.json(envVars)
}
