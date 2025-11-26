import { useState } from 'react'

export default function AsyncProductAutocomplete({ value, onSelect }) {
  const [options, setOptions] = useState([])
  const [query, setQuery] = useState(value || '')
  const [loading, setLoading] = useState(false)

  const fetchOptions = async (q) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/search?query=${encodeURIComponent(q)}`)
      const data = await res.json()
      setOptions(data.products || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full">
      <input
        value={query}
        onChange={e => {
          const q = e.target.value
          setQuery(q)
          if (q.length >= 2) fetchOptions(q)
          else setOptions([])
        }}
        placeholder="Search products for stock adjustment"
        className="border rounded p-2 flex-1 w-full"
        autoComplete="off"
      />
      {loading && <div className="absolute right-2 top-2 text-xs text-gray-400">Loading…</div>}
      {options.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 bg-white border rounded shadow mt-1 max-h-56 overflow-auto">
          {options.map(opt => (
            <li
              key={opt.id}
              className="px-3 py-2 hover:bg-indigo-50 cursor-pointer"
              onClick={() => {
                onSelect(opt)
                setQuery('')
                setOptions([])
              }}
            >
              {opt.name} {opt.sku ? <span className="text-xs text-gray-400">({opt.sku})</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
