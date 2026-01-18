// Next Imports
export const revalidate = 0
export const dynamic = 'force-dynamic'
import nextDynamic from 'next/dynamic'

// MUI Imports
import { redirect } from 'next/navigation'

import Grid from '@mui/material/Grid'

// Component Imports
import UserLeftOverview from '@views/apps/user/view/user-left-overview'
import UserRight from '@views/apps/user/view/user-right'

// Data Imports
import { getCustomerByWooId } from '@/lib/db/customers'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'
import { getOrdersByCustomerId } from '@/lib/db/orders'
import { prisma } from '@/lib/prisma'

const OverViewTab = nextDynamic(() => import('@views/apps/user/view/user-right/overview'))
const SecurityTab = nextDynamic(() => import('@views/apps/user/view/user-right/security'))
const NotificationsTab = nextDynamic(() => import('@views/apps/user/view/user-right/notifications'))
const ConnectionsTab = nextDynamic(() => import('@views/apps/user/view/user-right/connections'))

// Vars
const tabContentList = data => ({
  overview: <OverViewTab userData={data} />,
  security: <SecurityTab userData={data} />,
  notifications: <NotificationsTab />,
  connections: <ConnectionsTab />
})

const UserViewTab = async props => {
  const params = await props.params
  const idParam = params?.id

  if (!idParam) {
    redirect('/not-found')
  }

  // If this is a Prisma user id (string), load from Prisma
  const isNumericId = /^\d+$/.test(String(idParam))

  if (!isNumericId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: String(idParam) },
      select: { id: true, name: true, email: true, role: true, active: true, image: true, createdAt: true }
    })

    if (!dbUser) {
      redirect('/not-found')
    }

    const fullName = dbUser.name || dbUser.email?.split('@')[0] || 'User'
    const nameParts = fullName.split(' ').filter(Boolean)
    const firstName = nameParts[0] || 'User'
    const lastName = nameParts.slice(1).join(' ')

    const transformedUser = {
      id: dbUser.id,
      firstName,
      lastName,
      fullName,
      email: dbUser.email || '',
      billingEmail: dbUser.email || '',
      username: dbUser.email?.split('@')[0] || '',
      role: dbUser.role,
      status: dbUser.active ? 'active' : 'inactive',
      avatar: dbUser.image || '',
      phone: '',
      company: '',
      country: '',
      state: '',
      address: '',
      zipCode: '',
      billingAddress: {},
      shippingAddress: {},
      boothNumber: '',
      ordersCount: 0,
      createdAt: dbUser.createdAt
    }

    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, lg: 4, md: 5 }}>
          <UserLeftOverview userData={transformedUser} />
        </Grid>
        <Grid size={{ xs: 12, lg: 8, md: 7 }}>
          <UserRight tabContentList={tabContentList(transformedUser)} userData={transformedUser} />
        </Grid>
      </Grid>
    )
  }

  const userId = parseInt(String(idParam))

  // Try WooCommerce live customer first
  let transformedUser

  try {
    const woo = WooCommerceService.getInstance()
    const cust = await woo.executeApiRequest(`/wp-json/wc/v3/customers/${userId}`, 'GET')

    const b = cust?.billing || {}
    const s = cust?.shipping || {}
    const firstName = cust.first_name || b.first_name || s.first_name || ''
    const lastName = cust.last_name || b.last_name || s.last_name || ''
    const email = cust.email || b.email || ''
    const username = cust.username || email || `${firstName}${lastName}` || ''
    const avatar = typeof cust.avatar_url === 'string' && cust.avatar_url.length > 0 ? cust.avatar_url : ''

    transformedUser = {
      id: cust.id,
      wooId: cust.id,
      firstName,
      lastName,
      email,
      username,
      role: 'customer',
      status: 'active',
      avatar,
      phone: b.phone || '',
      company: b.company || '',
      country: b.country || s.country || '',
      state: b.state || s.state || '',
      address: [b.address_1, b.address_2, b.city, b.state, b.postcode, b.country].filter(Boolean).join(', '),
      zipCode: b.postcode || '',
      billingAddress: b,
      shippingAddress: s,
      createdAt: cust.date_created ? new Date(cust.date_created) : null
    }

    // Enrich from the most recent order billing/shipping data when available
    {
      try {
        const orders = await woo.executeApiRequest(
          `/wp-json/wc/v3/orders?customer=${encodeURIComponent(cust.id)}&per_page=1&orderby=date&order=desc`,
          'GET'
        )

        const last = Array.isArray(orders) && orders.length > 0 ? orders[0] : null
        const ob = last?.billing || {}
        const os = last?.shipping || {}

        transformedUser.phone = ob.phone || transformedUser.phone || ''
        transformedUser.company = ob.company || transformedUser.company || ''
        transformedUser.country = ob.country || os.country || transformedUser.country || ''
        transformedUser.state = ob.state || os.state || transformedUser.state || ''
        transformedUser.address =
          [ob.address_1, ob.address_2, ob.city, ob.state, ob.postcode, ob.country].filter(Boolean).join(', ') ||
          transformedUser.address ||
          ''
        transformedUser.zipCode = ob.postcode || transformedUser.zipCode || ''
        transformedUser.billingAddress = Object.keys(ob).length ? ob : transformedUser.billingAddress
        transformedUser.shippingAddress = Object.keys(os).length ? os : transformedUser.shippingAddress
      } catch {}

      // As a final pass, if we have an order number but no booth, try fetching by order number
      try {
        if (!transformedUser.boothNumber && transformedUser.latestOrderNumber) {
          const ord = await prisma.order.findFirst({
            where: { orderNumber: String(transformedUser.latestOrderNumber) }
          })

          if (ord) {
            const ob = (() => {
              try {
                return ord.billingAddress ? JSON.parse(ord.billingAddress) : {}
              } catch {
                return {}
              }
            })()

            const os = (() => {
              try {
                return ord.shippingAddress ? JSON.parse(ord.shippingAddress) : {}
              } catch {
                return {}
              }
            })()

            const booth =
              ob.boothNumber ||
              ob.booth_number ||
              ob.booth ||
              os.boothNumber ||
              os.booth_number ||
              os.booth ||
              (() => {
                try {
                  for (const [k, v] of Object.entries(ob)) {
                    const key = String(k).toLowerCase().replace(/\s|-/g, '')

                    if (key.includes('booth') || key.includes('stand')) return typeof v === 'string' ? v : String(v)
                  }

                  for (const [k, v] of Object.entries(os)) {
                    const key = String(k).toLowerCase().replace(/\s|-/g, '')

                    if (key.includes('booth') || key.includes('stand')) return typeof v === 'string' ? v : String(v)
                  }
                } catch {}

                return ''
              })()

            if (booth) transformedUser.boothNumber = booth
          }
        }
      } catch {}
    }
  } catch (e) {
    // If Woo by ID failed, try DB to get email then Woo by email
    const dbUser = await getCustomerByWooId(userId)

    if (!dbUser) {
      redirect('/not-found')
    }

    try {
      const woo = WooCommerceService.getInstance()

      const email = (() => {
        try {
          return dbUser.email || (dbUser.billingAddress ? JSON.parse(dbUser.billingAddress).email : '') || ''
        } catch {
          return ''
        }
      })()

      if (email) {
        const found = await woo.executeApiRequest(`/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}`, 'GET')
        const cust = Array.isArray(found) && found.length ? found[0] : null

        if (cust) {
          const b = cust?.billing || {}
          const s = cust?.shipping || {}
          const firstName = cust.first_name || b.first_name || s.first_name || ''
          const lastName = cust.last_name || b.last_name || s.last_name || ''
          const username = cust.username || email || `${firstName}${lastName}` || ''
          const avatar = typeof cust.avatar_url === 'string' && cust.avatar_url.length > 0 ? cust.avatar_url : ''

          transformedUser = {
            id: cust.id,
            wooId: cust.id,
            firstName,
            lastName,
            email,
            username,
            role: 'customer',
            status: 'active',
            avatar,
            phone: b.phone || '',
            company: b.company || '',
            country: b.country || s.country || '',
            state: b.state || s.state || '',
            address: [b.address_1, b.address_2, b.city, b.state, b.postcode, b.country].filter(Boolean).join(', '),
            zipCode: b.postcode || '',
            billingAddress: b,
            shippingAddress: s,
            createdAt: cust.date_created ? new Date(cust.date_created) : null
          }

          // Enrich from most recent order when available
          {
            try {
              const orders = await woo.executeApiRequest(
                `/wp-json/wc/v3/orders?customer=${encodeURIComponent(cust.id)}&per_page=1&orderby=date&order=desc`,
                'GET'
              )

              const last = Array.isArray(orders) && orders.length > 0 ? orders[0] : null
              const ob = last?.billing || {}
              const os = last?.shipping || {}

              transformedUser.phone = ob.phone || transformedUser.phone || ''
              transformedUser.company = ob.company || transformedUser.company || ''
              transformedUser.country = ob.country || os.country || transformedUser.country || ''
              transformedUser.state = ob.state || os.state || transformedUser.state || ''
              transformedUser.address =
                [ob.address_1, ob.address_2, ob.city, ob.state, ob.postcode, ob.country].filter(Boolean).join(', ') ||
                transformedUser.address ||
                ''
              transformedUser.zipCode = ob.postcode || transformedUser.zipCode || ''
              transformedUser.billingAddress = Object.keys(ob).length ? ob : transformedUser.billingAddress
              transformedUser.shippingAddress = Object.keys(os).length ? os : transformedUser.shippingAddress
            } catch {}
          }
        }
      }
    } catch {}

    if (!transformedUser) {
      // Pure DB fallback
      const b = (() => {
        try {
          return dbUser.billingAddress ? JSON.parse(dbUser.billingAddress) : {}
        } catch {
          return {}
        }
      })()

      const s = (() => {
        try {
          return dbUser.shippingAddress ? JSON.parse(dbUser.shippingAddress) : {}
        } catch {
          return {}
        }
      })()

      const firstName = dbUser.firstName || b.first_name || s.first_name || ''
      const lastName = dbUser.lastName || b.last_name || s.last_name || ''
      const email = dbUser.email || b.email || ''
      const username = dbUser.username || email || `${firstName}${lastName}` || ''
      const phone = dbUser.phone || b.phone || ''
      const company = dbUser.company || b.company || ''
      const country = dbUser.country || b.country || s.country || ''
      const state = dbUser.state || b.state || s.state || ''
      const zipCode = dbUser.zipCode || b.postcode || ''

      const address =
        dbUser.address || [b.address_1, b.address_2, b.city, b.state, b.postcode, b.country].filter(Boolean).join(', ')

      transformedUser = {
        id: dbUser.wooId,
        wooId: dbUser.wooId,
        firstName,
        lastName,
        email,
        username,
        role: dbUser.role || 'customer',
        status: 'active',
        avatar: dbUser.avatarUrl || '',
        phone,
        company,
        country,
        state,
        address,
        zipCode,
        billingAddress: b,
        shippingAddress: s,
        createdAt: dbUser.createdAt
      }
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 4, md: 5 }}>
        <UserLeftOverview userData={transformedUser} />
      </Grid>
      <Grid size={{ xs: 12, lg: 8, md: 7 }}>
        <UserRight tabContentList={tabContentList(transformedUser)} userData={transformedUser} />
      </Grid>
    </Grid>
  )
}

export default UserViewTab
