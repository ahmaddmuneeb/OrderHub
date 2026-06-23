import 'server-only'

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export function errResponse(err: unknown) {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status })
  }
  console.error(err)
  return Response.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
}
