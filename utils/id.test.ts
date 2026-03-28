jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "generated-id"),
}));

import { generateId } from "@/utils/id";

describe("generateId", () => {
  it("returns a UUID from expo-crypto", () => {
    expect(generateId()).toBe("generated-id");
  });
});
