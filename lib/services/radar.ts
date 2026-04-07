import { EscavadorService } from '@/lib/services/escavador'
import type { RadarProvider } from '@/lib/services/radar-provider'

/**
 * Lazy singleton — o EscavadorService é instanciado apenas na primeira chamada,
 * não no module-load. Assim, a ausência de ESCAVADOR_API_TOKEN não quebra rotas
 * que importam este arquivo mas nunca chamam o radar (ex: signup, auth callbacks).
 */
let _instance: EscavadorService | null = null

function getInstance(): EscavadorService {
  if (!_instance) _instance = new EscavadorService()
  return _instance
}

export const radar: RadarProvider = new Proxy({} as RadarProvider, {
  get(_target, prop: string | symbol) {
    const instance = getInstance() as unknown as Record<string | symbol, unknown>
    const value = instance[prop]
    return typeof value === 'function' ? (value as Function).bind(instance) : value
  },
})
