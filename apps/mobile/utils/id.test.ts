import { generateId } from "@/utils/id";

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "generated-id"),
}));

describe("generateId", () => {
  it("returns a UUID from expo-crypto", () => {
    expect(generateId()).toBe("generated-id");
  });
});
