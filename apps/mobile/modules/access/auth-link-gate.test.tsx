import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";

import { AuthLinkGate } from "./auth-link-gate";

describe("AuthLinkGate", () => {
  it("is inert after the AuthKit cutover", async () => {
    const view = await render(<AuthLinkGate />);
    expect(view.toJSON()).toBeNull();
  });
});
