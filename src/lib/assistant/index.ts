/**
 * Lumina assistant public API.
 *
 * getAssistantReply() is the single LLM-swap seam:
 *   - NOW: rule-based via classifyIntent + KNOWLEDGE_BASE
 *   - LATER: replace body with a call to claude-haiku-4-5 (or similar)
 *     using the Anthropic SDK, passing `message` + optional `context`
 *     as the user turn, and the knowledge base as a system prompt.
 *
 * Recommended small LLM for future swap: claude-haiku-4-5-20251001
 *   — fast, cheap, instruction-following, fits in a mobile on-device context
 *     or a thin backend proxy (single /chat endpoint, no streaming needed).
 */

import { classifyIntent } from './intentEngine';
import { KNOWLEDGE_BASE, type Intent } from './knowledgeBase';

export type { Intent };

export interface AssistantContext {
  /** Optional conversation history for multi-turn LLM support later */
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AssistantReply {
  text: string;
  followUps: string[];
  intent: Intent;
}

export async function getAssistantReply(
  message: string,
  _context?: AssistantContext,
): Promise<AssistantReply> {
  // ── Rule-based path (current) ──────────────────────────────────────────────
  const intent = classifyIntent(message);
  const entry = KNOWLEDGE_BASE[intent];
  return {
    text: entry.answer,
    followUps: entry.followUps,
    intent,
  };

  // ── LLM path (future, uncomment + fill creds) ──────────────────────────────
  // import Anthropic from '@anthropic-ai/sdk';
  // const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const msg = await client.messages.create({
  //   model: 'claude-haiku-4-5-20251001',
  //   max_tokens: 300,
  //   system: buildSystemPrompt(KNOWLEDGE_BASE),
  //   messages: [
  //     ...(_context?.history ?? []),
  //     { role: 'user', content: message },
  //   ],
  // });
  // const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  // return { text, followUps: [], intent: 'FALLBACK' };
}
