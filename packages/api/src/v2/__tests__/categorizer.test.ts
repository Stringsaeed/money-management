import { describe, expect, it } from "vitest";

import {
  buildJevRequest,
  categorizeNote,
  labelCategories,
  type CategorizerModels,
  type CategorizeRequest,
  type JevAnswers,
  type JevRequest,
  type ResearchRequest,
} from "../categorizer";

const categories = [
  { id: "groceries", name: "Groceries" },
  { id: "dining", name: "Dining" },
  { id: "transport", name: "Transport" },
];

const breadfast: CategorizeRequest = {
  note: "  Breadfast ",
  kind: "expense",
  currency: "EGP",
  categories,
};

interface Recorder {
  readonly models: CategorizerModels;
  readonly jevRequests: JevRequest[];
  readonly researchRequests: ResearchRequest[];
}

function recordingModels(answers: readonly JevAnswers[], research: string | null = null): Recorder {
  const jevRequests: JevRequest[] = [];
  const researchRequests: ResearchRequest[] = [];
  return {
    jevRequests,
    researchRequests,
    models: {
      evaluate: async (request) => {
        jevRequests.push(request);
        const answer = answers[jevRequests.length - 1];
        if (!answer) throw new Error("Jev was asked more often than the test expected.");
        return answer;
      },
      research: async (request) => {
        researchRequests.push(request);
        return research;
      },
    },
  };
}

const choice = (label: string, probability: number): JevAnswers["category"] => ({
  choice: label,
  probabilities: { [label]: probability },
});

describe("labelCategories", () => {
  it("keeps names as labels, suffixes duplicates, and avoids a taken no-match label", () => {
    const labels = labelCategories([
      { id: "a", name: "Other" },
      { id: "b", name: "Food" },
      { id: "c", name: "food" },
    ]);
    expect([...labels.categories.entries()]).toEqual([
      ["Other", "a"],
      ["Food", "b"],
      ["food (2)", "c"],
    ]);
    expect(labels.noMatch).toBe("none of these");
  });
});

describe("buildJevRequest", () => {
  it("sends only the note, kind, currency, and category names, plus the no-match option", () => {
    const request = buildJevRequest(breadfast, labelCategories(categories));
    expect(request.state).toEqual({
      transaction: { note: "  Breadfast ", kind: "expense", currency: "EGP" },
    });
    expect(Object.keys(request.questions.category.criteria)).toEqual([
      "Groceries",
      "Dining",
      "Transport",
      "other",
    ]);
    expect(request.questions.recognized?.type).toBe("boolean");
  });

  it("adds research as merchant context and drops the recognition question", () => {
    const request = buildJevRequest(
      breadfast,
      labelCategories(categories),
      "Breadfast is a grocery delivery app.",
    );
    expect(request.state).toMatchObject({
      merchant_context: "Breadfast is a grocery delivery app.",
    });
    expect(request.questions.recognized).toBeUndefined();
  });
});

describe("categorizeNote", () => {
  it("accepts a confident, recognized first answer without researching", async () => {
    const recorder = recordingModels([
      { category: choice("Transport", 0.93), recognized: { probability: 0.9 } },
    ]);
    await expect(categorizeNote({ ...breadfast, note: "Uber" }, recorder.models)).resolves.toEqual({
      categoryId: "transport",
      stage: "jev",
    });
    expect(recorder.researchRequests).toHaveLength(0);
  });

  it("researches an unfamiliar note even when Jev guesses a category", async () => {
    const recorder = recordingModels(
      [
        { category: choice("Dining", 0.7), recognized: { probability: 0.2 } },
        { category: choice("Groceries", 0.88) },
      ],
      "Breadfast is an Egyptian grocery delivery app.",
    );
    await expect(categorizeNote(breadfast, recorder.models)).resolves.toEqual({
      categoryId: "groceries",
      stage: "research",
    });
    expect(recorder.researchRequests).toEqual([
      { note: "Breadfast", kind: "expense", currency: "EGP" },
    ]);
    expect(recorder.jevRequests[1]?.state).toMatchObject({
      merchant_context: "Breadfast is an Egyptian grocery delivery app.",
    });
  });

  it("researches when Jev picks the no-match option", async () => {
    const recorder = recordingModels(
      [
        { category: choice("other", 0.8), recognized: { probability: 0.9 } },
        { category: choice("Groceries", 0.6) },
      ],
      "A grocery app.",
    );
    await expect(categorizeNote(breadfast, recorder.models)).resolves.toMatchObject({
      categoryId: "groceries",
    });
  });

  it("leaves the transaction alone when research finds nothing", async () => {
    const recorder = recordingModels([
      { category: choice("Dining", 0.4), recognized: { probability: 0.9 } },
    ]);
    await expect(categorizeNote(breadfast, recorder.models)).resolves.toEqual({
      categoryId: null,
      stage: "unknown",
    });
    expect(recorder.jevRequests).toHaveLength(1);
  });

  it("leaves the transaction alone when Jev stays unsure after research", async () => {
    const recorder = recordingModels(
      [
        { category: choice("other", 0.9), recognized: { probability: 0.1 } },
        { category: choice("Dining", 0.35) },
      ],
      "Could be a bakery or a grocery app.",
    );
    await expect(categorizeNote(breadfast, recorder.models)).resolves.toEqual({
      categoryId: null,
      stage: "unknown",
    });
  });

  it("stops before research when the research quota is spent", async () => {
    const recorder = recordingModels(
      [{ category: choice("Dining", 0.7), recognized: { probability: 0.2 } }],
      "Never used.",
    );
    await expect(
      categorizeNote(breadfast, recorder.models, { allowResearch: async () => false }),
    ).resolves.toEqual({ categoryId: null, stage: "unknown" });
    expect(recorder.researchRequests).toHaveLength(0);
  });

  it("treats an answer without probabilities as unsure", async () => {
    const recorder = recordingModels([
      { category: { choice: "Transport" }, recognized: { probability: 0.9 } },
    ]);
    await expect(categorizeNote(breadfast, recorder.models)).resolves.toMatchObject({
      categoryId: null,
    });
    expect(recorder.researchRequests).toHaveLength(1);
  });

  it("skips blank notes and ledgers with fewer than two categories without calling any model", async () => {
    const recorder = recordingModels([]);
    await expect(categorizeNote({ ...breadfast, note: "   " }, recorder.models)).resolves.toEqual({
      categoryId: null,
      stage: "skipped",
    });
    await expect(
      categorizeNote({ ...breadfast, categories: [] }, recorder.models),
    ).resolves.toEqual({ categoryId: null, stage: "skipped" });
    await expect(
      categorizeNote({ ...breadfast, categories: [categories[0]!] }, recorder.models),
    ).resolves.toEqual({ categoryId: null, stage: "skipped" });
    expect(recorder.jevRequests).toHaveLength(0);
  });
});
