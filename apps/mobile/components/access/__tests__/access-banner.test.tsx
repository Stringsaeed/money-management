import { render } from "@testing-library/react-native";

import { AccessBanner } from "@/components/access/access-banner";
import { BANNER_TOAST_IDS } from "@/components/banner/banner-channel";
import { toast } from "@/lib/sonner";
import { useAccess, type AccessState } from "@/modules/access";
import { useBannerDismissStore } from "@/stores/banner-dismiss-store";

// SAFETY: jest/setup-env.ts installs useAccess as a jest.fn with this AccessState shape.
const mockUseAccess = useAccess as jest.MockedFunction<typeof useAccess>;

const anonymousAccess: AccessState = {
  kind: "anonymous",
  beginAuth: jest.fn(),
};

describe("AccessBanner", () => {
  it("dismisses the access toast when the session is not revoked", async () => {
    mockUseAccess.mockReturnValue(anonymousAccess);

    await render(<AccessBanner />);

    expect(toast.dismiss).toHaveBeenCalledWith(BANNER_TOAST_IDS.access);
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("presents a persistent session-revoked toast with reauthenticate action", async () => {
    const reauthenticate = jest.fn();
    const revokedAccess: AccessState = {
      kind: "session_revoked",
      lastKnown: { userId: "user-1", email: "a@b.c", displayName: "A" },
      reauthenticate,
      signOut: jest.fn(async () => undefined),
    };
    mockUseAccess.mockReturnValue(revokedAccess);

    await render(<AccessBanner />);

    expect(toast.warning).toHaveBeenCalledWith(
      "Signed out remotely",
      expect.objectContaining({
        id: BANNER_TOAST_IDS.access,
        duration: Number.POSITIVE_INFINITY,
        action: expect.objectContaining({ label: "Sign in again" }),
      }),
    );

    // SAFETY: toast.warning mock records ExternalToast with action.onClick.
    const options = (toast.warning as jest.Mock).mock.calls[0]?.[1] as {
      action: { onClick: () => void };
    };
    options.action.onClick();
    expect(reauthenticate).toHaveBeenCalled();
  });

  it("does not re-present after the same revoked incident is dismissed", async () => {
    const revokedAccess: AccessState = {
      kind: "session_revoked",
      lastKnown: { userId: "user-1", email: "a@b.c", displayName: "A" },
      reauthenticate: jest.fn(),
      signOut: jest.fn(async () => undefined),
    };
    mockUseAccess.mockReturnValue(revokedAccess);
    useBannerDismissStore.getState().dismiss("access", "session_revoked");

    await render(<AccessBanner />);

    expect(toast.warning).not.toHaveBeenCalled();
  });
});
