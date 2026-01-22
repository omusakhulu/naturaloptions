"use client"

import Link from 'next/link'

export default function ReportLayout({
  title,
  breadcrumbs = [],
  description,
  actions,
  filters,
  children
}) {
  return (
    <div className="p-6 space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs?.length ? (
        <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
          <ol className="list-reset inline-flex items-center gap-1">
            {breadcrumbs.map((bc, idx) => (
              <li key={idx} className="inline-flex items-center">
                {bc.href ? (
                  <Link href={bc.href} className="hover:underline text-gray-600">
                    {bc.label}
                  </Link>
                ) : (
                  <span className="text-gray-800">{bc.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && <span className="mx-2 text-gray-400">/</span>}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description ? (
            <p className="text-gray-600 text-sm mt-1">{description}</p>
          ) : null}
        </div>
        <div className="flex gap-2">{actions}</div>
      </div>

      {/* Filters */}
      {filters ? <div className="bg-white border rounded shadow p-4">{filters}</div> : null}

      {/* Content */}
      <div className="bg-white border rounded shadow p-4">{children}</div>
    </div>
  )
}
