import { describe, expect, it } from "vitest";
import { describeHorizonError } from "./stellar";

describe("describeHorizonError", () => {
  it("extracts Horizon's transaction and operation result codes when present", () => {
    const err = {
      response: {
        data: {
          extras: {
            result_codes: {
              transaction: "tx_failed",
              operations: ["op_underfunded"],
            },
          },
        },
      },
    };

    expect(describeHorizonError(err)).toBe("Transaction rejected: tx_failed, op_underfunded");
  });

  it("falls back to the error's message when there are no result codes", () => {
    expect(describeHorizonError(new Error("network unreachable"))).toBe("network unreachable");
  });

  it("falls back to a generic message for non-Error values", () => {
    expect(describeHorizonError("boom")).toBe("Transaction failed");
  });
});
