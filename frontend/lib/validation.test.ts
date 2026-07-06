import { describe, expect, it } from "vitest";
import { isValidStellarAddress } from "./validation";

describe("isValidStellarAddress", () => {
  it("accepts a well-formed Stellar public key", () => {
    expect(
      isValidStellarAddress("GAQP5RB3XEYMLGQ6YXZFUX2HYCMISVM5CPVKQH6RFINPDBCRWBM4NYNY")
    ).toBe(true);
  });

  it("rejects a string that is too short", () => {
    expect(isValidStellarAddress("GAQP5RB3XEYMLGQ6YXZ")).toBe(false);
  });

  it("rejects a string with the wrong prefix", () => {
    expect(
      isValidStellarAddress("CAQP5RB3XEYMLGQ6YXZFUX2HYCMISVM5CPVKQH6RFINPDBCRWBM4NYNY")
    ).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidStellarAddress("")).toBe(false);
  });
});
