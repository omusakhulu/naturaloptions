export function createMockRequest(
  url: string,
  options?: {
    method?: string
    body?: any
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  }
) {
  const { method = 'GET', body, headers = {}, searchParams } = options || {}

  let fullUrl = `http://localhost:3000${url}`

  if (searchParams) {
    const params = new URLSearchParams(searchParams)

    fullUrl += `?${params.toString()}`
  }

  const request = new Request(fullUrl, {
    method,
    headers: new Headers({
      'content-type': 'application/json',
      ...headers
    }),
    ...(body ? { body: JSON.stringify(body) } : {})
  })

  return request
}
