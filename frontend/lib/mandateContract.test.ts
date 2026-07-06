import { contract } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { runContractWrite } from "./mandateContract";

type FakeSent = {
  sendTransactionResponse?: { hash: string };
  result: unknown;
};

function fakeAssembledTransaction(sent: FakeSent) {
  return {
    signAndSend: async () => sent,
  } as unknown as contract.AssembledTransaction<unknown>;
}

describe("runContractWrite", () => {
  it("reports success and the transaction hash when the call succeeds", async () => {
    const result = await runContractWrite(
      async () =>
        fakeAssembledTransaction({
          sendTransactionResponse: { hash: "abc123" },
          result: undefined,
        }),
      () => {}
    );

    expect(result.status).toBe("success");
    expect(result.hash).toBe("abc123");
  });

  it("surfaces a contract-level Result::Err as an error", async () => {
    const result = await runContractWrite(
      async () =>
        fakeAssembledTransaction({
          sendTransactionResponse: { hash: "def456" },
          result: {
            isErr: () => true,
            isOk: () => false,
            unwrap: () => {
              throw new Error("not ok");
            },
            unwrapErr: () => ({ message: "Insufficient mandate balance for this spend" }),
          },
        }),
      () => {}
    );

    expect(result.status).toBe("error");
    expect(result.message).toBe("Insufficient mandate balance for this spend");
    expect(result.hash).toBe("def456");
  });

  it("reports a rejected transaction distinctly from other failures", async () => {
    const result = await runContractWrite(async () => {
      throw new contract.AssembledTransaction.Errors.UserRejected("declined");
    }, () => {});

    expect(result.status).toBe("error");
    expect(result.message).toBe("Transaction was rejected in your wallet.");
  });

  it("falls back to the thrown error's message for unexpected failures", async () => {
    const result = await runContractWrite(async () => {
      throw new Error("network unreachable");
    }, () => {});

    expect(result.status).toBe("error");
    expect(result.message).toBe("network unreachable");
  });
});
