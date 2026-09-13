import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useEditAccountForm } from "@/components/account/form";
import { createAccount } from "@/tests/test-utils/factories";

const mockUpdateAccount = jest.fn();
let mockUpdateSource: "local" | "synced" = "local";

jest.mock("@/hooks/use-accounts", () => ({
  useCreateAccount: () => ({ mutateAsync: jest.fn() }),
  useUpdateAccount: () => ({ mutateAsync: mockUpdateAccount, source: mockUpdateSource }),
}));

describe("useEditAccountForm", () => {
  beforeEach(() => {
    mockUpdateSource = "local";
    mockUpdateAccount.mockReset();
  });

  it("updates name, type, currency, and icon without changing the balance", async () => {
    mockUpdateAccount.mockResolvedValue(undefined);
    const account = createAccount({
      id: "account-1",
      name: "Wallet",
      type: "checking",
      currency: "USD",
      color: "#8B9D83",
      icon: "banknote.fill",
      initialBalance: 250_00,
    });

    const onUpdated = jest.fn();
    const { result } = await renderHook(() => useEditAccountForm({ account, onUpdated }));

    await act(async () => {
      result.current.setFieldValue("name", "Travel");
      result.current.setFieldValue("type", "savings");
      result.current.setFieldValue("currency", "EUR");
      result.current.setFieldValue("icon", "🏦");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(mockUpdateAccount).toHaveBeenCalled();
    });

    expect(mockUpdateAccount).toHaveBeenCalledWith({
      id: "account-1",
      data: {
        color: "#8B9D83",
        currency: "EUR",
        icon: "🏦",
        name: "Travel",
        type: "savings",
      },
    });
    expect(mockUpdateAccount.mock.calls[0]?.[0].data.initialBalance).toBeUndefined();
    expect(onUpdated).toHaveBeenCalled();
  });

  it("omits type and currency on a synced Account edit", async () => {
    mockUpdateSource = "synced";
    mockUpdateAccount.mockResolvedValue(undefined);
    const account = createAccount({
      id: "account-1",
      name: "Wallet",
      type: "checking",
      currency: "USD",
      color: "#8B9D83",
      icon: "banknote.fill",
    });

    const { result } = await renderHook(() => useEditAccountForm({ account }));

    await act(async () => {
      result.current.setFieldValue("name", "Travel");
      result.current.setFieldValue("type", "savings");
      result.current.setFieldValue("currency", "EUR");
      result.current.setFieldValue("icon", "🏦");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(mockUpdateAccount).toHaveBeenCalled();
    });

    expect(mockUpdateAccount).toHaveBeenCalledWith({
      id: "account-1",
      data: {
        color: "#8B9D83",
        icon: "🏦",
        name: "Travel",
      },
    });
  });
});
