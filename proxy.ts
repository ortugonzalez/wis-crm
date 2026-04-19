import { NextRequest, NextResponse } from 'next/server'

function unauthorizedResponse() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="WIS CRM"',
    },
  })
}

export function proxy(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER
  const password = process.env.BASIC_AUTH_PASSWORD

  // If credentials are not configured, do not block access in local/dev by accident.
  if (!user || !password) {
    return NextResponse.next()
  }

  const authHeader = req.headers.get('authorization')

  if (!authHeader?.startsWith('Basic ')) {
    return unauthorizedResponse()
  }

  try {
    const encoded = authHeader.replace('Basic ', '')
    const decoded = atob(encoded)
    const [providedUser, providedPassword] = decoded.split(':')

    if (providedUser === user && providedPassword === password) {
      return NextResponse.next()
    }
  } catch {
    return unauthorizedResponse()
  }

  return unauthorizedResponse()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
