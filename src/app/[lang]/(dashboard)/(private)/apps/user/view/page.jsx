import { redirect } from 'next/navigation'

import { getAllCustomers } from '@/lib/db/customers'

const UserViewPage = async props => {
  const params = await props.params
  const locale = params.lang || 'en'

  // Get first customer from database
  const customers = await getAllCustomers({ take: 1 })

  if (!customers || customers.length === 0) {
    redirect(`/${locale}/not-found`)
  }

  // Redirect to first customer's view page
  redirect(`/${locale}/apps/user/view/${customers[0].wooId}`)
}

export default UserViewPage
