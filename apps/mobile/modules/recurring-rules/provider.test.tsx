import { render } from "@testing-library/react-native";

import {
  RecurringRulesProvider,
  useRecurringRulesModule,
} from "@/modules/recurring-rules/provider";

const firstDatabase = { id: "first" };
const secondDatabase = { id: "second" };
const mockCreateRecurringRules = jest.fn(({ database }) => ({ database }));
let mockCurrentDatabase: object = firstDatabase;
let observedModule: unknown;

jest.mock("@/db/sqlite", () => ({
  useSQLiteContext: () => mockCurrentDatabase,
}));

jest.mock("@/modules/recurring-rules/recurring-rules", () => ({
  createRecurringRules: (options: unknown) => mockCreateRecurringRules(options),
}));

function Observer() {
  observedModule = useRecurringRulesModule();
  return null;
}

describe("RecurringRulesProvider", () => {
  beforeEach(() => {
    mockCurrentDatabase = firstDatabase;
    mockCreateRecurringRules.mockClear();
  });

  it("keeps one module per live SQLite connection", async () => {
    const view = await render(
      <RecurringRulesProvider>
        <Observer />
      </RecurringRulesProvider>,
    );

    const firstModule = observedModule;
    await view.rerender(
      <RecurringRulesProvider>
        <Observer />
      </RecurringRulesProvider>,
    );
    expect(observedModule).toBe(firstModule);
    expect(mockCreateRecurringRules).toHaveBeenCalledTimes(1);

    mockCurrentDatabase = secondDatabase;
    await view.rerender(
      <RecurringRulesProvider>
        <Observer />
      </RecurringRulesProvider>,
    );
    expect(observedModule).not.toBe(firstModule);
    expect(mockCreateRecurringRules).toHaveBeenCalledTimes(2);
  });
});
