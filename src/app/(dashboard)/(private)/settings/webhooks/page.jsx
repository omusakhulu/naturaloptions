import { WebhookManager } from '@/components/webhooks/WebhookManager'
import { Metadata } from 'next'

export const metadata = {
  title: 'Webhook Settings',
  description: 'Manage WooCommerce webhooks',
}

export default function WebhooksPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Webhook Settings</h1>
        <p className="text-muted-foreground">
          Configure webhooks to receive real-time updates from your WooCommerce store
        </p>
      </div>
      
      <WebhookManager />
    </div>
  )
}
