// ─── AI Provider — Abstract Interface ────────────────────────────────────────
// Any concrete provider (stub, OpenAI, Anthropic, Gemini, etc.)
// must implement this interface.
// Swap providers by changing AI_PROVIDER env var — zero UI changes needed.

import type {
  ExtractProcessDataInput,   ExtractProcessDataOutput,
  GenerateProcessSummaryInput, GenerateProcessSummaryOutput,
  CreatePericiaCardInput,    CreatePericiaCardOutput,
  GenerateFeeProposalInput,  GenerateFeeProposalOutput,
  GenerateReportDraftInput,  GenerateReportDraftOutput,
} from './types'

export interface AIProvider {
  readonly name: string

  /**
   * Extract structured process data from raw document text.
   * Input: raw text or filename fallback.
   * Output: structured judicial process fields.
   */
  extractProcessData(
    input: ExtractProcessDataInput,
  ): Promise<ExtractProcessDataOutput>

  /**
   * Generate an executive summary for a judicial process.
   * Input: extracted process data + optional expert context.
   * Output: short summary, object of expertise, key points, field requirements.
   */
  generateProcessSummary(
    input: GenerateProcessSummaryInput,
  ): Promise<GenerateProcessSummaryOutput>

  /**
   * Create a perícia card (pre-populated Pericia record) from extracted data.
   * Input: extracted data + peritoId + intakeId.
   * Output: fields to populate the Pericia DB record.
   */
  createPericiaCardFromProcess(
    input: CreatePericiaCardInput,
  ): Promise<CreatePericiaCardOutput>

  /**
   * Draft a fee proposal (proposta de honorários) for the expert.
   * Input: extracted data + expert info + suggested value.
   * Output: four sections ready for the PropostaHonorarios form.
   */
  generateFeeProposalDraft(
    input: GenerateFeeProposalInput,
  ): Promise<GenerateFeeProposalOutput>

  /**
   * Draft a technical report (laudo pericial).
   * Input: extracted data + process summary + expert notes.
   * Output: five standard laudo sections.
   */
  generateReportDraft(
    input: GenerateReportDraftInput,
  ): Promise<GenerateReportDraftOutput>
}
