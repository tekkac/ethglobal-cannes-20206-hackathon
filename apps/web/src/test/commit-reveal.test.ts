import { createCommitment, verifyCommitment } from "@/lib/services/commit-reveal";

describe("commit reveal", () => {
  it("creates a commitment that verifies for the same action and secret", () => {
    const commitment = createCommitment("SPLIT");

    expect(
      verifyCommitment({
        action: commitment.action,
        secret: commitment.secret,
        commitment: commitment.commitment,
      }),
    ).toBe(true);
  });

  it("rejects a mismatched reveal", () => {
    const commitment = createCommitment("SPLIT");

    expect(
      verifyCommitment({
        action: "STEAL",
        secret: commitment.secret,
        commitment: commitment.commitment,
      }),
    ).toBe(false);
  });
});
