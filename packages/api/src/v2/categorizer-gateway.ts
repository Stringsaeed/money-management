import { createGateway, experimental_evaluate, generateText, stepCountIs } from "ai";

import {
  categorizeNote,
  type CategorizerModels,
  type ResearchRequest,
  type TransactionCategorizer,
} from "./categorizer";

const JEV_MODEL = "typesafe-ai/jev";
const RESEARCH_MODEL = "anthropic/claude-haiku-4.5";
const MAX_CONTEXT_LENGTH = 600;
const UNKNOWN_REPLY = "UNKNOWN";

const RESEARCH_SYSTEM_PROMPT = `You help a personal finance app understand short transaction notes.
Given the note a person typed for a transaction, work out what it most likely refers to.
Search the web when the note looks like a merchant, app, or brand name you are not certain about. The currency hints at the country.
Reply with one or two plain sentences describing the business or what was bought, for example: "Breadfast is an Egyptian grocery delivery app."
Do not suggest a budget category. If you still cannot tell, reply exactly ${UNKNOWN_REPLY}.`;

/**
 * Jev and the research LLM both run through Vercel AI Gateway with one key.
 * Routing is restricted to providers that do not train on prompts, and the LLM
 * additionally to providers with zero data retention.
 */
export function createGatewayCategorizer(apiKey: string): TransactionCategorizer {
  const gateway = createGateway({ apiKey });

  const models: CategorizerModels = {
    async evaluate({ state, questions }, signal) {
      const result = await experimental_evaluate({
        model: gateway.evaluationModel(JEV_MODEL),
        state,
        questions,
        abortSignal: signal,
        providerOptions: { gateway: { disallowPromptTraining: true } },
      });
      return {
        category: result.answers.category,
        recognized: "recognized" in result.answers ? result.answers.recognized : undefined,
      };
    },

    async research(request: ResearchRequest, signal) {
      const { text } = await generateText({
        model: gateway(RESEARCH_MODEL),
        system: RESEARCH_SYSTEM_PROMPT,
        prompt: JSON.stringify(request),
        tools: {
          search: gateway.tools.perplexitySearch({
            maxResults: 5,
            maxTokensPerPage: 512,
            maxTokens: 4000,
          }),
        },
        stopWhen: stepCountIs(3),
        maxOutputTokens: 200,
        abortSignal: signal,
        providerOptions: { gateway: { zeroDataRetention: true, disallowPromptTraining: true } },
      });
      const context = text.trim();
      if (!context || context.toUpperCase().startsWith(UNKNOWN_REPLY)) return null;
      return context.slice(0, MAX_CONTEXT_LENGTH);
    },
  };

  return { categorize: (request, options) => categorizeNote(request, models, options) };
}
