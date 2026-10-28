// Acesso por uma única password partilhada (SITE_PASSWORD). O cookie guarda
// um HMAC derivado da password, nunca a password em si; mudar a password no
// Vercel invalida todos os acessos já guardados nos telemóveis.

export const AUTH_COOKIE = 'obras_auth'
export const AUTH_MAX_AGE = 60 * 60 * 24 * 180 // 180 dias

const encoder = new TextEncoder()

export async function authToken(password: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode('obras-ativas-v1'))
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Comparação em tempo constante, para não revelar quantos caracteres batem.
export function safeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a)
  const bb = encoder.encode(b)
  let diff = ab.length ^ bb.length
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0)
  return diff === 0
}

export async function isValidToken(token: string | undefined): Promise<boolean> {
  const password = process.env.SITE_PASSWORD
  if (!password || !token) return false
  return safeEqual(token, await authToken(password))
}
