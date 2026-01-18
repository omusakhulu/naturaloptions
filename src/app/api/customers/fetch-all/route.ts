import { NextRequest, NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

import { saveCustomers } from '@/lib/db/customers'

export async function POST(request: NextRequest) {
  try {
    const wooService = WooCommerceService.getInstance()

    const WP_BASE_URL = process.env.WP_BASE_URL || process.env.WORDPRESS_BASE_URL
    const WP_USERNAME = process.env.WP_USERNAME
    const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD

    // Fetch WordPress users to capture their roles (WooCommerce customers are WP users too)
    const wpUsers: any[] = []

    if (WP_BASE_URL && WP_USERNAME && WP_APP_PASSWORD) {
      const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64')
      let page = 1
      const perPage = 100

      while (true) {
        const url = `${WP_BASE_URL.replace(/\/$/, '')}/wp-json/wp/v2/users?per_page=${perPage}&page=${page}&context=edit`
        const res = await fetch(url, {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: 'application/json'
          }
        })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          console.warn('[customers/fetch-all] Failed to fetch WP users', { status: res.status, text })
          break
        }

        const batch = await res.json()

        if (!Array.isArray(batch) || batch.length === 0) break
        wpUsers.push(...batch)

        if (batch.length < perPage) break
        page++
      }
    }

    const wpRoleByEmail = new Map<string, string>()
    const wpRoleById = new Map<number, string>()

    for (const u of wpUsers) {
      const roles = Array.isArray(u?.roles) ? u.roles : []
      const primaryRole = roles.length ? String(roles[0]).toLowerCase() : ''
      const email = typeof u?.email === 'string' ? u.email.toLowerCase() : ''
      const id = typeof u?.id === 'number' ? u.id : NaN

      if (email && primaryRole) wpRoleByEmail.set(email, primaryRole)
      if (!Number.isNaN(id) && primaryRole) wpRoleById.set(id, primaryRole)
    }

    // Fetch all customers from WooCommerce with pagination
    const customers: any[] = []
    let page = 1
    const perPage = 100
    
    while (true) {
      const batch = await wooService.listCustomers({
        per_page: perPage,
        page: page
      })
      
      if (!batch || batch.length === 0) break
      
      customers.push(...batch)
      page++
      
      if (batch.length < perPage) break
    }

    // Merge WP role info into Woo customers
    const customersWithRoles = (customers || []).map(c => {
      const email = typeof c?.email === 'string' ? c.email.toLowerCase() : ''
      const id = typeof c?.id === 'number' ? c.id : NaN
      const roleFromWp = (email && wpRoleByEmail.get(email)) || (!Number.isNaN(id) && wpRoleById.get(id))

      return {
        ...c,
        role: roleFromWp || c?.role || 'customer'
      }
    })

    // Include WP users that are not returned by the Woo customers endpoint (admins, shop managers, etc.)
    const customerIds = new Set(customersWithRoles.map(c => c?.id).filter((v: any) => typeof v === 'number'))
    const wpUsersNotInCustomers = wpUsers
      .filter(u => typeof u?.id === 'number' && !customerIds.has(u.id))
      .map(u => {
        const roles = Array.isArray(u?.roles) ? u.roles : []
        const primaryRole = roles.length ? String(roles[0]).toLowerCase() : ''

        return {
          id: u.id,
          email: u.email || '',
          username: u.slug || u.name || u.email || '',
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          role: primaryRole || 'subscriber',
          avatar_url: u.avatar_urls?.['96'] || u.avatar_urls?.['48'] || u.avatar_urls?.['24'] || '',
          billing: {},
          shipping: {},
          date_created: undefined
        }
      })

    const toSave = [...customersWithRoles, ...wpUsersNotInCustomers]

    if (!toSave || toSave.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found in WooCommerce/WordPress',
        customersCreated: 0
      })
    }

    // Save customers to database
    const result = await saveCustomers(toSave)

    console.log(`✅ Fetched and saved ${toSave.length} users from WooCommerce/WordPress`)

    return NextResponse.json({
      success: true,
      message: `Fetched ${toSave.length} users from WooCommerce/WordPress and saved to database`,
      customersCreated: toSave.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching customers:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch customers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
