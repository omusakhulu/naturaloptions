import dns from 'dns'
import http from 'http'
import https from 'https'
import axios, { AxiosInstance } from 'axios'

export function createAxiosClient(storeUrl: string, consumerKey: string, consumerSecret: string, timeout: number = 60000): AxiosInstance {
  const ipv4Lookup = (hostname: string, options: any, callback: any) => {
    dns.lookup(hostname, { family: 4, hints: dns.ADDRCONFIG }, (err: any, address: string, family: number) => {
      if (err) {
        return dns.lookup(hostname, options, callback)
      }
      callback(err, address, family)
    })
  }

  const httpAgent = new http.Agent({
    keepAlive: true,
    lookup: ipv4Lookup,
    family: 4
  } as any)

  const httpsAgent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: process.env.NODE_ENV === 'production',
    lookup: ipv4Lookup,
    family: 4
  } as any)

  return axios.create({
    baseURL: `${storeUrl.replace(/\/$/, '')}/wp-json/wc/v3`,
    timeout,
    httpAgent,
    httpsAgent,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'WooRentalBridge/1.0'
    },
    auth: {
      username: consumerKey,
      password: consumerSecret
    }
  })
}
