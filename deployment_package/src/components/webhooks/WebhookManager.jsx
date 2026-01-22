'use client'

import { useState } from 'react'

// Simple toast notification function
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div')

  toast.style.position = 'fixed'
  toast.style.bottom = '20px'
  toast.style.right = '20px'
  toast.style.padding = '12px 24px'
  toast.style.borderRadius = '4px'
  toast.style.color = 'white'
  toast.style.backgroundColor = type === 'success' ? '#10B981' : '#EF4444'
  toast.style.zIndex = '1000'
  toast.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
  toast.textContent = message

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s'
    toast.style.opacity = '0'
    setTimeout(() => document.body.removeChild(toast), 500)
  }, 3000)
}

export function WebhookManager() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)

  const registerWebhooks = async () => {
    setIsLoading(true)
    setResults(null)

    try {
      const response = await fetch('/api/webhooks/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register webhooks')
      }

      setResults(data)

      showToast(data.message || 'Webhooks registered successfully', 'success')
    } catch (error) {
      console.error('Error registering webhooks:', error)
      showToast(error.message || 'Failed to register webhooks', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '8px'
          }}
        >
          Webhook Management
        </h2>
        <p
          style={{
            color: '#6B7280',
            marginBottom: '24px'
          }}
        >
          Register webhooks to receive real-time updates from WooCommerce
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #E5E7EB'
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '1.125rem',
              fontWeight: '500',
              marginBottom: '4px'
            }}
          >
            Webhook Status
          </h3>
          <p
            style={{
              color: '#6B7280',
              fontSize: '0.875rem'
            }}
          >
            {results ? 'Webhooks registered' : 'No webhooks registered yet'}
          </p>
        </div>
        <button
          onClick={registerWebhooks}
          disabled={isLoading}
          style={{
            backgroundColor: '#3B82F6',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500',
            opacity: isLoading ? '0.7' : '1',
            pointerEvents: isLoading ? 'none' : 'auto'
          }}
        >
          {isLoading ? 'Registering...' : 'Register Webhooks'}
        </button>
      </div>

      {results && (
        <div style={{ marginBottom: '24px' }}>
          <h4
            style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '8px'
            }}
          >
            Registration Results:
          </h4>
          <div
            style={{
              backgroundColor: '#F9FAFB',
              padding: '16px',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            {results.details?.map((result, index) => (
              <div key={index} style={{ padding: '4px 0' }}>
                {result.startsWith('Error') ? (
                  <span style={{ color: '#EF4444' }}>{result}</span>
                ) : (
                  <span style={{ color: '#10B981' }}>✓ {result}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4
          style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            marginBottom: '8px'
          }}
        >
          Webhook Endpoint URL:
        </h4>
        <code
          style={{
            backgroundColor: '#F9FAFB',
            padding: '8px 12px',
            borderRadius: '4px',
            display: 'block',
            overflowX: 'auto',
            fontSize: '0.875rem',
            marginBottom: '8px',
            fontFamily: 'monospace'
          }}
        >
          {typeof window !== 'undefined'
            ? `${window.location.origin}/api/webhooks/woocommerce`
            : 'https://christie-supersulfured-kent.ngrok-free.dev/api/webhooks/woocommerce'}
        </code>
        <p
          style={{
            color: '#6B7280',
            fontSize: '0.75rem',
            marginTop: '8px'
          }}
        >
          {/* Make sure this URL is accessible from the internet and added to your WooCommerce store's webhook settings. */}
        </p>
      </div>
    </div>
  )
}

export default WebhookManager
