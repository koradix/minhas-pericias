// ─── AI Provider Factory ──────────────────────────────────────────────────────
// Selects the active provider based on AI_PROVIDER env var.
// Default: 'stub' (no external API calls).
//
// Providers disponíveis:
//   AI_PROVIDER=stub       → sem chamadas externas (default)
//   AI_PROVIDER=anthropic  → Anthropic (claude-haiku-4-5) — requer ANTHROPIC_API_KEY
//   AI_PROVIDER=openai     → OpenAI (gpt-4o-mini) — requer OPENAI_API_KEY

import type { AIProvider } from './provider'
import { stubProvider } from './providers/stub'
import { openaiProvider } from './providers/openai'
import { anthropicProvider } from './providers/anthropic'

function createProvider(): AIProvider {
  const name = process.env.AI_PROVIDER ?? 'stub'

  switch (name) {
    case 'stub':
      return stubProvider

    case 'anthropic':
      return anthropicProvider

    case 'openai':
      return openaiProvider

    default:
      console.warn(`[AI] Unknown provider "${name}" — falling back to stub`)
      return stubProvider
  }
}

// Singleton — one instance per server process
export const ai: AIProvider = createProvider()

// Re-export types for convenience
export type { AIProvider } from './provider'
export type {
  ExtractProcessDataInput,
  ExtractProcessDataOutput,
  GenerateProcessSummaryInput,
  GenerateProcessSummaryOutput,
  CreatePericiaCardInput,
  CreatePericiaCardOutput,
  GenerateFeeProposalInput,
  GenerateFeeProposalOutput,
  GenerateReportDraftInput,
  GenerateReportDraftOutput,
} from './types'
