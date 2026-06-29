import 'server-only'

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

function extractShopifyMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (typeof d.errors === 'string') return d.errors
  if (typeof d.error === 'string') return d.error
  if (Array.isArray(d.errors) && d.errors.length > 0) return String(d.errors[0])
  if (d.errors && typeof d.errors === 'object') {
    const first = Object.values(d.errors as Record<string, unknown>)[0]
    return Array.isArray(first) ? String(first[0]) : String(first)
  }
  return null
}

export function errResponse(err: unknown) {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status })
  }
  // Extract actual error message from Shopify / platform API (AxiosError)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axErr = err as any
  if (axErr?.isAxiosError) {
    const shopifyMsg = extractShopifyMessage(axErr.response?.data)
    const message = shopifyMsg ?? axErr.message ?? 'API error'
    console.error('[API Error]', axErr.response?.status, message)
    return Response.json({ error: message }, { status: 500 })
  }
  console.error(err)
  return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
}
