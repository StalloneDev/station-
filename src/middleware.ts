import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Fichiers et chemins publics
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/static') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Redirection si déjà connecté vers login
  const sessionCookie = request.cookies.get('session')?.value
  const session = sessionCookie ? await decrypt(sessionCookie) : null

  if (path === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Vérifier auth
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Vérification des droits pour le manager
  if (session.role === 'manager') {
    if (path.startsWith('/analyse') || path.startsWith('/parametres')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}
