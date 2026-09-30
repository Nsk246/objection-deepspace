/**
 * The two AI steps (worker-side only). Each returns structured JSON checked
 * by zod. Neither result is trusted: callers run code checks right after.
 * Calls go through the DeepSpace AI proxy and bill the app owner; no API key
 * lives in this app.
 */

import { generateText, Output } from 'ai'
import { createDeepSpaceAI, getDeepSpaceAIModel } from 'deepspace/worker'
import type { Env } from '../../worker'
import { config } from '../config'
import {
  extractorPrompt,
  extractorSystem,
  extractResultSchema,
  splitResultSchema,
  splitterPrompt,
  splitterSystem,
  type ExtractResult,
  type SplitResult,
} from './prompts'

function model(env: Env, modelId: string) {
  // Check against the SDK's live catalog instead of trusting a copied list.
  if (!getDeepSpaceAIModel(modelId)) throw new Error(`Model ${modelId} is not in the DeepSpace catalog. Update src/config.ts.`)
  return createDeepSpaceAI(env, 'anthropic')(modelId)
}

export async function splitIntoClaims(env: Env, message: string, audience: string): Promise<SplitResult> {
  const { output } = await generateText({
    model: model(env, config.models.splitter),
    system: splitterSystem,
    prompt: splitterPrompt(message, audience),
    output: Output.object({ schema: splitResultSchema }),
  })
  return output
}

export async function extractQuotes(
  env: Env,
  claim: string,
  audience: string,
  pageText: string,
  signal: AbortSignal,
): Promise<ExtractResult> {
  const { output } = await generateText({
    model: model(env, config.models.extractor),
    system: extractorSystem,
    prompt: extractorPrompt(claim, audience, pageText.slice(0, config.sources.maxPageChars)),
    output: Output.object({ schema: extractResultSchema }),
    abortSignal: signal,
  })
  return output
}
