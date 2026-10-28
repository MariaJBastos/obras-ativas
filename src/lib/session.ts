import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AUTH_COOKIE, isValidToken } from './auth'

// Segunda verificação, dentro de cada página com dados: não depender só do
// proxy (já houve falhas no Next que permitiam contorná-lo).
export async function requireAuth(): Promise<void> {
  const cookieStore = await cookies()
  if (!(await isValidToken(cookieStore.get(AUTH_COOKIE)?.value))) redirect('/login')
}
