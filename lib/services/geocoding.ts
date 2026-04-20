/**
 * Geocoding via Nominatim (OpenStreetMap) — API pública gratuita.
 * Uso: converter endereço textual em lat/lng.
 *
 * Política de uso: 1 req/s, User-Agent obrigatório.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

export interface GeocodeResult {
  latitude: number
  longitude: number
  displayName: string
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'Perilab/1.0 (perilab.com.br)'

/**
 * Geocodifica um endereço.
 * Retorna null se não encontrar ou se houver timeout.
 * Nunca lança exceção — geocoding é best-effort.
 */
export async function geocodeAddress(
  endereco: string,
  opts: { timeoutMs?: number } = {},
): Promise<GeocodeResult | null> {
  const trimmed = endereco.trim()
  if (!trimmed) return null

  const params = new URLSearchParams({
    q: `${trimmed}, Brasil`,
    format: 'json',
    limit: '1',
    addressdetails: '0',
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 5000)

  try {
    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)

    if (!res.ok) return null

    const data = await res.json() as Array<{ lat: string; lon: string; display_name: string }>
    if (!Array.isArray(data) || data.length === 0) return null

    const first = data[0]
    const latitude = parseFloat(first.lat)
    const longitude = parseFloat(first.lon)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

    return { latitude, longitude, displayName: first.display_name }
  } catch {
    clearTimeout(timer)
    return null
  }
}
