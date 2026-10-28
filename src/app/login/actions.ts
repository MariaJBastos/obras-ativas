'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AUTH_COOKIE, AUTH_MAX_AGE, authToken, safeEqual } from '@/lib/auth'

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  const expected = process.env.SITE_PASSWORD
  if (!expected) return 'A password do site ainda não está configurada (SITE_PASSWORD).'

  const password = String(formData.get('password') ?? '')
  if (!safeEqual(password, expected)) return 'Password errada.'

  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE, await authToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_MAX_AGE,
  })
  redirect('/')
}
