import { Suspense } from 'react'

import EventTentQuoteForm from './EventTentQuoteForm'

export default function EventTentQuotePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventTentQuoteForm />
    </Suspense>
  )
}
