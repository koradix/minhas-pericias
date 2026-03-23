import { EscavadorService } from '@/lib/services/escavador'
import type { RadarProvider } from '@/lib/services/radar-provider'

/**
 * Singleton radar provider.
 * To swap the API: change ONE line here — nothing else needs to change.
 */
export const radar: RadarProvider = new EscavadorService()
