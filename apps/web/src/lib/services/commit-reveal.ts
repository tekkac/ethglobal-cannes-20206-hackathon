import { createHash, randomUUID } from "node:crypto";

import type { FinalAction } from "@agent-duel/shared";

function hashCommitment(action: FinalAction, secret: string) {
  return createHash("sha256").update(`${action}:${secret}`).digest("hex");
}

export function createCommitment(action: FinalAction) {
  const secret = randomUUID().replaceAll("-", "");

  return {
    action,
    secret,
    commitment: hashCommitment(action, secret),
  };
}

export function verifyCommitment({
  action,
  secret,
  commitment,
}: {
  action: FinalAction;
  secret: string;
  commitment: string;
}) {
  return hashCommitment(action, secret) === commitment;
}
