'use client'

import { useEffect } from 'react'

export default function PrintableCard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add print styles
    const style = document.createElement('style')

    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-packing-slip,
        #printable-packing-slip * {
          visibility: visible;
        }
        #printable-packing-slip {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return <div id='printable-packing-slip'>{children}</div>
}
